console.log("starting popup", browser.runtime.getManifest().name, browser.runtime.getManifest().version)
let reset = document.getElementById("reset");
let status = document.getElementById("status");
let user_list = document.getElementById("user_list");
let enable_script_em = document.getElementById("enable_script");
let blockedUsers = null;
const blockedUsersKey = "blocked_users";
const enabledKey = "enable_script";

let getBlockedList = async () => {
    let bul = await browser.storage.local.get({ [blockedUsersKey]: [] });
    blockedUsers = Object.values(bul)[0];
}

let removeUser = (username) => {
    console.log("Removing user:", username);
    browser.storage.local.get([blockedUsersKey]).then((result) => {
        let storedArray = result[blockedUsersKey] || [];
        const updatedArray = storedArray.filter(item => item !== username);
        return browser.storage.local.set({ [blockedUsersKey]: updatedArray });
    }).then(() => {
        console.log("String removed successfully!");
        loadBlockList();
    }).catch((error) => {
        console.error("Error updating storage:", error);
    });
};

let buttonFuncs = () => {
    const removeButtons = user_list.getElementsByClassName('removebutton');
    for (let i = 0; i < removeButtons.length; i++) {
        let crb = removeButtons[i]
        //console.log(crb);
        crb.addEventListener('click', (event) => {
            const buttonText = event.target.textContent;
            //console.log(buttonText);
            removeUser(buttonText);
        });
    }
};

function random(len) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// enabled
enable_script.addEventListener('click', () => {
    browser.storage.local.set({enable_script : enable_script_em.checked}).then(() => {
        getEnabled().then((isEnabledCheck) => {
            console.log("enable", isEnabledCheck);
        })
    });
})

let getEnabled = async () => {
    let enableObject = await browser.storage.local.get([enabledKey]);
    return Object.values(enableObject)[0];
}

let loadBlockList = () => {
    user_list.innerHTML = "";
    getBlockedList().then(() => {
        for (const user of blockedUsers) {
                let nId = random(8);
                user_list.insertAdjacentHTML("beforeend", `<div>
    <button id="${nId}" class="removebutton user_item rb">${user}</button>
</div>`)
                let nn = document.getElementById(`${nId}`);
                nn.addEventListener("click", (event) => {
                    let rmUserName = event.target.textContent;
                    console.log("removing", rmUserName);
                    removeUser(rmUserName);
                })

        }
    });
};

document.addEventListener("DOMContentLoaded",  () => {
    getEnabled().then((en) => {
        enable_script.checked = en;
    });
    loadBlockList()
    status.textContent = "Not Reset";
    reset.addEventListener("click", () => {
        console.log("reset enabled");
        browser.storage.local.remove(blockedUsersKey);
        status.textContent = "Reset";
    })
    buttonFuncs();
});