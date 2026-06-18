let blockedUsers = null;
console.log("starting block script")
let lastRightClickedElement = null;
let contents = document.getElementById("content");

document.addEventListener("contextmenu", (event) => {
    lastRightClickedElement = event.target;
}, true);

browser.runtime.onMessage.addListener((message) => {
    if (message.action === "find_element" && lastRightClickedElement) {
        let parsedHref = lastRightClickedElement.getAttribute("href")
        console.log("Cross-browser clicked element:", parsedHref);
        browser.runtime.sendMessage({
            action: "BLOCK_DATA",
            data: parsedHref
        })
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
                    console.log("Removing node:", q);
                    qsl[q].remove();
                } else {
                    //console.log("values do not match", user[userKey], targetHref);
                }
            }
        }
    }
};

let getBlockedList = async () => {
    blockedUsers  = await browser.storage.local.get({ ["blocked_users"]: [] });
}

// TODO : run on mutations
getBlockedList().then(r => {
    setTimeout( () => {
        clean();
        console.log("Starting Loop Countdown......");
        setInterval( () => {
            getBlockedList().then(() => {
                console.log("cleaning");
                clean();
            });
        }, 3000);
    }, 1000);
});

