document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", switchFunction);
});

function switchFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    highlightDeprecatedClasses(tabs, this.id);
  });
}

async function highlightDeprecatedClasses(tabs, param) {
  for (const tab of tabs) {
    try {
      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
          allFrames: true,
        },
        func: (param) => {
          const extensionAvailableClasses = [
            "bootstrap-browser-extension-bs-4",
            "bootstrap-browser-extension-bs-3",
          ];

          document.body.classList.remove(...extensionAvailableClasses);

          switch(param) {
            case "bs3":
              document.body.classList.add("bootstrap-browser-extension-bs-3");
              break;
            case "bs4":
              document.body.classList.add("bootstrap-browser-extension-bs-4");
              break;
          }
        },
        args: [param],
      });
    } catch (err) {
      console.error(`Failed to execute script: ${err}`);
    }
  }
}
