document.querySelectorAll('button[type="reset"]').forEach((button) => {
  button.addEventListener("click", reset);
});

document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
  checkbox.addEventListener("change", switchFunction);
});

function reset() {
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false;
    const event = new Event('change');
    checkbox.dispatchEvent(event);
  });
}

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
          console.log('----------', paramRef)

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
            case "bs5":
              if (paramChecked) {
                document.body.classList.add("bootstrap-browser-extension-bs-5");
              } else {
                document.body.classList.remove("bootstrap-browser-extension-bs-5");
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
