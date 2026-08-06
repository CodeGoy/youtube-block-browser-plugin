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

let clean = () => {
    let isWhitelistModeEnabled = false;
    getWhitelistMode().then(whitelistMode => {
        console.log("whitelistMode enable:", whitelistMode);
        isWhitelistModeEnabled = whitelistMode;
        // TODO : if enabled, remove all elements except whitelisted
    })
    getEnabled().then((enableScript) => {
        if (enableScript) {
            let path = window.location.pathname;
            console.log("cleaning:", path);
            switch (path) {
                case "/":
                    if (isWhitelistModeEnabled) {
                        console.log("whitelistMode is enabled");
                        document.body.querySelectorAll(youtubeItemKey).forEach(item => {
                            let href = item.querySelector(youtubeUserLinkKey)?.getAttribute("href");
                            if (!href || !whitelistedUsers.includes(href)) {
                                item.remove();
                            }
                        });
                    } else {
                        document.body.querySelectorAll(youtubeItemKey).forEach(item => {
                            let href = item.querySelector(youtubeUserLinkKey)?.getAttribute("href");
                            if (!href || blockedUsers.includes(href)) {
                                item.remove();
                            }
                        });
                    }
                    getHideShorts().then(value => {
                        if (value) {
                            document.querySelectorAll(youtubeSectionKey).forEach(element => {
                                element.remove();
                            });
                        }
                    });
                    break;
                case "/results":
                    document.body.querySelectorAll(resultsContainer).forEach(item => {
                        let textContainer = item.querySelector(resultsSubContainer);
                        let channelName = textContainer.querySelector(resultsTarget).getAttribute("href");
                        if (blockedUsers.includes(channelName)) {
                            item.remove();
                        }
                    });
                    getHideShorts().then(value => {
                        if (value) {
                            document.querySelectorAll(resultsShorts).forEach(element => {
                                element.remove();
                            });
                        }
                    });
                    break;
                case "/watch":
                    document.body.querySelectorAll(watchContainer).forEach(item => {
                        let parent = item.querySelector(watchSubContainer)
                        let channelTitle = parent.querySelector(watchTarget).innerText;
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
        }
    });
};

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === "clean") {
        getWhitelist().then(() => {
            getBlockedList().then(() => {
                clean();
            });
        })
    }
});

browser.storage.onChanged.addListener((changes, areaName) => {
    if (changes.hasOwnProperty(blockDataKey)) {
        getWhitelist().then(() => {
            getBlockedList().then(() => {
                clean();
            });
        })
    }
});

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

const observer = new MutationObserver((mutationList, observer) => {
    for (const mutation of mutationList) {
        if (mutation.type === "childList") {
            let mutations = mutation.addedNodes;
            for (let i = 0; i < mutations.length; i++) {
                if (mutations[i].nodeType === 1 && mutations[i].matches(mutationTarget) && updateTimeout == null) {
                    getWhitelist().then(() => {
                        getBlockedList().then(() => {
                            clean();
                        });
                    })
                    break;
                }
            }
        }
    }
});

navigation.addEventListener("navigate", () => {
    observer.disconnect();
    setTimeout(() => {init();}, 250)
});

let init = () => {
    let path = window.location.pathname;
    console.log("starting script", appName, version, path)
    switch (path) {
        case "/":
            mutationTarget = youtubeItemKey
            break;
        case "/results":
            mutationTarget = resultsContainer
            break;
        case "/watch":
            mutationTarget = watchTarget
            break;
    }
    observer.observe(document.body, { childList: true, subtree: true });
    getWhitelist().then(() => {
        getBlockedList().then(() => {
            clean();
        });
    })
};
setTimeout(init, 250);
