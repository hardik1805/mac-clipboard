const electron = require('electron');
const path = require('path');
const {existsSync, readFileSync, writeFileSync} = require('fs');

class Store {
    constructor(opts) {
        // Renderer process has to get `app` module via `remote`, whereas the main process can get it directly
        // app.getPath('userData') will return a string of the user's app data directory path.
        const userDataPath = (electron.app || electron.remote.app).getPath('userData');
        // We'll use the `configName` property to set the file name and path.join to bring it all together as a string
        this.path = path.join(userDataPath, opts.configName + '.json');
        this.data = parseDataFile(this.path, opts.defaults);
    }

    // This will just return the property on the `data` object
    get(key) {
        return this.data[key];
    }

    // ...and this will set it
    set(key, val) {
        if (key === 'history') {
            let list = this.data[key] || []
            list = list.filter((e) => e !== val)
            list.push(val);
            list.splice(0, list.length - 30)
            this.data[key] = list;
        } else this.data[key] = val
        writeFileSync(this.path, JSON.stringify(this.data));
    }

    removeHistoryItem(key, val) {
        if (key === 'history') {
            let list = this.data[key] || []
            list = list.filter(e => e !== val)
            this.data[key] = list;
            writeFileSync(this.path, JSON.stringify(this.data));
        }
    }
    clearHistory(key) {
        if (key === 'history') {
            this.data[key] = [];
            writeFileSync(this.path, JSON.stringify(this.data));
        }
    }
}

function parseDataFile(filePath, defaults = {}) {
    // We'll try/catch it in case the file doesn't exist yet, which will be the case on the first application run.
    // `fs.readFileSync` will return a JSON string which we then parse into a Javascript object
    try {
        if (!existsSync(filePath)) writeFileSync(filePath, JSON.stringify(defaults));
        return JSON.parse(readFileSync(filePath));
    } catch (error) {
        console.log('Error in parseDataFile: ', error.message)
        // if there was some kind of error, return the passed in defaults instead.
        return defaults;
    }
}

// expose the class
module.exports = Store;