// extension menu
let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("starting popup", appName, version)

let enable_whitelist_mode = document.getElementById("enable_whitelist_mode");
let whitelist_length = document.getElementById("whitelist_length");
let enable_script_em = document.getElementById("enable_script");
let show_whitelist = document.getElementById("show_whitelist");
let whitelist_element = document.getElementById("whitelist");
let array_length = document.getElementById("array_length");
let hide_shorts = document.getElementById("hide_shorts");
let downloadButton = document.getElementById("download");
let user_list = document.getElementById("user_list");
let show_list = document.getElementById("show_list");
let loadList = document.getElementById("load_list");
let header = document.getElementById("header");
let clean = document.getElementById("clean");
let reset = document.getElementById("reset");
const hideShortsOptionKey = "hide_shorts";
const whitelistDataKey = "whitelist";
const enabledKey = "enable_script";
const blockDataKey = "block_data";
let resetConfirmation = 0;

header.innerText = `${appName} ${version}`;

// get stored values
let getBlockedList = async () => {
    let bul = await browser.storage.local.get({ [blockDataKey]: [] });
    return  Object.values(bul)[0];
}

let getWhitelist = async () => {
    let wul = await browser.storage.local.get({ [whitelistDataKey]: [] });
    return  Object.values(wul)[0];
}

let getWhitelistEnabled = async () => {
    let enableObject = await browser.storage.local.get(["enable_whitelist_mode"]);
    return Object.values(enableObject)[0];
}

let getHideShorts = async () => {
    let hideShortsObject = await browser.storage.local.get([hideShortsOptionKey]);
    return Object.values(hideShortsObject)[0];
}

let getEnabled = async () => {
    let enableObject = await browser.storage.local.get([enabledKey]);
    return Object.values(enableObject)[0];
}

let loadBlockList = () => {
    user_list.innerHTML = "";
    getBlockedList().then((blockedUsers) => {
        array_length.innerText = "Blocked:" + blockedUsers.length;
        blockedUsers.sort();
        for (const user of blockedUsers) {
            let deleteButtonDiv = document.createElement("div");
            user_list.appendChild(deleteButtonDiv);
            let deleteButton = document.createElement("button");
            deleteButton.classList.add("removebutton", "user_item", "rb");
            deleteButton.textContent = user;
            deleteButton.onclick = () => {
                removeUser(user);
            }
            deleteButtonDiv.appendChild(deleteButton);
        }
    });
};

let loadWhiteList = () => {
    whitelist_element.innerHTML = "";
    getWhitelist().then((whitelist) => {
        whitelist_length.innerText = "Whitelisted:" + whitelist.length;
        whitelist.sort();
        for (const user of whitelist) {
            let deleteButtonDiv = document.createElement("div");
            whitelist_element.appendChild(deleteButtonDiv);
            let deleteButton = document.createElement("button");
            deleteButton.classList.add("removebutton", "user_item", "rb");
            deleteButton.textContent = user;
            deleteButton.onclick = () => {
                removeWhitelistUser(user);
            }
            deleteButtonDiv.appendChild(deleteButton);
        }
    });
};

// remove users
let removeUser = (username) => {
    browser.storage.local.get([blockDataKey]).then((result) => {
        let storedArray = result[blockDataKey] || [];
        const updatedArray = storedArray.filter(item => item !== username);
        return browser.storage.local.set({ [blockDataKey]: updatedArray });
    }).then(() => {
        loadBlockList();
    }).catch((error) => {
        console.error("Error updating storage:", error);
    });
};

let removeWhitelistUser = (username) => {
    browser.storage.local.get([whitelistDataKey]).then((result) => {
        let storedArray = result[whitelistDataKey] || [];
        const updatedArray = storedArray.filter(item => item !== username);
        return browser.storage.local.set({ [whitelistDataKey]: updatedArray });
    }).then(() => {
        loadWhiteList();
    }).catch((error) => {
        console.error("Error updating storage:", error);
    });
};

document.addEventListener("DOMContentLoaded",  () => {
    getWhitelistEnabled().then((en) => {
        enable_whitelist_mode.checked = en;
    })
    getEnabled().then((en) => {
        enable_script_em.checked = en;
    });
    getHideShorts().then((shorts) => {
        hide_shorts.checked = shorts;
    })
    loadBlockList();
    loadWhiteList();
    reset.addEventListener("click", () => {
        switch (resetConfirmation) {
            case 0:
                resetConfirmation++;
                reset.innerText = "Really????????";
                break;
            case 1:
                resetConfirmation = 0;
                reset.innerText = "Storage Reset";
                browser.storage.local.remove(blockDataKey);
                browser.storage.local.remove(whitelistDataKey);
                loadBlockList();
                break;
        }
    })
    show_list.addEventListener("click", () => {
        if (user_list.classList.contains("hide_list")) {
            show_list.innerHTML = "Hide List";
            user_list.classList.remove("hide_list");
        } else {
            show_list.innerHTML = "Show List";
            user_list.classList.add("hide_list");
        }
    })
    show_whitelist.addEventListener("click", () => {
        if (whitelist_element.classList.contains("hide_list")) {
            show_whitelist.innerHTML = "Hide List";
            whitelist_element.classList.remove("hide_list");
        } else {
            show_whitelist.innerHTML = "Show List";
            whitelist_element.classList.add("hide_list");
        }
    })
    clean.addEventListener("click", async () => {
        try {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                console.error("No active tab found.");
                return;
            }
            await browser.tabs.sendMessage(tab.id, {action: "clean"});
        } catch (error) {
            console.error("Error messaging tab:", error);
        }
    })
    downloadButton.addEventListener("click", () => {
        const baseFilename = "youtube-block-List";
        getWhitelist().then((whitelist) => {
            getBlockedList().then((blockedUsers) => {
                let njo = {
                    block_data: blockedUsers,
                    whitelist: whitelist,
                }
                let bu = JSON.stringify(njo, null, 2);
                const blob = new Blob([bu], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = baseFilename + '.json';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            })
        })
    })
    loadList.addEventListener("click", () => {
        browser.windows.create({
            url: browser.runtime.getURL("load.html"),
            type: "popup",
            width: 600,
            height: 125,
        });
    })
    enable_script_em.addEventListener('click', () => {
        browser.storage.local.set({enable_script : enable_script_em.checked});
    })
    hide_shorts.addEventListener('click', () => {
        browser.storage.local.set({hide_shorts : hide_shorts.checked});
    })
    enable_whitelist_mode.addEventListener('click', () => {
        browser.storage.local.set({enable_whitelist_mode : enable_whitelist_mode.checked});
    })
});
