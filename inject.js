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
        let userToBlock = lastRightClickedElement.getAttribute("href");
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
    let items = contents.querySelectorAll('ytd-rich-item-renderer');
    items.forEach(item => {
        let href = item.querySelector(".ytAttributedStringLink")?.getAttribute("href");
        if (!href) return;
        if (blockedUsers.includes(href)) {
            console.log("blockedUsers includes:", href);
            item.remove();
        }
    });
};

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
}, 2500);

