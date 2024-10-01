// TODO: handle the "reset" button
/* document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", switchFunction);
}); */

document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener("change", switchFunction);
});

function switchFunction() {
  chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    highlightDeprecatedClasses(tabs, this.id, this.checked);
  });
}

async function highlightDeprecatedClasses(tabs, paramRef, paramChecked) {
  for (const tab of tabs) {
    try {
      await chrome.scripting.insertCSS({
        files: ["/styles.css"],
        target: {
          tabId: tab.id,
          allFrames: true,
        }
      });

      await chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
          allFrames: true,
        },
        func: async (paramRef, paramChecked) => {
          const extensionAvailableClasses = [
            "bootstrap-browser-extension-bs-4",
            "bootstrap-browser-extension-bs-3",
          ];

          console.log(paramRef + '-' + paramChecked);

          // document.body.classList.remove(...extensionAvailableClasses);

          switch(paramRef) {
            case "bs3":
              if (paramChecked) {
                document.body.classList.add("bootstrap-browser-extension-bs-3");
              } else {
                document.body.classList.remove("bootstrap-browser-extension-bs-3");
              }
              break;
            case "bs4":
              if (paramChecked) {
                document.body.classList.add("bootstrap-browser-extension-bs-4");
              } else {
                document.body.classList.remove("bootstrap-browser-extension-bs-4");
              }
              break;
          }
        },
        args: [paramRef, paramChecked],
      });
    } catch (err) {
      console.error(`Failed to execute script: ${err}`);
    }
  }
}
