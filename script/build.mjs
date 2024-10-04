import * as fs from 'fs/promises';
import * as diff from 'fast-array-diff';
import { getCSSClasses } from './getCSSClasses.mjs';
import { outputFile, remove } from 'fs-extra';

const minimumBootstrapVersion = 3
const maximumBootstrapVersion = 5
const bootstrapVersions = Array.from({ length: maximumBootstrapVersion - minimumBootstrapVersion + 1 }, (_, i) => i + minimumBootstrapVersion)

// Get Bootstrap classes by version and store them in `./data/bootstrap-${version}.json` files
console.log("Getting Bootstrap classes...")
for (const version of bootstrapVersions) {
  const bootstrapCssPath = `https://cdn.jsdelivr.net/npm/bootstrap@${version}/dist/css/bootstrap.css`
  console.log(`...${bootstrapCssPath}`)

  const versionClasses = await getCSSClasses(bootstrapCssPath)

  const outputFilePath = `./data/bootstrap-${version}.json`
  await fs.writeFile(outputFilePath, JSON.stringify(versionClasses));
}

// Generate ./data/bootstrap-${version}-deprecated-classes.json` files by comparing each version to the last one
console.log("Comparing Bootstrap classes...")
for (const version of bootstrapVersions.slice(0, -1)) {
  console.log(`...comparing Bootstrap ${version} to Bootstrap ${maximumBootstrapVersion}`)

  const outputJSONContent = diff.diff(
    JSON.parse(await fs.readFile(`./data/bootstrap-${version}.json`)).classes,
    JSON.parse(await fs.readFile(`./data/bootstrap-${maximumBootstrapVersion}.json`)).classes
  )

  const outputFilePath = `./data/bootstrap-${version}-deprecated-classes.json`
  await fs.writeFile(outputFilePath, JSON.stringify(outputJSONContent))
}

// Generate ./data/bootstrap-${version}-deprecated-classes.json` manually for the latest version
const latestVersionOutputFilePath = `./data/bootstrap-${maximumBootstrapVersion}-deprecated-classes.json`
await fs.writeFile(latestVersionOutputFilePath, JSON.stringify({
  deprecated: [
    ".btn-close-white",
    ".carousel-dark",
    ".dropdown-menu-dark",
    ".navbar-dark",
    ".navbar-light",
    ".text-black-50",
    ".text-muted",
    ".text-white-50",
  ] 
}))

// Generate CSS file from `data/bootstrap-${version}-deprecated-classes.json` files
const generatedCSSFile = "./styles.css"
console.log(`Generating ${generatedCSSFile}...`)
await fs.writeFile(generatedCSSFile, "")
for (const version of bootstrapVersions) {
  await fs.appendFile(generatedCSSFile, `.bootstrap-browser-extension-bs-${version} {`)

  const removedClasses = JSON.parse(await fs.readFile(`data/bootstrap-${version}-deprecated-classes.json`)).removed ?? []
  for (const removedClass of removedClasses) {
    await fs.appendFile(generatedCSSFile,
  `
  ${removedClass} {
    border: 5px solid red;
    border-radius: 0;

    &::before {
      color: #000;
      background-color: rgb(189, 127, 127);
      padding: 2px;
      border: 2px solid black;
      z-index: 10000;
      content: '${removedClass}'
    }
  }
  `
    )
  }

  const deprecatedClasses = JSON.parse(await fs.readFile(`data/bootstrap-${version}-deprecated-classes.json`)).deprecated ?? []
  for (const deprecatedClass of deprecatedClasses) {
    await fs.appendFile(generatedCSSFile,
  `
  ${deprecatedClass} {
    border: 5px solid yellow;
    border-radius: 0;

    &::before {
      color: #000;
      background-color: rgb(214, 202, 71);
      padding: 2px;
      border: 2px solid black;
      z-index: 10000;
      content: '${deprecatedClass}'
    }
  }
  `
    )
  }

  await fs.appendFile(generatedCSSFile, "}\n")
}
