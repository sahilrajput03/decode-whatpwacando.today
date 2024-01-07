import { getPlatform, getBrowser } from "../lib/utils.js";

const templates = {
  "ios-safari": `
    <header><h2 slot="header">Installing on iOS</h2></header>
    <div class="body">
      <p>
        To install the app from Safari on iOS, tap the share button:
      </p>
      <picture>
        <source srcset="/src/img/install/ios-safari-1.webp" type="image/webp">
        <source srcset="/src/img/install/ios-safari-1.png" type="image/png">
        <img src="/src/img/install/ios-safari-1.webp">
      </picture>
      <p>
        Then swipe up to find and tap "Add to home screen":
      </p>
      <picture>
        <source srcset="/src/img/install/ios-safari-2.webp" type="image/webp">
        <source srcset="/src/img/install/ios-safari-2.png" type="image/png">
        <img src="/src/img/install/ios-safari-2.webp">
      </picture>
    </div>
  `,
  "ios-chrome": `
    <header><h2 slot="header">Installing on iOS</h2></header>
    <div class="body">
      <p>
        To install the app from Chrome on iOS, tap the share button:
      </p>
      <picture>
        <source srcset="/src/img/install/ios-chrome-1.webp" type="image/webp">
        <source srcset="/src/img/install/ios-chrome-1.png" type="image/png">
        <img src="/src/img/install/ios-chrome-1.webp">
      </picture>
      <p>
        Then swipe up to find and tap "Add to home screen":
      </p>
      <picture>
        <source srcset="/src/img/install/ios-chrome-2.webp" type="image/webp">
        <source srcset="/src/img/install/ios-chrome-2.png" type="image/png">
        <img src="/src/img/install/ios-chrome-2.webp">
      </picture>
    </div>
  `,
  "ios-edge": `
    <header><h2 slot="header">Installing on iOS</h2></header>
    <div class="body">
      <p>
        To install the app from Edge on iOS, tap the menu button:
      </p>
      <picture>
        <source srcset="/src/img/install/ios-edge-1.webp" type="image/webp">
        <source srcset="/src/img/install/ios-edge-1.png" type="image/png">
        <img src="/src/img/install/ios-edge-1.webp">
      </picture>
      <p>
        Then swipe up to find and tap "Share":
      </p>
      <picture>
        <source srcset="/src/img/install/ios-edge-2.webp" type="image/webp">
        <source srcset="/src/img/install/ios-edge-2.png" type="image/png">
        <img src="/src/img/install/ios-edge-2.webp">
      </picture>
      <p>
        Then swipe up to find and tap "Add to home screen":
      </p>
      <picture>
        <source srcset="/src/img/install/ios-edge-3.webp" type="image/webp">
        <source srcset="/src/img/install/ios-edge-3.png" type="image/png">
        <img src="/src/img/install/ios-edge-3.webp">
      </picture>
    </div>
  `,
  "ios-firefox": `
    <header><h2 slot="header">Installing on iOS</h2></header>
    <div class="body">
      <p>
        To install the app from Firefox on iOS, tap the menu button:
      </p>
      <picture>
        <source srcset="/src/img/install/ios-firefox-1.webp" type="image/webp">
        <source srcset="/src/img/install/ios-firefox-1.png" type="image/png">
        <img src="/src/img/install/ios-firefox-1.webp">
      </picture>
      <p>
        Then find and tap "Share":
      </p>
      <picture>
        <source srcset="/src/img/install/ios-firefox-2.webp" type="image/webp">
        <source srcset="/src/img/install/ios-firefox-2.png" type="image/png">
        <img src="/src/img/install/ios-firefox-2.webp">
      </picture>
      <p>
        Then swipe up to find and tap "Add to home screen":
      </p>
      <picture>
        <source srcset="/src/img/install/ios-firefox-3.webp" type="image/webp">
        <source srcset="/src/img/install/ios-firefox-3.png" type="image/png">
        <img src="/src/img/install/ios-firefox-3.webp">
      </picture>
    </div>
  `,
  "android-edge": `
    <header><h2 slot="header">Installing on Android</h2></header>
    <div class="body">
      <p>
        To install the app from Edge on Android, tap the menu button:
      </p>
      <picture>
        <source srcset="/src/img/install/android-edge-1.webp" type="image/webp">
        <source srcset="/src/img/install/android-edge-1.png" type="image/png">
        <img src="/src/img/install/android-edge-1.webp">
      </picture>
      <p>
        Then swipe left to find and tap "Add to phone":
      </p>
      <picture>
        <source srcset="/src/img/install/android-edge-2.webp" type="image/webp">
        <source srcset="/src/img/install/android-edge-2.png" type="image/png">
        <img src="/src/img/install/android-edge-2.webp">
      </picture>
    </div>
  `,
  "android-firefox": `
    <header><h2 slot="header">Installing on Android</h2></header>
    <div class="body">
      <p>
        To install the app from Firefox on Android, tap the menu button:
      </p>
      <picture>
        <source srcset="/src/img/install/android-firefox-1.webp" type="image/webp">
        <source srcset="/src/img/install/android-firefox-1.png" type="image/png">
        <img src="/src/img/install/android-firefox-1.webp">
      </picture>
      <p>
        Then find and tap "Install":
      </p>
      <picture>
        <source srcset="/src/img/install/android-firefox-2.webp" type="image/webp">
        <source srcset="/src/img/install/android-firefox-2.png" type="image/png">
        <img src="/src/img/install/android-firefox-2.webp">
      </picture>
    </div>
  `,
  "macos-safari": `
    <header><h2 slot="header">Installing on MacOS</h2></header>
    <div class="body">
      <p>
        To install the app from Safari on MacOS, click File:
      </p>
      <picture>
        <source srcset="/src/img/install/macos-safari-1.webp" type="image/webp">
        <source srcset="/src/img/install/macos-safari-1.png" type="image/png">
        <img src="/src/img/install/macos-safari-1.webp">
      </picture>
      <p>
        Then click "Add to Dock":
      </p>
      <picture>
        <source srcset="/src/img/install/macos-safari-2.webp" type="image/webp">
        <source srcset="/src/img/install/macos-safari-2.png" type="image/png">
        <img src="/src/img/install/macos-safari-2.webp">
      </picture>
    </div>
  `,
  "macos-firefox": `
    <header><h2 slot="header">Installing on MacOS</h2></header>
    <div class="body">
      <p>
        Currently, PWAs cannot be installed in Firefox. Please choose another browser like Safari, Chrome or Edge.
      </p>
    </div>
  `,
  "windows-firefox": `
    <header><h2 slot="header">Installing on Windows</h2></header>
    <div class="body">
      <p>
        Currently, PWAs cannot be installed in Firefox. Please choose another browser like Chrome or Edge.
      </p>
    </div>
  `,
};

export const getInstallSheetTemplate = () => {
  const key = `${getPlatform()}-${getBrowser()}`;

  return templates[key];
};
