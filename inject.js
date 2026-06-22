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
    let items = contents.querySelectorAll('ytd-rich-item-renderer');
    items.forEach(item => {
        let href = item.querySelector(".ytAttributedStringLink")?.getAttribute("href");
        if (!href) return;
        if (blockedUsers.includes(href)) {
            item.remove();
            console.log("removed post by", href);
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
}, 9001);

