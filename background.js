var BASE_URL = "https://privacyspy.org";

if (typeof browser === 'undefined') {
    var browser = chrome;
}

var db;

var cache = {};

var request = window.indexedDB.open("ProductsDatabase", 1);

request.onerror = function (event) {
    console.log("Error loading database! Error: " + event.target.errorCode);
}

request.onsuccess = function (event) {
    db = event.target.result;

    updateDatabase();
}

request.onupgradeneeded = function (event) {
    db = event.target.result;

    db.onerror = function (event) {
        console.log("Error loading database! Error: " + event.target.errorCode);
    };

    var objectStore = db.createObjectStore("products", { keyPath: "hostname" });

    objectStore.createIndex("name", "name", { unique: false });
    objectStore.createIndex("hostname", "hostname", { unique: true });
    objectStore.createIndex("slug", "slug", { unique: true });
    objectStore.createIndex("score", "score", { unique: false });
    objectStore.createIndex("last_updated", "last_updated", { unique: false });
    objectStore.createIndex("has_warnings_active", "has_warnings_active", { unique: false });

    objectStore.transaction.oncomplete = function (event) {
        updateDatabase();
    }
}

function getDomainName(url) {
    if (url.startsWith("http"))
        return url.replace('http://', '').replace('https://', '').replace('www.', '').split(/[/?#]/)[0];
    else
        return null;
}

function updateDatabase() {
    browser.storage.local.get(['database_last_updated'], function (data) {
        if (data.database_last_updated === undefined) {
            downloadDatabase();
        } else {
            if (Date.now() > data.database_last_updated + 1000 * 60 * 60 * 24) {
                downloadDatabase();
            }
        }
    });
}

function downloadDatabase() {
    browser.storage.local.set({ 'database_last_updated': Date.now() })
    fetch("https://privacyspy.org/api/retrieve_database")
        .then(response => {
            return response.json();
        })
        .then(products => {
            var objectStore = db.transaction("products", "readwrite").objectStore("products");
            products.forEach(product => {
                objectStore.add(product);
            });
        });
}

chrome.tabs.onUpdated.addListener(handleTabUpdate);
chrome.tabs.onActivated.addListener(handleTabUpdate);
chrome.tabs.onHighlighted.addListener(handleTabUpdate);
chrome.tabs.onCreated.addListener(handleTabUpdate);
chrome.tabs.onReplaced.addListener(handleTabUpdate);
chrome.windows.onCreated.addListener(handleTabUpdate);
chrome.windows.onFocusChanged.addListener(handleTabUpdate);

function handleTabUpdate() {
    chrome.tabs.query({ 'active': true, 'currentWindow': true }, function (tabs) {
        if (tabs[0] !== undefined) {
            var url = tabs[0].url;
            hostname = getDomainName(url);
            if (hostname) {
                getHostnameInformation(hostname);
            } else {
                browser.storage.local.set({ "current_product": { type: "empty" } });
                chrome.browserAction.setBadgeText({ text: "" });
            }
        }
    });
}

function getHostnameInformation(hostname) {
    if (cache[hostname] !== undefined) {
        browser.storage.local.set({ "current_product": { type: "success", result: cache[hostname] } });
    }

    try {
        var transaction = db.transaction("products", "readwrite");
    } catch (e) {
        console.log("Error when opening the database: " + e);
        browser.storage.local.remove(['current_product', 'database_last_updated']);
        return;
    }

    try {
        transaction.onerror = function () {
            parts = hostname.split('.')
            if (parts.length == 2) {
                browser.storage.local.set({ "current_product": { type: "failure" } });
                chrome.browserAction.setBadgeText({ text: "" });
                return;
            }
            parts.shift();
            stripped_url = parts.join('.');
            getHostnameInformation(stripped_url);
        }
    } catch (e) {
        console.log("Error when opening the database: " + e);
        browser.storage.local.remove(['current_product', 'database_last_updated']);
        return;
    }

    objectStore = transaction.objectStore("products");

    objectStore.get(hostname, { keyPath: "hostname" }).onsuccess = function (event) {
        if (event.target.result) {
            browser.storage.local.set({ "current_product": { type: "success", result: event.target.result } });
            setBadgeRating(event.target.result.score, event.target.result.has_warnings_active);
            // chrome.browserAction.document.getElementById("service-name").innerText = event.target.result.name;
        } else {
            parts = hostname.split('.')
            if (parts.length == 2) {
                browser.storage.local.set({ "current_product": { type: "failure" } });
                chrome.browserAction.setBadgeText({ text: "" });
                return;
            }
            parts.shift();
            stripped_url = parts.join('.');
            getHostnameInformation(stripped_url);
        }
    };
}

function setBadgeRating(rating, hasWarning) {
    if (rating >= 7) {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#23d160" });
    } else if (rating >= 4.5 && rating < 7) {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#ebbc00" });
    } else {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#ff3860" });
    }

    if (!hasWarning) {
        chrome.browserAction.setBadgeText({ text: rating.toFixed(1).toString() });
    } else {
        chrome.browserAction.setBadgeText({ text: "!" });
    }

    try {
        chrome.browserAction.setBadgeTextColor({ color: "#ffffff" });
    } catch (e) { }
}