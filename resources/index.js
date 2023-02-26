const electron = require('electron')
const path = require("path");
const fs = require("fs");
const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const filePath = path.join(userDataPath, 'user-clipboard.json');


const displayHistory = () => {
    if (!fs.existsSync(filePath)) return
    let data = JSON.parse(fs.readFileSync(filePath));
    const listDiv = document.getElementsByClassName('history-list')[0]

    while (listDiv.firstChild) {
        listDiv.removeChild(listDiv.firstChild);
    }
    if (!listDiv) return

    if (data.history.length) {
        data.history = data.history.reverse()
        data.history.map((text, i) => {
            const divItem = document.createElement('div') // parent div
            const p = document.createElement("p"); // text p
            const closeIcon = document.createElement("div"); // close icon

            closeIcon.className = "close-icon"
            p.textContent = text;
            divItem.className = "history-item"

            closeIcon.onclick = (e) => {
                e.stopPropagation()
                electron.ipcRenderer.send('removeHistoryItem',text)

            }

            divItem.onclick = () => { // onclick event for the copy text
                const selectedText = window.getSelection().toString();
                if (selectedText.trim()) text = selectedText // check if text is selected then copy only that words
                navigator.clipboard.writeText(text)
                let successItem = document.getElementsByClassName('success')[0]
                successItem.style.display = 'flex'
                setTimeout(() => {
                    successItem.style.display = 'none'
                }, 500)
            }
            divItem.appendChild(p) // append text
            divItem.appendChild(closeIcon) // append close icon
            listDiv.appendChild(divItem); // append into parent list
        });
        document.getElementById('clearHistory').style.display = 'flex'
    } else {
        const p = document.createElement("p");
        p.textContent = 'Copy text to save in clipboard!!';
        p.className = "no-history"
        listDiv.appendChild(p);
        document.getElementById('clearHistory').style.display = 'none'
    }
}



electron.ipcRenderer.on('updateHistoryList', () => {
    setTimeout(() => {
        displayHistory()
    },500)
})

document.getElementById('clearHistory').addEventListener('click', () => {
    electron.ipcRenderer.send('clearHistory')
})
displayHistory()