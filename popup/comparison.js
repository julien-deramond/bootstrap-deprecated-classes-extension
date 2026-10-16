// Pure helpers comparing two Bootstrap versions and generating the highlighting CSS.
// No browser extension API is used here so that this file can be tested with Node.js.

export const STATE_ATTRIBUTE = 'data-bootstrap-deprecated-classes';

// Classes of `from` that don't exist in `to` anymore are "removed".
// Classes flagged as deprecated in `to` (still working, but planned to be removed) are "deprecated".
export function compareVersions(fromClasses, toClasses, toDeprecatedClasses = []) {
  const toClassesSet = new Set(toClasses);
  const removed = fromClasses.filter((selector) => !toClassesSet.has(selector));
  const removedSet = new Set(removed);
  const deprecated = toDeprecatedClasses.filter((selector) => !removedSet.has(selector));
  return { removed, deprecated };
}

// `.lg\:d-none` -> `.lg:d-none`, to display the class name as written in the HTML
export function unescapeSelector(selector) {
  return selector.replace(/\\(.)/g, '$1');
}

function cssString(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\a ')}"`;
}

function highlightRules(scope, selectors, { borderColor, labelBackgroundColor }) {
  if (selectors.length === 0) return '';

  const list = selectors.join(', ');
  let css = `
${scope} :is(${list}) {
  border: 5px solid ${borderColor} !important;
  border-radius: 0 !important;
}

${scope} :is(${list})::before {
  color: #000;
  background-color: ${labelBackgroundColor};
  padding: 2px;
  border: 2px solid black;
  z-index: 10000;
}
`;
  for (const selector of selectors) {
    css += `${scope} ${selector}::before { content: ${cssString(unescapeSelector(selector))}; }\n`;
  }
  return css;
}

// Every rule is scoped to `:root[data-bootstrap-deprecated-classes="<from>-<to>"]` so the
// highlighting only applies while this comparison is active on the page.
// Deprecated rules come first so that removed ones (red) win when an element has both.
export function buildHighlightCSS({ removed, deprecated }, comparisonId) {
  const scope = `:root[${STATE_ATTRIBUTE}="${comparisonId}"]`;
  return [
    highlightRules(scope, deprecated, { borderColor: 'yellow', labelBackgroundColor: 'rgb(214, 202, 71)' }),
    highlightRules(scope, removed, { borderColor: 'red', labelBackgroundColor: 'rgb(189, 127, 127)' }),
  ].join('');
}

// `5.3.3` -> 5, `6.0.0-alpha.1` -> 6
export function majorVersion(version) {
  const major = Number.parseInt(String(version), 10);
  return Number.isNaN(major) ? null : major;
}
