let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("starting script", appName, version)

let blockedUsers = null;
let contents = document.getElementById("content");
const blockedUsersKey = "blocked_users";
const enabledKey = "enable_script";
const youtubeItemKey = "ytd-rich-item-renderer";
const youtubeSectionKey = "ytd-rich-section-renderer";
const youtubeUserLinkKey = ".ytAttributedStringLink";
const hideShortsOptionKey = "hide_shorts";
let updateTimeout = null;

let getHideShorts = async () => {
    let enableObject = await browser.storage.local.get([hideShortsOptionKey]);
    return Object.values(enableObject)[0];
}

let getEnabled = async () => {
    let enableObject = await browser.storage.local.get([enabledKey]);
    return Object.values(enableObject)[0];
}

let getBlockedList = async () => {
    let bul = await browser.storage.local.get({ [blockedUsersKey]: [] });
    blockedUsers = Object.values(bul)[0];
}

let clean = () => {
    let path = document.location.pathname;
    switch (path) {
        case "/":
            contents.querySelectorAll(youtubeItemKey).forEach(item => {
                let href = item.querySelector(youtubeUserLinkKey)?.getAttribute("href");
                // TODO : if no href, get channelTitle and check against channelTitle array
                if (!href || blockedUsers.includes(href)) {
                    item.remove();
                }
            });
            getHideShorts().then(value => {
                if (value) {
                    document.querySelectorAll(youtubeSectionKey).forEach(element => {
                        element.remove();
                    });
                }
            });
            break;
        case "/results":
            contents.querySelectorAll("ytd-video-renderer").forEach(item => {
                let textContainer = item.querySelector("#text-container");
                let channelName = textContainer.querySelector(".yt-simple-endpoint").getAttribute("href");
                console.log("channelName", channelName);
                if (blockedUsers.includes(channelName)) {
                    console.log("blocked channel", channelName);
                    item.remove();
                }
            });
            break;
        case "/watch":
            // the  /Watch endpoint does not use channel links for channel name...
            // TODO : Need to get the channel title on add, and hold it in another array for lookup, change storage to a map.
            ////*\/*\\\\
            contents.querySelectorAll("yt-lockup-view-model").forEach(item => {
                let parent = item.querySelector(".ytContentMetadataViewModelMetadataRow")
                let channelTitle = parent.querySelector(".ytAttributedStringHost").innerText;
                if (channelTitle.includes(" • ")) {
                    console.log("removing youtube slop element")
                    item.remove();
                }
                // TODO : lookup channel title
                // if (!channelTitle) return;
                // if (blockedChannels.includes(channelTitle)) {item.remove();}
            });
            ////*\/*\\\\
            console.log("TODO : fix this")
            break;
        default:
            console.log("unknown path", path);
            break;
    }
};

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === "clean") {
        getBlockedList().then(() => {
            clean();
        });
    }
});

browser.storage.onChanged.addListener((changes, areaName) => {
    if (changes.hasOwnProperty(blockedUsersKey)) {
        getBlockedList().then(() => {
            clean();
        });
    }
});

const observer = new MutationObserver((mutationList, observer) => {
    getEnabled().then((enableScript) => {
        if (enableScript) {
            for (const mutation of mutationList) {
                if (mutation.type === "childList") {
                    let mutations = mutation.addedNodes;
                    for (let i = 0; i < mutations.length; i++) {
                        if (mutations[i].nodeType === 1 && mutations[i].matches(youtubeItemKey) && updateTimeout == null) {
                            updateTimeout = setTimeout(() => {
                                getBlockedList().then(() => {
                                    clean();
                                });
                                updateTimeout = null;
                            }, 500);
                            break;
                        }
                    }
                }
            }
        }
    })
});

observer.observe(contents, { childList: true, subtree: true });

// TODO : onload
getBlockedList().then(() => {
    clean();
});