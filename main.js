
const { app, BrowserWindow } = require("electron");
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true')
const path = require("path");
const url = require("url");


let window;

function createMainWindow() {
    window = new BrowserWindow({ width: 1280, height: 960 });
    window.setMenu(null);
    window.loadURL(url.format({
        pathname: path.join(__dirname, "ver4.html"),
        protocol: "file:",
        slashes: true
    }));

    //window.webContents.openDevTools();

    window.on("close", () => {
        window = null;
    });
}

app.on("ready", createMainWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit()
    }
});

app.on("activate", () => {
    if (window === null) {
        createMainWindow();
    }
});
