let blockedUsers = null;
console.log("starting script", browser.runtime.getManifest().name, browser.runtime.getManifest().version)
let lastRightClickedElement = null;
let contents = document.getElementById("content");
const blockedUsersKey = "blocked_users";
const enabledKey = "enable_script";

document.addEventListener("contextmenu", (event) => {
    lastRightClickedElement = event.target;
}, true);

browser.runtime.onMessage.addListener(async (message) => {
    if (message.action === "find_element" && lastRightClickedElement) {
        let parsedHref = lastRightClickedElement.getAttribute("href")
        let userToBlock = parsedHref;
        if (userToBlock == null) {
            return;
        }
        const result = await browser.storage.local.get({ ["blocked_users"]: [] });
        const currentArray = result["blocked_users"];
        if (!currentArray.includes(userToBlock)) {
            currentArray.push(userToBlock);
            await browser.storage.local.set({ ["blocked_users"]: currentArray });
        }
        lastRightClickedElement = null;
    }
});

let clean = () => {
    let qsl = contents.getElementsByTagName('ytd-rich-item-renderer');
    for (let q = 0; q < qsl.length; q++) {
        let targetHref = null;
        try {
            targetHref = qsl[q].querySelector(".ytAttributedStringLink").getAttribute("href");
        } catch (e) {
            continue
        }
        for (const user of Object.values(blockedUsers)) {
            for (const userKey in user) {
                if (user[userKey] === targetHref) {
                    qsl[q].remove();
                }
            }
        }
    }
};

let getEnabled = async () => {
    let enableObject = await browser.storage.local.get([enabledKey]);
    return Object.values(enableObject)[0];
}

let getBlockedList = async () => {
    blockedUsers = await browser.storage.local.get({ [blockedUsersKey]: [] });
}

setInterval( () => {
    getEnabled().then((enableScript) => {
        if (enableScript) {
            getBlockedList().then(() => {
                clean();
            });
        }
    })
}, 2500);

