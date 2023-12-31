<div align="center">
  <h1>Bootstrap Deprecated Classes Extension</h1>
  <p>Highlight Bootstrap deprecated classes.</p>
  <p>
    <a href="images/bootstrap-deprecated-classes-extension.png" title="Screenshot of the Bootstrap Deprecated Classes Extension">
      <img alt="Screenshot of the Bootstrap Deprecated Classes Extension" src="images/bootstrap-deprecated-classes-extension.png" width="800" />
    </a>
  </p>
</div>

<div align="center">
  <a href="https://github.com/julien-deramond/bootstrap-deprecated-classes-extension/blob/main/LICENSE">
    <img alt="License" src="https://badgen.net/github/license/julien-deramond/bootstrap-deprecated-classes-extension"/>
  </a>
  <br/><br/>
</div>

A browser extension highlighting [Bootstrap](https://getbootstrap.com/) deprecated classes in websites.

## Installation

You can install the extension directly from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/bootstrap-deprecated-classes/) or [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/bootstrap-deprecated-clas/gldcnbcldiippdmakcdppaglkaofoobi).

:warning: This extension is not yet available on the Chrome Web Store.

### Locally

For Firefox, you can run it locally:

* `web-ext run --devtools` to launch the extension in Firefox with DevTools.
* `web-ext run -u https://getbootstrap.com/docs/4.6` to launch the extension in Firefox with the Bootstrap 4 docs
* `web-ext build` to build the extension for distribution

For Chrome, please follow [Load an unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked) instructions.

For Microsoft Edge, please follow [Sideload an extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading) instructions.

## Data

Data are generated by running `npm run build` and are stored in the `data` folder:
* `bootstrap-{$version}-deprecated-classes` contains the list of deprecated classes for the given Bootstrap version which is compared to the latest Bootstrap version.
* `bootstrap-{$version}.json` contains the list of classes for the given Bootstrap version.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/julien-deramond/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/julien-deramond/static/sponsors.svg'/>
  </a>
</p>

## License

Licensed under the MIT License.

See [LICENSE](https://github.com/julien-deramond/bootstrap-deprecated-classes-extension/blob/main/LICENSE) for more information.
