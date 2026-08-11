// injected script
let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;

let blockedChannels = [];
let blockedUsers = [];

let whitelistedChannels = [];
let whitelistedUsers = [];

const whitelistKey = "enable_whitelist_mode";
const whitelistDataKey = "whitelist";

const blockDataKey = "block_data";
const enabledKey = "enable_script";
const hideShortsOptionKey = "hide_shorts";
let mutationTarget = null;

const youtubeItemKey = "ytd-rich-item-renderer";
const youtubeSectionKey = "ytd-rich-section-renderer";
const youtubeUserLinkKey = ".ytAttributedStringLink";

const resultsContainer = "ytd-video-renderer";
const resultsSubContainer = "#text-container";
const resultsTarget = ".yt-simple-endpoint";
const resultsShorts = "grid-shelf-view-model";

const watchContainer = "yt-lockup-view-model";
const watchSubContainer = ".ytContentMetadataViewModelMetadataRow";
const watchTarget = ".ytAttributedStringHost";

let updateTimeout = null;

// popup notification
let notification = (text) => {
    let notificationDiv = document.createElement("div");
    notificationDiv.style.display = "flex";
    notificationDiv.style.position = "fixed";
    notificationDiv.style.top = "15px";
    notificationDiv.style.right = "15px";
    notificationDiv.style.zIndex = "2147483647";
    notificationDiv.style.backgroundColor = "black";
    notificationDiv.style.color = "white";
    notificationDiv.style.border = "1px solid red";
    notificationDiv.id = "youtubeBlockNotification";

    let notificationText = document.createElement("h1")
    notificationText.innerText = text;
    notificationText.style.margin = "10px";
    notificationText.style.padding = "10px";
    notificationDiv.appendChild(notificationText);
    document.body.appendChild(notificationDiv);
    setTimeout(() => {
        document.body.removeChild(notificationDiv);
    }, 3500)
};

// get stored values
let getWhitelistMode = async () => {
    let enableObject = await browser.storage.local.get([whitelistKey]);
    return Object.values(enableObject)[0];
}

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
        let bs = b.split(":|:");
        blockedChannels.push(bs[0]);
        blockedUsers.push(bs[1]);
    })
}

let getWhitelist = async () => {
    whitelistedChannels = [];
    whitelistedUsers = [];
    let bul = await browser.storage.local.get({ [whitelistDataKey]: [] });
    Object.values(bul)[0].forEach(b => {
        let bs = b.split(":|:");
        whitelistedChannels.push(bs[0]);
        whitelistedUsers.push(bs[1]);
    })
}

// remove elements
let clean = async () => {
    let isWhitelistModeEnabled = await getWhitelistMode();
    if (!isWhitelistModeEnabled) {
        await getBlockedList();
    }
    let enableScript = await getEnabled();
    let hideShorts = await getHideShorts();
    if (enableScript) {
        let path = window.location.pathname;
        switch (path) {
            case "/":
                if (isWhitelistModeEnabled) {
                    getWhitelist().then(() => {
                        document.body.querySelectorAll(youtubeItemKey).forEach(item => {
                            let href = item.querySelector(youtubeUserLinkKey)?.getAttribute("href");
                            if (!href || !whitelistedUsers.includes(href)) {
                                item.remove();
                            }
                        });
                    })
                } else {
                    document.body.querySelectorAll(youtubeItemKey).forEach(item => {
                        let href = item.querySelector(youtubeUserLinkKey)?.getAttribute("href");
                        if (!href || blockedUsers.includes(href)) {
                            item.remove();
                        }
                    });
                }
                if (hideShorts) {
                    document.querySelectorAll(youtubeSectionKey).forEach(element => {
                        element.remove();
                    });
                }
                break;
            case "/results":
                document.body.querySelectorAll(resultsContainer).forEach(item => {
                    let textContainer = item.querySelector(resultsSubContainer);
                    let channelName = textContainer.querySelector(resultsTarget).getAttribute("href");
                    if (blockedUsers.includes(channelName)) {
                        item.remove();
                    }
                });
                if (hideShorts) {
                    document.querySelectorAll(resultsShorts).forEach(element => {
                        element.remove();
                    });
                }
                break;
            case "/watch":
                document.body.querySelectorAll(watchContainer).forEach(item => {
                    let parent = item.querySelector(watchSubContainer);
                    let channelTitle = parent.querySelector(watchTarget).innerText;
                    if (blockedChannels.includes(channelTitle)) {
                        item.remove();
                    }
                    if (channelTitle.includes(" • ")) {
                        item.remove();
                    }
                });
                break;
            default:
                console.log("unknown path", path);
                break;
        }
    }
};

// listen for message from popup
browser.runtime.onMessage.addListener(async (message) => {
    switch (message.action) {
        case "clean":
            await clean();
            break;
        case "notification":
            notification(message.text);
            break;
        default:
            console.log("unknown message", message);
            break;
    }
});

// listen for blocklist changes
browser.storage.onChanged.addListener((changes, areaName) => {
    if (changes.hasOwnProperty(blockDataKey)) {
        clean();
    }
});

// scrolling
let isUserInteracting = false;
const interactionEvents = ['wheel', 'touchstart', 'touchmove', 'keydown', 'mousedown'];
let lastPositionY = 0;
let scriptScroll = false;

interactionEvents.forEach(eventType => {
  window.addEventListener(eventType, () => {
    isUserInteracting = true;
  }, { passive: true });
});

window.addEventListener('scroll', (event) => {
  if (scriptScroll) {
      scriptScroll = false;
      return;
  }
  if (isUserInteracting) {
      lastPositionY = window.scrollY;
  } else {
      event.stopPropagation();
      scriptScroll = true;
      window.scrollTo(0, lastPositionY);
  }
});

window.addEventListener('scrollend', () => {
    isUserInteracting = false;
});

// MutationObserver
const observer = new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            let mutations = mutation.addedNodes;
            for (let i = 0; i < mutations.length; i++) {
                if (mutations[i].nodeType === 1 && mutations[i].matches(mutationTarget) && updateTimeout == null) {
                    clean();
                    break;
                }
            }
        }
    }
});

// listen for location changes
navigation.addEventListener("navigate", () => {
    observer.disconnect();
    setTimeout(() => {init();}, 250);
});

let init = () => {
    let path = window.location.pathname;
    console.log("starting script", appName, version, path)
    switch (path) {
        case "/":
            mutationTarget = youtubeItemKey;
            break;
        case "/results":
            mutationTarget = resultsContainer;
            break;
        case "/watch":
            mutationTarget = watchTarget;
            break;
    }
    observer.observe(document.body, { childList: true, subtree: true });
    clean();
};
setTimeout(init, 250);
