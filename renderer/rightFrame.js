require.config({
  paths: {
    vs: "./node_modules/monaco-editor/min/vs",
  },
});
document.addEventListener("DOMContentLoaded", () => {
  // Load right.html content into the right-sidebar div

  // Check if we're running in Electron
  if (window.electronAPI) {
    console.log("Running in Electron environment");

    // Initialize app info
    // initializeAppInfo();

    // // Set up menu event listeners
    // setupMenuListeners();

    // // Enhance UI for desktop environment
    // enhanceDesktopUI();
  } else {
    console.log("Running in browser environment");
  }
});
async function loadComponent(id, file) {
  try {
    console.log("22222222");
    const response = await fetch(`./renderer/components/${file}`);
    const html = await response.text();
    document.getElementById(id).innerHTML = html;
  } catch (error) {
    console.error("Failed to load  content:", error);
  }
}

//
window.addEventListener("DOMContentLoaded", async () => {
  console.log("11111111111");
  await loadComponent("codefile", "editorView.html");
  await loadComponent("datafile", "tableView.html");
  //let connectionSel = document.getElementById("connList");
  //loadComponent("footer", "footer.html");
  await loadConnection();
});
// Load Connections
let connectionSelector;
let options = [];
let connMap = new Map();
async function loadConnection() {
  connectionSelector = document.getElementById("connList");
  connMap.clear();
  options.push("No Connection");
  // Add options dynamically
  if (connectionSelector) {
    // Fetch connections from spring server after 5sec.
    setTimeout(async () => {
      //
      try {
        console.log("loading connections");
        const response = await fetch(
          "http://localhost:8080/app/user/loadConnection",
          {
            method: "GET",
          }
        );
        const jsonResponse = await response.json();
        //console.log("Json Response:" + jsonResponse);
        jsonResponse.forEach((element) => {
          console.log("Conn Name: " + element);
          options.push(element);
        });
        // Set Options
        if (options.length > 0) {
          options.forEach((connName) => {
            let optionTag = document.createElement("option");
            optionTag.value = connName.toLowerCase();
            optionTag.textContent = connName;
            connectionSelector.appendChild(optionTag);
            if (connName !== "No Connection") {
              connMap.set(connName.toLowerCase(), connName);
            }
          });
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);
  } else {
    console.log("selector is null");
  }
}
// connection selection Action
async function connectionSelectListener(selectElement) {
  const selectedValue = selectElement.value;
  if (connMap.has(selectedValue)) {
    console.log(`Selected Connection: ${connMap.get(selectedValue)}`);
    const setSessionResponse = await fetch(
      `http://localhost:8080/app/user/currentSession?connName=${connMap.get(
        selectedValue
      )}`,
      {
        method: "POST",
      }
    );
    console.log("Session for " + (await setSessionResponse.text()));
  } else {
    console.log("No Connection!");
    const disConnResponse = await fetch(
      "http://localhost:8080/app/user/disConnectConn",
      {
        method: "GET",
      }
    );
    console.log("Session is " + (await disConnResponse.text()));
  }
}
// Editor Section
let editor;
require(["vs/editor/editor.main"], function () {
  editor = monaco.editor.create(document.getElementById("editor-container"), {
    value: "", // Sample
    language: "sql",
    theme: "vs-light",
    automaticLayout: true,
  });
});
// Run button action
async function runEditorQuery() {
  let userInsession = await checkUserInSession();
  if (userInsession) {
    console.log("User in session!");
    //runQueryInBackground();
  } else {
    console.log("User Not in Session!");
  }
}

// check User in session
async function checkUserInSession() {
  let inSession = false;
  let connResponse = await fetch("http://localhost:8080/query/isInSession", {
    method: "GET",
  }).catch((err) => console.error(err));
  if (connResponse.ok) {
    inSession = true;
  }
  return inSession;
}
