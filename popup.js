let version = browser.runtime.getManifest().version;
let appName = browser.runtime.getManifest().name;
console.log("starting popup", appName, version)

let enable_script_em = document.getElementById("enable_script");
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
const enabledKey = "enable_script";
const blockDataKey = "block_data";
let resetConfirmation = 0;

header.innerText = `${appName} ${version}`;

let getBlockedList = async () => {
    let bul = await browser.storage.local.get({ [blockDataKey]: [] });
    return  Object.values(bul)[0];
}

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

let buttonFuncs = () => {
    const removeButtons = user_list.getElementsByClassName('removebutton');
    for (let i = 0; i < removeButtons.length; i++) {
        let crb = removeButtons[i]
        crb.addEventListener('click', (event) => {
            removeUser(event.target.textContent);
        });
    }
};

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

document.addEventListener("DOMContentLoaded",  () => {
    getEnabled().then((en) => {
        enable_script_em.checked = en;
    });
    getHideShorts().then((shorts) => {
        hide_shorts.checked = shorts;
    })
    loadBlockList()
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
        getBlockedList().then((blockedUsers) => {
            let bu = JSON.stringify(blockedUsers);
            const blob = new Blob([bu], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'blocked-user-list.json';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
    })
    loadList.addEventListener("click", () => {
        browser.windows.create({
            url: browser.runtime.getURL("load.html"),
            type: "popup",
            width: 400,
            height: 400,
        });
    })
    enable_script_em.addEventListener('click', () => {
        browser.storage.local.set({enable_script : enable_script_em.checked}).then(() => {
            getEnabled().then((isEnabledCheck) => {
                console.log("enable", isEnabledCheck);
            })
        });
    })
    hide_shorts.addEventListener('click', () => {
        browser.storage.local.set({hide_shorts : hide_shorts.checked}).then(() => {
            getHideShorts.then((isEnabledCheck) => {
                console.log("enable", isEnabledCheck);
            })
        });
    })
    buttonFuncs();
});
