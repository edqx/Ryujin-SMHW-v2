const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const storage = require("electron-json-storage");

const path = require("path");

if (require("electron-squirrel-startup")) { 
    app.quit();
}

const createWindow = () => {
    const menu = Menu.buildFromTemplate([{
        label: "User",
        submenu: [
            {
                label: "Logout",
                click() {
                    storage.remove("auth", function (err) {
                        app.relaunch();
                        app.exit(0);
                    });
                }
            }
        ]
    }, {
        label: "Window",
        submenu: [
            {
                label: "About",
                click() {

                }
            },
            {
                role: "toggledevtools"
            }
        ]
    }, {
        label: "Stat",
        submenu: [
            {
                label: "Query Submissions",
                click() {
                    mainWindow.webContents.send("query-submissions");
                }
            }
        ]
    }]);

    Menu.setApplicationMenu(menu);

    let window;
    
    storage.has("auth", function (err, has) {
		if (err) {
            app.quit();
            
			return console.log(err);
		}
		
		if (has) {
			Menu.setApplicationMenu(menu);

			window = new BrowserWindow({
				minWidth: 1280,
				minHeight: 720,
				webPreferences: {
					nodeIntegration: true
				},
				icon: path.resolve(__dirname, "../asset/icon.png")
            });

            window.loadFile(path.join(__dirname, "../public/index.html"));

            window.webContents.on("new-window", function (event, url) {
                event.preventDefault();
        
                require('electron').shell.openExternal(url);
            });
		} else {
			window = new BrowserWindow({
				width:  325,
                height: 375,
				webPreferences: {
					nodeIntegration: true
				},
				icon: path.resolve(__dirname, "../asset/icon.png"),
				resiable: false,
				transparent: true,
				frame: false
			});

			window.loadFile(path.resolve(__dirname, "../src/login.html"));

			window.on("blur", function () {
			    window.close();
			});
		}
	});
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});