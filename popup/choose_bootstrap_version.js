import { STATE_ATTRIBUTE, buildHighlightCSS, compareVersions, majorVersion } from './comparison.js';

// Extension Initialization
// This script runs when the popup is opened. The popup doesn't store anything: the active comparison
// is stored in the page itself (`<html data-bootstrap-deprecated-classes="<from>-<to>">`) so that the
// popup can reflect it when it's reopened.
// Note: The highlighting is lost when the page reloads, which means this behavior works more reliably
// with single-page applications (SPAs) than with traditional websites.

const form = document.getElementById('popup-content');
const fromSelect = document.getElementById('from');
const toSelect = document.getElementById('to');
const clearButton = document.getElementById('clear');
const detectedHint = document.getElementById('detected');
const statusMessage = document.getElementById('status');

const { versions } = await fetchJSON('../data/versions.json');
const latestStableMajor = Math.max(...versions.filter((v) => !v.prerelease).map((v) => v.major));
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const target = { tabId: tab.id, allFrames: true };

// `{ from, to }` of the comparison currently highlighted in the page, if any
let activeComparison = null;
// Comparisons already computed, by comparison id
const comparisons = new Map();

try {
  activeComparison = parseComparisonId(await readPageState());
} catch (err) {
  console.error(`Script injection failed: ${err}`);
  form.classList.add('hidden');
  document.getElementById('error-content').classList.remove('hidden');
  throw err;
}

const detectedVersion = await detectBootstrapVersion();
detectedHint.textContent = detectedVersion
  ? `Detected on this page: Bootstrap ${detectedVersion}`
  : 'Bootstrap version not detected on this page';
detectedHint.classList.remove('hidden');

for (const version of versions) {
  fromSelect.add(new Option(versionLabel(version), version.major));
  toSelect.add(new Option(versionLabel(version), version.major));
}

const isKnownMajor = (major) => versions.some((v) => v.major === major);
const detectedMajor = isKnownMajor(majorVersion(detectedVersion)) ? majorVersion(detectedVersion) : null;
const restoredComparison = isKnownMajor(activeComparison?.from) && isKnownMajor(activeComparison?.to) ? activeComparison : null;
const defaultFrom = restoredComparison?.from ?? detectedMajor ?? latestStableMajor;
fromSelect.value = defaultFrom;
toSelect.value = restoredComparison?.to ?? Math.max(defaultFrom, latestStableMajor);
updateTargetOptions();

if (activeComparison) {
  clearButton.disabled = false;
}
if (restoredComparison) {
  try {
    const comparison = await getComparison(restoredComparison.from, restoredComparison.to);
    renderStatus(await applyComparisonToPage(comparisonId(restoredComparison), comparison));
  } catch (err) {
    console.error(`Failed to restore the highlighting state: ${err}`);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  highlight();
});

clearButton.addEventListener('click', clear);

fromSelect.addEventListener('change', () => {
  updateTargetOptions();
  if (activeComparison) highlight();
});

toSelect.addEventListener('change', () => {
  if (activeComparison) highlight();
});

async function highlight() {
  const from = Number(fromSelect.value);
  const to = Number(toSelect.value);
  try {
    await removeActiveComparison();
    const comparison = await getComparison(from, to);
    activeComparison = { from, to };
    await chrome.scripting.insertCSS({ css: comparison.css, target });
    renderStatus(await applyComparisonToPage(comparisonId(activeComparison), comparison));
    clearButton.disabled = false;
  } catch (err) {
    console.error(`Failed to highlight classes: ${err}`);
  }
}

async function clear() {
  try {
    await removeActiveComparison();
    await chrome.scripting.executeScript({
      target,
      func: (attribute) => document.documentElement.removeAttribute(attribute),
      args: [STATE_ATTRIBUTE],
    });
  } catch (err) {
    console.error(`Failed to clear highlighting: ${err}`);
  }
  statusMessage.textContent = '';
  clearButton.disabled = true;
}

// Removes the CSS injected for the active comparison. `removeCSS()` needs the exact same CSS
// as the one injected, which is why it's generated again from the same data.
async function removeActiveComparison() {
  if (!activeComparison) return;
  const previous = activeComparison;
  activeComparison = null;
  try {
    const { css } = await getComparison(previous.from, previous.to);
    await chrome.scripting.removeCSS({ css, target });
  } catch (err) {
    // The CSS is scoped to the state attribute, so it's harmless once the attribute is removed
    console.error(`Failed to remove the previous highlighting: ${err}`);
  }
}

// Sets the state attribute in every frame and counts the matching elements
async function applyComparisonToPage(id, { removed, deprecated }) {
  const results = await chrome.scripting.executeScript({
    target,
    func: (attribute, id, removed, deprecated) => {
      document.documentElement.setAttribute(attribute, id);

      const find = (selectors) => {
        const classes = [];
        const elements = new Set();
        for (const selector of selectors) {
          let found = [];
          try {
            found = document.querySelectorAll(selector);
          } catch {
            continue;
          }
          if (found.length > 0) {
            classes.push(selector);
            found.forEach((element) => elements.add(element));
          }
        }
        return { classes, elements: elements.size };
      };

      return { removed: find(removed), deprecated: find(deprecated) };
    },
    args: [STATE_ATTRIBUTE, id, removed, deprecated],
  });

  // Merge the results of every frame
  const merge = (kind) => {
    const frames = results.map((result) => result.result?.[kind]).filter(Boolean);
    return {
      classes: new Set(frames.flatMap((frame) => frame.classes)).size,
      elements: frames.reduce((total, frame) => total + frame.elements, 0),
    };
  };
  return { removed: merge('removed'), deprecated: merge('deprecated') };
}

function renderStatus({ removed, deprecated }) {
  if (removed.elements === 0 && deprecated.elements === 0) {
    statusMessage.textContent = 'No removed or deprecated classes found on this page.';
    return;
  }

  const parts = [];
  if (removed.elements > 0) {
    parts.push(`${plural(removed.elements, 'element')} using ${plural(removed.classes, 'removed class', 'removed classes')}`);
  }
  if (deprecated.elements > 0) {
    parts.push(`${plural(deprecated.elements, 'element')} using ${plural(deprecated.classes, 'deprecated class', 'deprecated classes')}`);
  }
  statusMessage.textContent = `Found ${parts.join(' and ')}.`;
}

// Targets older than the site's version make no sense
function updateTargetOptions() {
  const from = Number(fromSelect.value);
  for (const option of toSelect.options) {
    option.disabled = Number(option.value) < from;
  }
  if (Number(toSelect.value) < from) {
    toSelect.value = from;
  }
}

async function readPageState() {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (attribute) => document.documentElement.getAttribute(attribute),
    args: [STATE_ATTRIBUTE],
  });
  return result.result;
}

// Best effort: the page's JavaScript (Bootstrap 3 to 5 expose their version), then the URLs of the
// stylesheets and scripts (CDNs usually contain the version), then the Bootstrap documentation URLs
async function detectBootstrapVersion() {
  const func = () => {
    const versionFromJS = window.bootstrap?.Tooltip?.VERSION ?? window.jQuery?.fn?.tooltip?.Constructor?.VERSION;
    if (typeof versionFromJS === 'string') return versionFromJS;

    const urls = [...document.querySelectorAll('link[href], script[src]')].map((element) => element.href || element.src);
    for (const url of urls) {
      const match = String(url).match(/bootstrap(?:@|\/|-)v?(\d+\.\d+\.\d+(?:-[0-9a-z.]+)?)/i);
      if (match) return match[1];
    }

    if (location.hostname === 'getbootstrap.com') {
      const match = location.pathname.match(/^\/docs\/(\d+\.\d+)\//);
      if (match) return match[1];
    }

    return null;
  };

  // The page's own `window` is only reachable from the main world, which isn't supported everywhere
  for (const world of ['MAIN', 'ISOLATED']) {
    try {
      const [result] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world, func });
      return result.result;
    } catch (err) {
      console.error(`Failed to detect the Bootstrap version in the ${world} world: ${err}`);
    }
  }
  return null;
}

async function getComparison(from, to) {
  const id = comparisonId({ from, to });
  if (!comparisons.has(id)) {
    const toVersion = versions.find((v) => v.major === to);
    if (!toVersion || !versions.some((v) => v.major === from)) {
      throw new Error(`Unknown comparison: ${id}`);
    }
    const [{ classes: fromClasses }, { classes: toClasses }] = await Promise.all([
      fetchJSON(`../data/bootstrap-${from}.json`),
      fetchJSON(`../data/bootstrap-${to}.json`),
    ]);
    const comparison = compareVersions(fromClasses, toClasses, toVersion.deprecated);
    comparisons.set(id, { ...comparison, css: buildHighlightCSS(comparison, id) });
  }
  return comparisons.get(id);
}

function comparisonId({ from, to }) {
  return `${from}-${to}`;
}

function parseComparisonId(id) {
  const match = /^(\d+)-(\d+)$/.exec(id ?? '');
  return match ? { from: Number(match[1]), to: Number(match[2]) } : null;
}

// `Bootstrap 5 (5.3.8)`, `Bootstrap 6 alpha (6.0.0-alpha.1)`
function versionLabel({ major, version, prerelease }) {
  const stage = prerelease ? ` ${version.split('-')[1].split('.')[0]}` : '';
  return `Bootstrap ${major}${stage} (${version})`;
}

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

async function fetchJSON(path) {
  const response = await fetch(path);
  return response.json();
}
