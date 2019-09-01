var BASE_URL = "https://privacyspy.org";

var db;

var request = window.indexedDB.open("ProductsDatabase", 3);

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

    var objectStore = db.createObjectStore("products", { keyPath: "slug" });

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

function updateDatabase() {
    var products = JSON.parse('[{"name": "Firefox", "hostname": "mozilla.org", "slug": "firefox", "score": 7.83333333333333, "last_updated": "2019-08-28T03:24:56.625Z", "has_warnings_active": false}, {"name": "1Password", "hostname": "1password.com", "slug": "1password", "score": 8.61111111111111, "last_updated": "2019-08-27T21:56:47.801Z", "has_warnings_active": false}, {"name": "Amazon", "hostname": "amazon.com", "slug": "amazon", "score": 4.47058823529412, "last_updated": "2019-08-29T22:43:59.598Z", "has_warnings_active": false}, {"name": "PrivacySpy", "hostname": "privacyspy.org", "slug": "privacyspy", "score": 9.52941176470588, "last_updated": "2019-08-31T21:03:42.289Z", "has_warnings_active": false}, {"name": "Facebook", "hostname": "facebook.com", "slug": "facebook", "score": 3.41176470588235, "last_updated": "2019-08-31T19:48:45.367Z", "has_warnings_active": true}]');
    /*fetch("https://privacyspy.org/retrieve_database")
        .then(response => {
            return response.json();
        })
        .then(jsonObj => {
            console.log(jsonObj);
        });*/

    var objectStore = db.transaction("products", "readwrite").objectStore("products");
    products.forEach(product => {
        objectStore.add(product);
    });
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
        var url = tabs[0].url;
        console.log("URL: " + url);
    });
});