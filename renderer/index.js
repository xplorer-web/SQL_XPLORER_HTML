function togglePanel(panelId) {
  const panels = document.querySelectorAll(".expand-panel");
  const mainContent = document.querySelector(".main-content");

  let isOpening = false;

  panels.forEach((panel) => {
    if (panel.id === panelId) {
      const willOpen = !panel.classList.contains("active");
      panel.classList.toggle("active");
      isOpening = willOpen;
    } else {
      panel.classList.remove("active");
    }
  });

  // Shift main content only when a panel is active
  if (isOpening) {
    mainContent.classList.add("shifted");
  } else {
    mainContent.classList.remove("shifted");
  }
}
function setActiveTab(event, tabElement) {
  // Prevent click on close button from triggering tab activation
  if (event.target.classList.contains("close-btn")) return;

  // Remove active from all
  document.querySelectorAll(".file_inner").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Add active to clicked tab
  tabElement.classList.add("active");
}

function closeTab(event, btn) {
  event.stopPropagation(); // prevent activating when closing
  const tab = btn.parentElement;

  // If closed tab is active, activate another one
  if (tab.classList.contains("active")) {
    const nextTab = tab.nextElementSibling || tab.previousElementSibling;
    if (nextTab) nextTab.classList.add("active");
  }

  tab.remove();
}
