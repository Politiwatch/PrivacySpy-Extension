setBadgeRating(5.4);

function setBadgeRating(rating, hasWarning) {
    if (rating >= 7) {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#23d160" });
    } else if (rating >= 4.5 && rating < 7) {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#ebbc00" });
    } else {
        chrome.browserAction.setBadgeBackgroundColor({ color: "#ff3860" });
    }

    if (!hasWarning) {
        chrome.browserAction.setBadgeText({ text: rating.toString() });
    } else {
        chrome.browserAction.setBadgeText({ text: "!" });
    }

    try {
        chrome.browserAction.setBadgeTextColor({ color: "#ffffff" });
    } catch (e) {
        console.log("Couldn't set badge text color (perhaps using Chrome?)");
    }
}
