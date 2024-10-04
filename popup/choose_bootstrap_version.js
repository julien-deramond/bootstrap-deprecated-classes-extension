// Extension Initialization
// This script runs when the popup is opened. Since the checkbox states are not persistent,
// we need to retrieve the current state of the checkboxes and update them to reflect the
// current content on the page of the active tab.
// Note: The checkbox states reset to default when the page reloads, which means this
// behavior works more reliably with single-page applications (SPAs) than with traditional websites.
chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  for (const tab of tabs) {
    try {
      chrome.scripting.executeScript({
        target: {
          tabId: tab.id,
          allFrames: true,
        },
        func: () => {
          const state = {
            bs3: document.body.classList.contains('bootstrap-browser-extension-bs-3'),
            bs4: document.body.classList.contains('bootstrap-browser-extension-bs-4'),
            bs5: document.body.classList.contains('bootstrap-browser-extension-bs-5')
          };
          return state;
        },
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error(`Script injection failed: ${chrome.runtime.lastError.message}`);
        } else {
          const state = results[0].result;
          document.getElementById('bs3').checked = state.bs3;
          document.getElementById('bs4').checked = state.bs4;
          document.getElementById('bs5').checked = state.bs5;
        }
      });
    } catch (err) {
      console.error(`Failed to execute script: ${err}`);
    }
  }
});

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
