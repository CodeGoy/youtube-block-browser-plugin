let reset = document.getElementById("reset");
let status = document.getElementById("status");
let user_list = document.getElementById("user_list");


let blockedUsers = null;


let getBlockedList = async () => {
    blockedUsers  = await browser.storage.local.get({ ["blocked_users"]: [] });
}

let removeUser = () => {
    console.log("Removing user:", username);

};

let buttonFuncs = () => {
    const removeButtons = user_list.getElementsByClassName('removebutton');
    for (let i = 0; i < removeButtons.length; i++) {
        let crb = removeButtons[i]
        console.log(crb);
        crb.addEventListener('click', (event) => {
            const buttonText = event.target.textContent;
            
            console.log(buttonText);
        });
    }
};

document.addEventListener("DOMContentLoaded",  () => {
    getBlockedList().then(() => {
        // TODO : add remove button for users
        for (const user of Object.values(blockedUsers)) {
            for (const userKey in user) {
                // console.log(user[userKey]);
                let nun = user[userKey];
                user_list.insertAdjacentHTML("beforeend", `<div>
    <button class="removebutton">${nun}</button>
</div>`)
            }
        }
    });
    status.textContent = "Not Reset";
    reset.addEventListener("click", () => {
        console.log("reset enabled");
        browser.storage.local.remove("blocked_users");
        status.textContent = "Reset";
    })
    buttonFuncs();
});