console.log("starting load.js:", browser.runtime.getManifest().name, browser.runtime.getManifest().version)

const blockedUsersKey = "blocked_users";


document.getElementById('file_picker').addEventListener('input', (event) => {
    console.log('input', event.target.files[0]);
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const fileContents = e.target.result;
            const parsedBlockedList = JSON.parse(fileContents);
            console.log('Successfully parsed BlockedList:', parsedBlockedList);
            browser.storage.local.set({ [blockedUsersKey]: parsedBlockedList })
            window.close()
        } catch (error) {
            console.error('Invalid JSON structure. Please check the file formatting.', error);
        }
    };
    reader.readAsText(file);
});

