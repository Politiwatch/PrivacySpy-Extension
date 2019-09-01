chrome.runtime.onMessage.addListener(function (msg, sender) {
    console.log(sender.tab ?
        "from a content script:" + sender.tab.url :
        "from the extension"
    );
    if (msg.type === "success") {
        alert(msg);
        setBadgeRating(msg.result.score);
    } else if (msg.type === "failure") {
        alert(msg);
    }
});
