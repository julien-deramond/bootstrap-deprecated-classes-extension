import * as fs from 'fs/promises';
import { getCSSClasses } from './getCSSClasses.mjs';

// Bootstrap versions available in the extension. `specifier` is resolved to an exact version on npm;
// pin pre-releases explicitly since `6` doesn't resolve to a pre-release version.
// `deprecated` lists the classes that still work in this version but will be removed in the next major one.
// They can't be detected automatically, so they're maintained manually here.
const bootstrapVersions = [
  { major: 3, specifier: '3', deprecated: [] },
  { major: 4, specifier: '4', deprecated: [] },
  {
    major: 5,
    specifier: '5',
    deprecated: [
      '.btn-close-white',
      '.carousel-dark',
      '.dropdown-menu-dark',
      '.navbar-dark',
      '.navbar-light',
      '.text-black-50',
      '.text-muted',
      '.text-white-50',
    ],
  },
  { major: 6, specifier: '6.0.0-alpha.1', deprecated: [] },
]

async function resolveVersion(specifier) {
  const url = `https://data.jsdelivr.com/v1/packages/npm/bootstrap/resolved?specifier=${specifier}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to resolve bootstrap@${specifier}: ${response.status} ${response.statusText}`)
  }
  return (await response.json()).version
}

// Get Bootstrap classes by version and store them in `./data/bootstrap-${major}.json` files
console.log("Getting Bootstrap classes...")
const versions = []
for (const { major, specifier, deprecated } of bootstrapVersions) {
  const version = await resolveVersion(specifier)
  const bootstrapCssPath = `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/css/bootstrap.css`
  console.log(`...${bootstrapCssPath}`)

  const versionClasses = await getCSSClasses(bootstrapCssPath)
  await fs.writeFile(`./data/bootstrap-${major}.json`, JSON.stringify(versionClasses))

  versions.push({ major, version, prerelease: version.includes('-'), deprecated })
}

// Store the versions metadata used by the extension to compare two versions
const versionsFilePath = './data/versions.json'
console.log(`Generating ${versionsFilePath}...`)
await fs.writeFile(versionsFilePath, JSON.stringify({ versions }, null, 2) + '\n')
