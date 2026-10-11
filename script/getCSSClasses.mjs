import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';

// Sort key: lowercased, without the pseudo part and the leading `.`, `#` or `[`
const sortKey = (selector) => {
  const lowerNoPseudo = selector.split(':')[0].toLowerCase();
  return /^[#.[]/.test(selector) ? lowerNoPseudo.slice(1) : lowerNoPseudo;
};

const uniqueSorted = (list) =>
  [...new Set(list)]
    .map((value) => ({ value, key: sortKey(value) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map(({ value }) => value);

// Returns `{ classes: [...] }`: every class used in the stylesheet's selectors,
// unique and sorted alphabetically
export async function getCSSClasses(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  // Source maps are not needed: don't follow the stylesheet's sourceMappingURL
  const root = postcss.parse(await response.text(), { map: { prev: false } });

  const selectors = [];
  root.walkRules((rule) => {
    // Ignore keyframes, whose steps (`10%`, `to`) look like selectors
    if (rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
    selectors.push(...rule.selectors);
  });

  const classes = [];
  const parser = selectorParser((selectorRoot) => {
    selectorRoot.walkClasses((node) => {
      classes.push(node.toString());
    });
  });
  for (const selector of uniqueSorted(selectors)) {
    parser.processSync(selector);
  }

  return { classes: uniqueSorted(classes) };
}
