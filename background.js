var BASE_URL = "https://privacyspy.org";

if (typeof browser === "undefined") {
  var browser = chrome;
}

var db;

var cache = {};

var request = window.indexedDB.open("ProductsDatabase", 5);

request.onerror = function (event) {
  console.log("Error loading database! Error: " + event.target.errorCode);
};

request.onsuccess = function (event) {
  db = event.target.result;

  updateDatabase();
};

request.onupgradeneeded = function (event) {
  db = event.target.result;

  db.onerror = function (event) {
    console.log("Error loading database! Error: " + event.target);
  };

  if (db.objectStoreNames.contains("products-v2")) {
    db.deleteObjectStore("products-v2");
  }

  var objectStore = db.createObjectStore("products-v2", {
    keyPath: "hostname",
  });

  objectStore.createIndex("name", "name", {
    unique: false,
  });
  objectStore.createIndex("description", "description", {
    unique: false,
  });
  objectStore.createIndex("hostname", "hostname", {
    unique: false,
  });
  objectStore.createIndex("slug", "slug", {
    unique: false,
  });
  objectStore.createIndex("score", "score", {
    unique: false,
  });

  objectStore.transaction.oncomplete = function (event) {
    updateDatabase();
  };
};

function getDomainName(url) {
  if (url.startsWith("http")) {
    return url
      .replace("http://", "")
      .replace("https://", "")
      .replace("www.", "")
      .split(/[/?#]/)[0];
  }

  return null;
}

function updateDatabase() {
  cache = {};
  browser.storage.local.get(["database_last_updated"], function (data) {
    if (data.database_last_updated === undefined) {
      downloadDatabase();
    } else {
      if (
        Date.now() > data.database_last_updated + 1000 * 60 * 60 * 24 ||
        true
      ) {
        downloadDatabase();
      }
    }
  });
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function downloadDatabase() {
  console.log("Updating the database...");
  fetch(BASE_URL + "/api/v2/index.json")
    .then((response) => {
      return response.json();
    })
    .then((products) => {
      var objectStore = db
        .transaction("products-v2", "readwrite")
        .objectStore("products-v2");
      browser.storage.local.set({
        database_last_updated: Date.now(),
      });
      products.forEach((product) => {
        product.hostnames.forEach((hostname) => {
          objectStore.delete(hostname.trim());
          tempObj = clone(product);
          tempObj.hostname = hostname;
          objectStore.add(tempObj);
        });
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
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    browser.browserAction.setIcon({
      path: "icons/privacyspy-48-light.png",
    });
  } else {
    browser.browserAction.setIcon({
      path: "icons/privacyspy-48-dark.png",
    });
  }

  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    function (tabs) {
      if (tabs[0] !== undefined) {
        var url = tabs[0].url;
        hostname = getDomainName(url);
        chrome.browserAction.setBadgeText({
          text: "",
        });
        if (hostname) {
          getHostnameInformation(hostname);
        } else {
          browser.storage.local.set({
            current_product: {
              type: "empty",
            },
          });
        }
      }
    }
  );
}

function getHostnameInformation(hostname) {
  if (cache[hostname] !== undefined) {
    browser.storage.local.set({
      current_product: {
        type: "success",
        result: cache[hostname],
      },
    });
  }

  try {
    var transaction = db.transaction("products-v2", "readwrite");
  } catch (e) {
    console.log("Error when opening the database: " + e);
    browser.storage.local.remove(["current_product", "database_last_updated"]);
    return;
  }

  try {
    transaction.onerror = function () {
      parts = hostname.split(".");
      if (parts.length == 1) {
        browser.storage.local.set({
          current_product: {
            type: "failure",
          },
        });
        chrome.browserAction.setBadgeText({
          text: "",
        });
        return;
      }
      parts.shift();
      stripped_url = parts.join(".");
      getHostnameInformation(stripped_url);
    };
  } catch (e) {
    console.log("Error when opening the database: " + e);
    browser.storage.local.remove(["current_product", "database_last_updated"]);
    return;
  }

  objectStore = transaction.objectStore("products-v2");

  objectStore.get(hostname, {
    keyPath: "hostname",
  }).onsuccess = function (event) {
    if (event.target.result) {
      browser.storage.local.set({
        current_product: {
          type: "success",
          result: event.target.result,
        },
      });
      setBadgeRating(event.target.result.score);
    } else {
      parts = hostname.split(".");
      if (parts.length == 1) {
        browser.storage.local.set({
          current_product: {
            type: "failure",
          },
        });
        chrome.browserAction.setBadgeText({
          text: "",
        });
        return;
      }
      parts.shift();
      stripped_url = parts.join(".");
      getHostnameInformation(stripped_url);
    }
  };
}

function setBadgeRating(rating) {
  if (rating >= 7) {
    browser.browserAction.setBadgeBackgroundColor({
      color: "#757575",
    });
  } else if (rating >= 4) {
    browser.browserAction.setBadgeBackgroundColor({
      color: "#757575",
    });
  } else {
    browser.browserAction.setBadgeBackgroundColor({
      color: "#f03009",
    });
  }

  if (rating != null) {
    chrome.browserAction.setBadgeText({
      text: rating.toFixed(1).toString(),
    });
  }

  try {
    chrome.browserAction.setBadgeTextColor({
      color: "#ffffff",
    });
  } catch (e) {}
}

if (
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches
) {
  browser.browserAction.setIcon({
    path: "icons/privacyspy-48-light.png",
  });
}

window.matchMedia("(prefers-color-scheme: dark)").addEventListener((e) => {
  const colorScheme = e.matches ? "dark" : "light";
  console.log("hello");
  browser.browserAction.setIcon({
    path: "icons/privacyspy-48-" + colorScheme + ".png",
  });
});
