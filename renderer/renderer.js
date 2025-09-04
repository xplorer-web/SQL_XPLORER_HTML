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
    const response = await fetch(`components/${file}`);
    const html = await response.text();
    document.getElementById(id).innerHTML = html;
  } catch (error) {
    console.error("Failed to load  content:", error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  console.log("11111111111");
  loadComponent("codefile", "codefile.html");
  loadComponent("datafile", "data-file.html");
  //loadComponent("footer", "footer.html");
});
