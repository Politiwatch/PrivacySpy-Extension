if (typeof browser === 'undefined') {
    browser = chrome;
}

browser.storage.local.get(['database_last_updated'], function (data) {
    if (data.database_last_updated === undefined) {
        document.getElementById("warnings").classList.add("black");
        document.getElementById("warnings").classList.add("light-grey-background");
        document.getElementById("warnings").innerText = "PrivacySpy's database has not been downloaded yet. Please give it a moment or try restarting your browser.";
        document.getElementById("see-breakdown").innerText = "Explore directory on privacyspy.org";
        document.getElementById("see-breakdown").onclick = function () {
            chrome.tabs.create({
                url: "https://privacyspy.org/"
            });
        };
        document.getElementById("score").classList.add("hidden");
    }
})

browser.storage.local.get(['current_product'], function (data) {
    if (data.current_product === undefined) {
        document.getElementById("warnings").classList.add("black");
        document.getElementById("warnings").classList.add("light-grey-background");
        document.getElementById("warnings").innerText = "PrivacySpy's database has not been downloaded yet. Please give it a moment or try restarting your browser.";
        document.getElementById("see-breakdown").innerText = "Explore directory on privacyspy.org";
        document.getElementById("see-breakdown").onclick = function () {
            chrome.tabs.create({
                url: "https://privacyspy.org/"
            });
        };
        document.getElementById("score").classList.add("hidden");

        return;
    }
    if (data.current_product.type !== "success") {
        document.getElementById("see-breakdown").onclick = function () {
            chrome.tabs.create({
                url: "https://privacyspy.org/"
            });
        }
        document.getElementById("service-name").classList.add("hidden");
        document.getElementById("service-domain").classList.add("hidden");
        document.getElementById("score").classList.add("hidden");
        document.getElementById("warnings").classList.add("black");
        document.getElementById("warnings").classList.add("light-grey-background");
        document.getElementById("highlights").classList.add("hidden");
    }
    if (data.current_product.type === "empty") {
        document.getElementById("see-breakdown").innerText = "Explore directory on privacyspy.org";
        document.getElementById("warnings").innerText = "Please open a website to see its privacy policy rating.";
    } else if (data.current_product.type === "failure") {
        document.getElementById("see-breakdown").innerText = "Consider adding on privacyspy.org";
        document.getElementById("warnings").innerText = "Unfortunately, PrivacySpy does not contain a privacy policy for this website.";
    } else {
        product = data.current_product.result;

        document.getElementById("service-name").innerText = product.name;
        document.getElementById("service-domain").innerText = product.hostname;
        if (product.has_warnings_active) {
            document.getElementById("warnings").innerText = "There are active warnings published for " + product.name + ".";
            document.getElementById("warnings").classList.add("red");
            document.getElementById("warnings").classList.add("light-red-background");
        } else {
            document.getElementById("warnings").innerText = "There are no active warnings published for " + product.name + ".";
            document.getElementById("warnings").classList.add("green");
            document.getElementById("warnings").classList.add("light-green-background");
        }
        if (product.has_highlights) {
            document.getElementById("highlights").classList.add("block");
        } else {
        }
        if (product.score !== null) {
            document.getElementById("score-value").innerText = product.score.toFixed(1).toString();
            document.getElementById("score").classList.add("block");
        } else {
            document.getElementById("score").classList.add("hidden");
        }
        if (product.score >= 7) {
            document.getElementById("score").classList.add("green");
        } else if (product.score >= 4 && product.score < 7) {
            document.getElementById("score").classList.add("yellow");
        } else {
            document.getElementById("score").classList.add("red");
        }
        document.getElementById("see-breakdown").onclick = function () {
            chrome.tabs.create({
                url: "https://privacyspy.org/product/" + product.slug
            });
        }
    }
});