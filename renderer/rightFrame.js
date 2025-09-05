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
let paginationInfo = null;
let nextPageBtn = null;
let prevPageBtn = null;
let totalRecords = null;
let estTime = null;
//
window.addEventListener("DOMContentLoaded", async () => {
  console.log("11111111111");
  await loadComponent("codefile", "editorView.html");
  await loadComponent("datafile", "tableView.html");
  //let connectionSel = document.getElementById("connList");
  //loadComponent("footer", "footer.html");
  await loadElements();
  await loadConnection();
});
// Load all the elements
async function loadElements() {
  paginationInfo = document.getElementById('paginationInfo');
  nextPageBtn = document.getElementById('nextPageBtn');
  prevPageBtn = document.getElementById('prevPageBtn');
  totalRecords = document.getElementById('totalRecords');
  estTime = document.getElementById('estTime');
}
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
    runQueryInBackground();
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
//
let lastQuery = "";
let loadingStatus = false;
let isTotalRecordsFetched = false;
let records;
let currentPage = 1;
let totalPages = 0;
let recordsPerPage = 2000;
let qTo = 20000;
let qFrom = 0;
// Run In background query
async function runQueryInBackground() {
  try {
    totalPages = qTo / recordsPerPage;
    let t1 = performance.now();
    loadingStatus = false;
    console.log("Run Button clicked....");
    // Get the selected Query...
    const selectedQuery = editor.getSelection();
    const model = editor.getModel();
    let selectedText = model.getValueInRange(selectedQuery);
    if (selectedText.includes(";")) {
      selectedText = selectedText.split(";")[0].trim().toUpperCase();
    } else {
      selectedText = selectedText.trim().toUpperCase();
    }
    isTotalRecordsFetched = false;
    if(selectedText) {
     estTime.innerHTML ="Estimated Time: -.-"
     paginationInfo.textContent = "0 of 0";
      lastQuery = selectedText;
      currentPage = 1;
      totalPages = null;
      
      let response = fetch(`http://localhost:8080/query/runQueryInMultiThread?query=${encodeURIComponent(lastQuery)}&batchSize=${qTo}`, {
                      method: "POST"
      });
      // Run something after 5 seconds (non-blocking)
      setTimeout(async () => {
      try {
        console.log("Fetching total pages!");
         const totalRes = await fetch(`http://localhost:8080/query/totalIndexes`, {
                      method: "POST"
          });
          totalPages = Number(await totalRes.text());
          console.log("Total Pages are : " + totalPages);
          paginationInfo.textContent = `1 of ${totalPages}`;
          gotoPage(currentPage);
          totalRecords.innerHTML = `Total Records: ${qTo}`;
          pages = totalPages;
          //updatePaginationControls();
          nextPageBtn.onclick = () => {
            nextPage();
          };
          prevPageBtn.onclick =() =>{
            previousPage();
          };
      } catch(e) {
        console.error("Error fetching total pages:", e);
      }
      }, 5000);
      //
      
      records = await response;
      if (!records.ok) {
          throw new Error(`HTTP error! Status: ${records.status}`);
      }
      let result = await records.text();
      let t2 = performance.now();
      let t3 = (t2 - t1) / 1000;
      let convertionCountTime = 3;
      let itCount = 0;
      while(t3 > 60 && itCount <= convertionCountTime) {
        t3 /=60;
        ++itCount;
      }
      if(itCount == 0) {
        estTime.innerHTML = `Execution Time: ${t3} seconds`;
      }else if(itCount == 1) {
        estTime.innerHTML = `Execution Time: ${t3} minutes`;
      } else {
        estTime.innerHTML = `Execution Time: ${t3} minutes`;
      }
      //document.getElementById("estTime").textContent = `Execution Time: ${t3} seconds`;
      console.log("Aquired: " + result);
      isTotalRecordsFetched = true;
    }

  } catch(err) {
    console.error(err);
  }
}
//
function gotoPage(pageNum) {
  //paginationInfo.textContent = `Loading Page ${pageNum}...`;
  if (!isTotalRecordsFetched) {
    loadingStatus = false;
    knowCurrentPageLoaded(pageNum);
  } else{
    loadingStatus = true;
    viewTable(currentPage);
  }
  prevPageBtn.disabled = pageNum === 1;
  nextPageBtn.disabled = pageNum === totalPages;
}
//
async function knowCurrentPageLoaded(currentPage) {
  try {
    setTimeout(async () => {
      if(!loadingStatus) {
        try {
            console.log("Fetching Current loaded pages!");
            //paginationInfo.textContent = `Loading Page ${currentPage}...`;
            let currentTotalRes = await fetch(`http://localhost:8080/query/currentIndexes`, {
                        method: "POST"
            });
            let currenttotalPages = Number(await currentTotalRes.text());
            if(currenttotalPages >= currentPage) {
              loadingStatus = true;
              console.log(`currentPage ${currentPage} is loaded!`);
              viewTable(currentPage);
            } else{
              gotoPage(currentPage);
            }
        } catch (e) {
          console.error("Error at Fetcing current pages", e)
        }
      } else{
        console.log("Current Page Is loaded!")
      }
      }, 2000);
  } catch (e) {
    console.error("Error fetching page-" + currentPage, e)
  }
}
// Display Table
let tableData = [];
async function viewTable(pageNum) {
  //document.getElementById("progressFill").style.width = "20%";
  // Run the Query in server
  let response = await fetch(`http://localhost:8080/query/pageData?pageNum=${pageNum - 1}`, {
                method: "POST"
  });
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  let result = await response.text();
  console.log("Records Fected for Page: " + pageNum)
  //document.getElementById("progressFill").style.width = "50%";
  console.log("Page Data size:", result.length);
  let lines = result.trim().split(/\r?\n/); // handles both Windows (\r\n) and Unix (\n) line breaks
  let lastLine = lines[lines.length - 1].trim();
  const parsed = JSON.parse(lastLine.trim());
  renderClusterizedTable(parsed);
  paginationInfo.textContent = `${pageNum} of ${totalPages || "?"}`;
  //updatePaginationControls();
  //document.getElementById("progressFill").style.width = "100%";
  tableData = null;
}
//
let clusterize = null;

function renderClusterizedTable(result) {
  tableData = result || [];

  if (tableData.length === 0) {
    document.getElementById("tableHeader").innerHTML = "";
    //document.getElementById("paginationInfo").innerText = "No data loaded";
    //document.getElementById("noDataMessage").style.display = "block";
    if (clusterize) clusterize.clear();
    return;
  }

  //document.getElementById("noDataMessage").style.display = "none";
  //document.getElementById("totalRecords").innerText = `Total Records: ${tableData.length}`;

  // Render header
  const tableHeader = document.getElementById("tableHeader");
  tableHeader.innerHTML = "";
  const headerRow = document.createElement("tr");
  Object.keys(tableData[0]).forEach(col => {
    const th = document.createElement("th");
    th.innerText = col;
    headerRow.appendChild(th);
  });
  tableHeader.appendChild(headerRow);

  // Prepare rows for Clusterize
  const rows = tableData.map(row => {
    return `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join("")}</tr>`;
  });

  // Initialize or update Clusterize
  if (clusterize) {
    clusterize.update(rows);
  } else {
    clusterize = new Clusterize({
      rows,
      scrollId: 'scrollArea',
      contentId: 'contentArea'
    });
  }
  console.log("page loaded!");
  //document.getElementById("paginationInfo").innerText = `Showing virtualized rows (${tableData.length} total)`;
}
//
function nextPage() {
    //const totalPages = Math.ceil(tableData.length / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        gotoPage(currentPage);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        gotoPage(currentPage);
    }
}
