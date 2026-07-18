let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("starting script", appName, version)

let blockedChannels = [];
let blockedUsers = [];
let contents = document.getElementById("content");
const blockDataKey = "block_data";
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
    blockedChannels = [];
    blockedUsers = [];
    let bul = await browser.storage.local.get({ [blockDataKey]: [] });
    Object.values(bul)[0].forEach(b => {
        let bs = b.split("|");
        blockedChannels.push(bs[0]);
        blockedUsers.push(bs[1]);
    })
}

let clean = () => {
    let path = document.location.pathname;
    switch (path) {
        case "/":
            contents.querySelectorAll(youtubeItemKey).forEach(item => {
                let href = item.querySelector(youtubeUserLinkKey)?.getAttribute("href");
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
                if (blockedUsers.includes(channelName)) {
                    item.remove();
                }
            });
            break;
        case "/watch":
            contents.querySelectorAll("yt-lockup-view-model").forEach(item => {
                let parent = item.querySelector(".ytContentMetadataViewModelMetadataRow")
                let channelTitle = parent.querySelector(".ytAttributedStringHost").innerText;
                getBlockedList().then(() => {
                    if (blockedChannels.includes(channelTitle)) {
                        item.remove();
                    }
                })
                if (channelTitle.includes(" • ")) {
                    item.remove();
                }
            });
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
    if (changes.hasOwnProperty(blockDataKey)) {
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