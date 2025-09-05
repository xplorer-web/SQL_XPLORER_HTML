const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false, // Security best practice
      contextIsolation: true, // Security best practice
      enableRemoteModule: false, // Security best practice
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "assets/icon.png"), // App icon
    show: false, // Don't show until ready
    titleBarStyle: "default",
  });

  // Load the index.html file
  mainWindow.loadFile("mainFrame.html");

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Focus on window
    if (process.platform === "darwin") {
      mainWindow.focus();
    }
  });

  // Open DevTools in development
  if (
    process.env.NODE_ENV === "development" ||
    process.argv.includes("--dev")
  ) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require("electron").shell.openExternal(url);
    return { action: "deny" };
  });
}

// App event handlers
app.whenReady().then(() => {
  startJar();
  createWindow();

  // macOS specific behavior
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
// --- important bits ---
app.on("before-quit", () => {
  stopJar();
});
// Quit when all windows are closed
app.on("window-all-closed", () => {
  stopJar();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
    require("electron").shell.openExternal(navigationUrl);
  });
});
// Start App Spring jar
// Start the Spring Jar
let javaProcess;
function startJar() {
  const jarPath = path.join(__dirname, "app", "SqlXplorerBusinessCode-1.0-SNAPSHOT.jar");
  console.log(`Executing JAR: java -jar ${jarPath}`);
  javaProcess = spawn("java", ["-jar", jarPath]);

  javaProcess.stdout.on("data", (data) => {
    console.log(`Java: ${data}`);
  });

  javaProcess.stderr.on("data", (data) => {
    console.error(`Java error: ${data}`);
  });

  javaProcess.on("close", (code) => {
    console.log(`Java process exited with code ${code}`);
    javaProcess = null;
  });
}
// Ensure Java process is killed
//const http = require("http");
async function stopJar() {
  try {
    
    //let stopMsg = await stopExecution.text();
  
    // Find the PID listening on 8080
    const output = execSync('netstat -ano | findstr :8080').toString();
    const lines = output.trim().split("\n");
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== "0") {
        console.log("Killing PID on port 8080:", pid);
        spawn("taskkill", ["/PID", pid, "/F", "/T"]);
      }
    });
  } catch (err) {
    const stopExecution = await fetch("http://localhost:8080/query/stopThreads", {
                            method: "POST"
      });
    console.error("No process found on port 8080:", err.message);
  
    console.log("spring Stoped");
  }

  // Also try killing the spawn handle if still alive
  if (javaProcess) {
    console.log("Killing Java process with PID:", javaProcess.pid);
    spawn("taskkill", ["/PID", javaProcess.pid.toString(), "/F", "/T"]);
    javaProcess = null;
  }

}
