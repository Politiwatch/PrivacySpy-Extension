function getDomainName(url) {
    return url.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
}

function logTabs(tabs) {
    document.getElementById("popup-content").innerHTML = getDomainName(tabs[0].url);
}

function onError(error) {
    console.log(`Error: ${error}`);
}

browser.tabs.query({ currentWindow: true, active: true })
    .then(logTabs, onError);