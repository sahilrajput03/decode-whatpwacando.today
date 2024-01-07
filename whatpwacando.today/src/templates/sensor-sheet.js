export const template = `
  <material-bottom-sheet id="sensor-sheet">
      <h2 slot="header">Enabling sensors</h2>
      <div slot="body">
        <p>
          When motion sensors are not available on your device, you can follow these steps to enable them.
        </p>
        
        <h3>iOS</h3>
        <p class="no-support">
          This only applies to iOS 12. You may need to remove and add the app to the home screen again for the changes 
          to take effect.
        </p>
        <p>
          Open settings and scroll down to find Safari:
        </p>
        <p class="img"><img src="src/img/sensors-ios-step1.png"></p>
        
        <p>
          Scroll down to find "Motion & Orientation Access" and toggle the switch on:
        </p>
        <p class="img"><img src="src/img/sensors-ios-step2.png"></p>
      
        <h3>Android</h3>
        <p>
          Open this site in Chrome browser for Android and open the main menu by tapping the icon in the top-right 
          corner: 
        </p>

        <p class="img"><img src="src/img/sensors-step1.jpg"></p>
        
        <p>
          In the menu that opens, tap Settings:
        </p>
        
        <p class="img"><img src="src/img/sensors-step2.jpg"></p>
        
        <p>
          In the Settings, tap Site settings:
        </p>
        
        <p class="img"><img src="src/img/sensors-step3.jpg"></p>
        
        <p>
          In the Site settings menu, tap Motion sensors:
        </p>
        
        <p class="img"><img src="src/img/sensors-step4.jpg"></p>
        
        <p>
          You can now enable Motion sensors:
        </p>
        
        <p class="img"><img src="src/img/sensors-step5.jpg"></p>

      </div>
      <footer slot="footer">
        <material-button id="close-sensor-sheet" label="Close"></material-button>
      </footer>
    </material-bottom-sheet>
`;
