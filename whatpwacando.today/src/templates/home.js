import "@dannymoerkerke/material-webcomponents/src/material-button.js";
const installed =
  "getInstalledRelatedApps" in navigator &&
  (await navigator.getInstalledRelatedApps()).length > 0;

export const template = `
<div class="view home">
  <header id="main-header">
    <img class="logo" src="src/img/pwalogo.svg">
  </header>
  <div class="network-status">
    <header>
      <i class="material-icons">wifi_off</i>
      <p>Your device is currently offline.</p>
    </header>
  </div>
  <div class="content">
    <h1>What PWA Can Do Today</h1>
    <p>
      A showcase of what is possible with Progressive Web Apps today. 
    </p>
    <p>
      A Progressive Web App (PWA) is a website that can be installed on your device and provide an app-like experience 
      <a href="/info">read more</a>
    </p>
    
    ${
      !installed
        ? `
    <section id="installation">
      <h2>How to use this app</h2>
    
      <p>
        This app is itself a Progressive Web App which means it can be installed to the homescreen of your
        mobile device or to your desktop.
      </p>
      
      <p>
        After installing you can check the demos of the features below to see what is supported on your device.
      </p>
      
      <p>
        When the button below becomes enabled, you can install this app.
      </p>
      
      <p>
        <material-button id="install-button" label="Install to home screen" raised>
          <i class="material-icons" slot="left-icon">add_to_home_screen</i>
        </material-button>
      </p>
    </section>`
        : ``
    }
    
    <section id="installed">
      <p>
        Check the demos of the features below to see what is supported on your device.
      </p>
    </section>
    
    <h2>Features</h2>
    
    <section class="feature-grid">
      <div class="feature">
        <a href="/media">
          <material-button>
              <i class="material-icons" slot="left-icon">videocam</i>
          </material-button>
        </a>
        <aside>
          <header>Media capture</header>
          <p>Media capture allows web apps to use the camera and microphone of a device</p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/geolocation">
          <material-button>
              <i class="material-icons" slot="left-icon">gps_fixed</i>
          </material-button>
        </a>
        <aside>
          <header>Geolocation</header>
          <p>
            The Geolocation API enables users to share their location with web apps .
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/notifications">
          <material-button>
              <i class="material-icons" slot="left-icon">notifications_none</i>
          </material-button>
        </a>
        <aside>
          <header>Notifications</header>
          <p>
            The Notifications API enables web apps to display notifications, even when the app is not active.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/contacts">
          <material-button>
              <i class="material-icons" slot="left-icon">account_box</i>
          </material-button>
        </a>
        <aside>
          <header>Contact picker</header>
          <p>
            The Contact Picker API allows web apps to select the user's contacts after permission has been granted.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/web-share">
          <material-button>
              <i class="material-icons" slot="left-icon">share</i>
          </material-button>
        </a>
        <aside>
          <header>Web share</header>
          <p>
            The Web Share API invokes the native share mechanism of the device and allows users to share 
            text, URLs or files.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/authentication">
          <material-button>
              <i class="material-icons" slot="left-icon">fingerprint</i>
          </material-button>
        </a>
        <aside>
          <header>Authentication</header>
          <p>
            Web Authentication API (WebAuthn) enables passwordless authentication through your device's fingerprint 
            reader or an external USB Security Key.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/file-system">
          <material-button>
              <i class="material-icons" slot="left-icon">insert_drive_file</i>
          </material-button>
        </a>
        <aside>
          <header>File System</header>
          <p>
            Access to the file system of the user's device
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/barcode">
          <material-button>
              <i class="material-icons" slot="left-icon">qr_code_scanner</i>
          </material-button>
        </a>
        <aside>
          <header>Barcode detection</header>
          <p>
            The Barcode Detection API detects barcodes and qr-codes in images.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/face-detection">
          <material-button>
              <i class="material-icons" slot="left-icon">face</i>
          </material-button>
        </a>
        <aside>
          <header>Face detection</header>
          <p>
            The Shape Detection API detects faces in images.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/vibration">
          <material-button>
              <i class="material-icons" slot="left-icon">vibration</i>
          </material-button>
        </a>
        <aside>
          <header>Vibration</header>
          <p>
            The Vibration API enables web apps to make a mobile device vibrate.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/audio-recording">
          <material-button>
              <i class="material-icons" slot="left-icon">mic</i>
          </material-button>
        </a>
        <aside>
          <header>Audio recording</header>
          <p>
            Record audio using MediaRecorder and visualize audio using Web Audio API.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/audio">
          <material-button>
              <i class="material-icons" slot="left-icon">play_circle_filled</i>
          </material-button>
        </a>
        <aside>
          <header>Audio</header>
          <p>
            The Media Session API allows web apps to display controls for media playback on a device's lock screen.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/background-sync">
          <material-button>
              <i class="material-icons" slot="left-icon">sync</i>
          </material-button>
        </a>
        <aside>
          <header>Background Sync API</header>
          <p>
            The Background Sync API enables web apps to defer tasks when it's offline so they can be run when the network 
            connection is restored.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/background-fetch">
          <material-button>
              <i class="material-icons" slot="left-icon">downloading</i>
          </material-button>
        </a>
        <aside>
          <header>Background Fetch API</header>
          <p>
            The Background Fetch API enables web apps to download large files in the background even when the app is not 
            running.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/capture-handle">
          <material-button>
              <i class="material-icons" slot="left-icon">screen_share</i>
          </material-button>
        </a>
        <aside>
          <header>Capture Handle</header>
          <p>
            Capture Handle enables screen capturing web apps to reliably communicate with captured web apps.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/storage">
          <material-button>
              <i class="material-icons" slot="left-icon">inventory</i>
          </material-button>
        </a>
        <aside>
          <header>Storage API</header>
          <p>
            The Storage API enables web apps to persist structured data in the user's browser.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/bluetooth">
          <material-button>
              <i class="material-icons" slot="left-icon">bluetooth</i>
          </material-button>
        </a>
        <aside>
          <header>Bluetooth</header>
          <p>
            The Web Bluetooth API enables web apps to connect to Bluetooth Low Energy (BLE) devices and read values from or 
            write values to it.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/nfc">
          <material-button>
              <i class="material-icons" slot="left-icon">nfc</i>
          </material-button>
        </a>
        <aside>
          <header>NFC</header>
          <p>
            The Web NFC API enables web apps to read and write to NFC tags.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/ar-vr">
          <material-button>
              <i class="material-icons" slot="left-icon">layers</i>
          </material-button>
        </a>
        <aside>
          <header>AR/VR</header>
          <p>
            Augmented reality enables web apps to place virtual objects in reality.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/payment">
          <material-button>
              <i class="material-icons" slot="left-icon">credit_card</i>
          </material-button>
        </a>
        <aside>
          <header>Payment</header>
          <p>
            The Payment Request API provides a browser-based method to enable users to make payments on the web, using a credit 
            card, Apple Pay or Google Pay.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/wake-lock">
          <material-button>
              <i class="material-icons" slot="left-icon">screen_lock_portrait</i>
          </material-button>
        </a>
        <aside>
          <header>Wake lock</header>
          <p>
            The Screen Wake Lock API enables web apps to prevent devices from dimming or locking the screen when the app 
            needs to keep running.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/device-orientation">
          <material-button>
              <i class="material-icons" slot="left-icon">screen_rotation</i>
          </material-button>
        </a>
        <aside>
          <header>Orientation</header>
          <p>
            The DeviceOrientationEvent gives information about the physical orientation of the user's device.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/device-motion">
          <material-button>
              <i class="material-icons" slot="left-icon">3d_rotation</i>
          </material-button>
        </a>
        <aside>
          <header>Motion</header>
          <p>
            The DeviceMotionEvent gives information about the speed of changes for the position and orientation of 
            the user's device.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/network-info">
          <material-button>
              <i class="material-icons" slot="left-icon">network_check</i>
          </material-button>
        </a>
        <aside>
          <header>Network info</header>
          <p>
            The NetworkInformation API provides information about the connection of a device, allowing web apps to adapt 
            functionality based on network quality.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/speech-synthesis">
          <material-button>
              <i class="material-icons" slot="left-icon">record_voice_over</i>
          </material-button>
        </a>
        <aside>
          <header>Speech synthesis</header>
          <p>
            Speech synthesis provides text-to-speech and allows programs to read out their text content.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/speech-recognition">
          <material-button>
              <i class="material-icons" slot="left-icon">hearing</i>
          </material-button>
        </a>
        <aside>
          <header>Speech recogniton</header>
          <p>
            Speech recognition is part of the Web Speech API and provides the ability to recognize voice context from an 
            audio input.
          </p>
        </aside>
      </div>
      
      <div class="feature">
        <a href="/multi-touch">
          <material-button>
              <i class="material-icons" slot="left-icon">touch_app</i>
          </material-button>
        </a>
        <aside>
          <header>Multi touch</header>
          <p>
            Touch events enable web apps to capture complex touch behaviour.
          </p>
        </aside>
      </div>
    </section>
  </div>
</div>
`;
