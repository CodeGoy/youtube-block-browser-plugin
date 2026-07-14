let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("starting script", appName, version)

let blockedUsers = null;
let lastRightClickedElement = null;
let contents = document.getElementById("content");
const blockedUsersKey = "blocked_users";
const enabledKey = "enable_script";
const youtubeItemKey = "ytd-rich-item-renderer";
const youtubeSectionKey = "ytd-rich-section-renderer";
const youtubeUserLinkKey = ".ytAttributedStringLink";
const hideShortsOptionKey = "hide_shorts";

document.addEventListener("contextmenu", (event) => {
    lastRightClickedElement = event.target;
}, true);

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === "target" && lastRightClickedElement) {
        let userToBlock = lastRightClickedElement.getAttribute("href");
        if (userToBlock == null) {
            return;
        }
        const result = await browser.storage.local.get({ [blockedUsersKey]: [] });
        const currentArray = result[blockedUsersKey];
        if (!currentArray.includes(userToBlock)) {
            currentArray.push(userToBlock);
            await browser.storage.local.set({ [blockedUsersKey]: currentArray });
        }
        lastRightClickedElement = null;
        getBlockedList().then(() => {
            clean();
        });
    }
    if (message.action === "clean") {
        getBlockedList().then(() => {
            clean();
        });
    }
});

let clean = () => {
    let path = document.location.pathname;
    switch (path) {
        case "/":
            contents.querySelectorAll(youtubeItemKey).forEach(item => {
                let href = item.querySelector(youtubeUserLinkKey)?.getAttribute("href");
                if (!href) return;
                if (blockedUsers.includes(href)) {
                    item.remove();
                }
            });
            getHideShorts().then(value => {
                console.log(hideShortsOptionKey, value);
                if (value) {
                    document.querySelectorAll(youtubeSectionKey).forEach(element => {
                        element.remove();
                    });
                }
            });
            break;
        case "/results":
            // TODO : fix
            contents.querySelectorAll("ytd-video-renderer").forEach(item => {
                let channelName = item.querySelector(".yt-simple-endpoint")?.getAttribute("href");
                console.log(channelName);
                //if (!channelName) return;
                // if (blockedChannels.includes(channelName)) {item.remove();}
            });
            break;
        case "/watch":
            // TODO : Need to get the channel title on add, and hold it in another array for lookup, change storage to a map.
            contents.querySelectorAll("yt-lockup-view-model").forEach(item => {
                let channelName = item.querySelector(".ytAttributedStringHost").textContent;
                console.log(channelName);
                //if (!channelName) return;
                // if (blockedChannels.includes(channelName)) {item.remove();}
            });
            break;

        default:
            console.log("unknown path", path);
            break;
    }
};

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

setInterval( () => {
    getEnabled().then((enableScript) => {
        if (enableScript) {
            getBlockedList().then(() => {
                clean();
            });
        }
    })
}, 9001);
