import { router } from "./lib/router.js";
import { handleOffline, handleOnline } from "../app.js";
import "@dannymoerkerke/material-webcomponents/src/material-dialog.js";
import { template as sensorSheetTemplate } from "./templates/sensor-sheet.js";
import { getStore } from "./lib/idb.js";
import { getInstallSheetTemplate } from "./templates/installsheet.js";

const contactApi =
  "https://6srbe7uzgd.execute-api.us-east-1.amazonaws.com/production/contact";

const sensorSheet = document.querySelector("#sensor-sheet");

document.querySelector("#close-sensor-sheet").addEventListener("click", () => {
  sensorSheet.close();
});

const outlet = document.querySelector("#main-content");
const nav = null;

const routes = [
  {
    url: "/",
    template: () => import("./templates/home.js"),
    controller() {
      const installButton = document.querySelector("#install-button");
      const installSheet = document.querySelector("#install-sheet");
      const closeButton = document.querySelector("#close-install-sheet");

      const supportsInstallPrompt = "onbeforeinstallprompt" in window;

      window.addEventListener("load", (e) => {
        if (installButton) {
          installButton.disabled =
            window.deferredPrompt === undefined ? supportsInstallPrompt : false;
        }
      });

      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();

        if (installButton) {
          installButton.disabled = false;
        }
      });

      if (installButton) {
        if (!supportsInstallPrompt) {
          const template = getInstallSheetTemplate();

          if (!installSheet.querySelector('[name="body"]')) {
            installSheet
              .querySelector("section")
              .insertAdjacentHTML("afterbegin", template);
          }
        }

        installButton.addEventListener("click", () => {
          if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
          } else if (!supportsInstallPrompt) {
            installSheet.showModal();
          }
        });
      }

      closeButton.addEventListener("click", (e) => {
        installSheet.close();
      });

      window.addEventListener("appinstalled", (e) => {
        if (installButton) {
          installButton.disabled = true;
        }
      });
    },
  },
  {
    url: "/media",
    template: () => import("./templates/media.js"),
    onExit() {
      const webCam = document.querySelector("web-cam");
      try {
        if (webCam.preview.src !== "") {
          webCam.closeVideo();
        }
        if (webCam.stream) {
          webCam.stopVideo();
        }
      } catch (e) {
        console.error(e);
      }
    },
    exitOnHidden: true,
  },
  {
    url: "/audio",
    template: () => import("./templates/audio.js"),
    controller() {
      if ("mediaSession" in navigator) {
        const player = document.querySelector("audio");

        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Shadows of Ourselves",
          artist: "Thievery Corporation",
          album: "The Mirror Conspiracy",
          artwork: [
            {
              src: "https://whatpwacando.today/src/img/media/mirror-conspiracy256x256.jpeg",
              sizes: "256x256",
              type: "image/jpeg",
            },
            {
              src: "https://whatpwacando.today/src/img/media/mirror-conspiracy512x512.jpeg",
              sizes: "512x512",
              type: "image/jpeg",
            },
          ],
        });

        navigator.mediaSession.setActionHandler("play", () => player.play());
        navigator.mediaSession.setActionHandler("pause", () => player.pause());
        navigator.mediaSession.setActionHandler("seekbackward", (details) => {
          const skipTime = details.seekOffset || 1;
          player.currentTime = Math.max(player.currentTime - skipTime, 0);
        });

        navigator.mediaSession.setActionHandler("seekforward", (details) => {
          const skipTime = details.seekOffset || 1;
          player.currentTime = Math.min(
            player.currentTime + skipTime,
            player.duration
          );
        });

        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.fastSeek && "fastSeek" in player) {
            player.fastSeek(details.seekTime);
            return;
          }
          player.currentTime = details.seekTime;
        });

        navigator.mediaSession.setActionHandler("previoustrack", () => {
          player.currentTime = 0;
        });
      }
    },
  },
  {
    url: "/audio-recording",
    template: () => import("./templates/audio-recording.js"),
    controller() {
      const recorder = document.querySelector("audio-recorder");
      const micPermissionDialog = document.querySelector(
        "#mic-permission-dialog"
      );
      const closeButton = document.querySelector("#dialog-close");

      recorder.addEventListener("notallowed", () => micPermissionDialog.open());
      closeButton.addEventListener("click", () => micPermissionDialog.close());
    },
  },
  {
    url: "/authentication",
    template: () => import("./templates/authentication.js"),
    controller() {
      const registerButton = document.querySelector("#register-button");
      const authenticateButton = document.querySelector("#authenticate-button");
      const deleteButton = document.querySelector("#delete-button");
      const loader = document.querySelector("#loader");
      const authDialog = document.querySelector("#auth-dialog");
      const dialogBody = authDialog.querySelector('[slot="body"]');
      const closeButton = document.querySelector("#close-dialog");

      closeButton.addEventListener("click", () => {
        authDialog.close();
      });

      const bufferToBase64 = (buffer) =>
        btoa(String.fromCharCode(...new Uint8Array(buffer)));
      const base64ToBuffer = (base64) =>
        Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const removeCredential = () => {
        localStorage.removeItem("credential");
        deleteButton.style.display = "none";
        authenticateButton.style.display = "none";
        registerButton.style.display = "block";
      };

      const apiUrl = "https://api.whatpwacando.today/webauthn";
      // const apiUrl = 'http://localhost:3000';

      const register = async () => {
        registerButton.disabled = true;
        loader.style.display = "block";

        try {
          const credentialCreationOptions = await (
            await fetch(`${apiUrl}/registration-options`, {
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            })
          ).json();

          credentialCreationOptions.challenge = new Uint8Array(
            credentialCreationOptions.challenge.data
          );
          credentialCreationOptions.user.id = new Uint8Array(
            credentialCreationOptions.user.id.data
          );
          credentialCreationOptions.user.name = "pwa@whatpwacando.today";
          credentialCreationOptions.user.displayName = "What PWA Can Do Today";

          const credential = await navigator.credentials.create({
            publicKey: credentialCreationOptions,
          });

          const credentialId = bufferToBase64(credential.rawId);

          localStorage.setItem("credential", JSON.stringify({ credentialId }));

          const data = {
            rawId: credentialId,
            response: {
              attestationObject: bufferToBase64(
                credential.response.attestationObject
              ),
              clientDataJSON: bufferToBase64(
                credential.response.clientDataJSON
              ),
              id: credential.id,
              type: credential.type,
            },
          };

          await (
            await fetch(`${apiUrl}/register`, {
              method: "POST",
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ credential: data }),
              credentials: "include",
            })
          ).json();

          registerButton.style.display = "none";
          authenticateButton.style.display = "block";
          deleteButton.style.display = "block";

          dialogBody.innerHTML = "Registration successful!";
          authDialog.open();
        } catch (e) {
          console.error("registration failed", e);

          dialogBody.innerHTML = "Registration failed";
          authDialog.open();
        } finally {
          registerButton.disabled = false;
          loader.style.display = "none";
        }
      };

      const authenticate = async () => {
        authenticateButton.disabled = true;
        deleteButton.disabled = true;
        loader.style.display = "block";

        try {
          const credentialRequestOptions = await (
            await fetch(`${apiUrl}/authentication-options`, {
              mode: "cors",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
            })
          ).json();

          const { credentialId } = JSON.parse(
            localStorage.getItem("credential")
          );

          credentialRequestOptions.challenge = new Uint8Array(
            credentialRequestOptions.challenge.data
          );
          credentialRequestOptions.allowCredentials = [
            {
              id: base64ToBuffer(credentialId),
              type: "public-key",
              transports: ["internal"],
            },
          ];

          const credential = await navigator.credentials.get({
            publicKey: credentialRequestOptions,
          });

          const data = {
            rawId: bufferToBase64(credential.rawId),
            response: {
              authenticatorData: bufferToBase64(
                credential.response.authenticatorData
              ),
              signature: bufferToBase64(credential.response.signature),
              userHandle: bufferToBase64(credential.response.userHandle),
              clientDataJSON: bufferToBase64(
                credential.response.clientDataJSON
              ),
              id: credential.id,
              type: credential.type,
            },
          };

          const response = await fetch(`${apiUrl}/authenticate`, {
            method: "POST",
            mode: "cors",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ credential: data }),
            credentials: "include",
          });

          if (response.status === 404) {
            dialogBody.innerHTML =
              "Credential has expired, please register a new credential";

            authDialog.open();
            removeCredential();
          } else {
            const assertionResponse = await response.json();

            dialogBody.innerHTML = "Authentication successful!";
            authDialog.open();
          }
        } catch (e) {
          console.error("authentication failed", e);

          dialogBody.innerHTML = "Authentication failed";
          authDialog.open();
        } finally {
          authenticateButton.disabled = false;
          deleteButton.disabled = false;
          loader.style.display = "none";
        }
      };

      const hasCredential = localStorage.getItem("credential") !== null;

      if (hasCredential) {
        authenticateButton.style.display = "block";
        deleteButton.style.display = "block";
      } else {
        registerButton.style.display = "block";
      }

      registerButton.addEventListener("click", register);
      authenticateButton.addEventListener("click", authenticate);
      deleteButton.addEventListener("click", removeCredential);
    },
  },
  {
    url: "/geolocation",
    template: () => import("./templates/geolocation.js"),
    controller() {
      customElements.whenDefined("google-map").then(async () => {
        const map = document.querySelector("google-map");
        const dialog = document.querySelector("#geolocation-dialog");
        const closeButton = document.querySelector("#geolocation-close");
        let mainContent;

        const preventSwipe = (e) => e.preventDefault();

        closeButton.addEventListener("click", () => {
          dialog.close();
          mainContent.style.overflowY = "auto";
          mainContent.removeEventListener("touchmove", preventSwipe);
        });

        try {
          const { latitude, longitude } = await map.getCurrentPosition();
          map.addMarker(latitude, longitude);
        } catch (err) {
          if (err.PERMISSION_DENIED === 1) {
            dialog.open();

            // get reference to mainContent here, otherwise it still refers to the previous view
            mainContent =
              document.querySelector(".view.active .content") ||
              document.querySelector(".view .content");
            mainContent.style.overflowY = "hidden";
            mainContent.addEventListener("touchmove", preventSwipe);
          }
        }
      });
    },
  },
  {
    url: "/device-orientation",
    template: () => import("./templates/device-orientation.js"),
    controller() {
      const sensorButton = document.querySelector("#sensor-button1");

      sensorButton &&
        sensorButton.addEventListener("click", () => {
          let sensorSheet = document.querySelector("#sensor-sheet");
          if (!document.querySelector("#sensor-sheet")) {
            document.body.insertAdjacentHTML("beforeend", sensorSheetTemplate);

            setTimeout(() => {
              sensorSheet = document.querySelector("#sensor-sheet");

              document
                .querySelector("#close-sensor-sheet")
                .addEventListener("click", () => {
                  sensorSheet.close();
                });

              sensorSheet.open();
            }, 1000);
          } else {
            sensorSheet.open();
          }
        });
    },
  },
  {
    url: "/device-motion",
    template: () => import("./templates/device-motion.js"),
    controller() {
      const sensorButton = document.querySelector("#sensor-button2");

      sensorButton &&
        sensorButton.addEventListener("click", () => {
          let sensorSheet = document.querySelector("#sensor-sheet");
          if (!document.querySelector("#sensor-sheet")) {
            document.body.insertAdjacentHTML("beforeend", sensorSheetTemplate);

            setTimeout(() => {
              sensorSheet = document.querySelector("#sensor-sheet");

              document
                .querySelector("#close-sensor-sheet")
                .addEventListener("click", () => {
                  sensorSheet.close();
                });

              sensorSheet.open();
            }, 1000);
          } else {
            sensorSheet.open();
          }
        });
    },
  },
  {
    url: "/web-share",
    template: () => import("./templates/web-share.js"),
    controller() {
      const shareButton = document.querySelector("#share-button");
      const title = document.querySelector("#title").value;
      const text = document.querySelector("#text").value;
      const url = document.querySelector("#url").value;
      const fileField = document.querySelector("#file");
      const fileName = document.querySelector("#file-name");

      shareButton.addEventListener("click", async () => {
        const files = fileField ? fileField.files : [];

        const data = { title, text, url };

        if (files.length) {
          data.files = files;
        }

        try {
          await navigator.share(data);
        } catch (e) {
          console.log("share error", e);
        }
      });

      if (fileField) {
        fileField.addEventListener("change", (e) => {
          const { files } = e.target;
          const { name } = files[0];

          if (name) {
            fileName.innerText = name;
          }
        });
      }
    },
    onExit() {
      const title = document.querySelector("#title");
      const text = document.querySelector("#text");
      const url = document.querySelector("#url");
      const fileField = document.querySelector("#file");
      const fileName = document.querySelector("#file-name");

      title.value = title.getAttribute("value");
      text.value = text.getAttribute("value");
      url.value = url.getAttribute("value");

      if (fileField && fileName) {
        fileField.value = "";
        fileName.innerText = "";
      }
    },
  },
  {
    url: "/share-target",
    template: () => import("./templates/share-target.js"),
    controller({ title = "", text = "", url = "" }) {
      document.querySelector("#shared-content").innerHTML = `
        <h3 id="title">${title}</h3>
        <p id="text">${text}</p>
        <p id="url">${url}</p>
      `;
    },
    onExit() {
      document.querySelector("#shared-content").innerHTML = "";
    },
  },
  {
    url: "/multi-touch",
    template: () => import("./templates/multi-touch.js"),
  },
  {
    url: "/ar-vr",
    template: () => import("./templates/ar-vr.js"),
    controller() {
      document.querySelector(".image-model").addEventListener("load", () => {
        document.querySelector("#ar-loader").style.display = "none";
      });
    },
  },
  {
    url: "/speech-synthesis",
    template: () => import("./templates/speech-synthesis.js"),
  },
  {
    url: "/speech-recognition",
    template: () => import("./templates/speech-recognition.js"),
    onExit() {
      document.querySelector("speech-recognition").reset();
    },
  },
  {
    url: "/page-lifecycle",
    template: () => import("./templates/page-lifecycle.js"),
    controller() {
      const getState = () => {
        return document.visibilityState === "hidden"
          ? "hidden"
          : document.hasFocus()
          ? "active"
          : "passive";
      };

      const logOutput = document.querySelector(".log");

      const log = (msg) =>
        logOutput.insertAdjacentHTML("beforeend", `<p>${msg}</p>`);
      // Stores the initial state using the `getState()` function (defined above).
      let state = getState();

      // Accepts a next state and, if there's been a state change, logs the
      // change to the console. It also updates the `state` value defined above.
      const logStateChange = (nextState, type) => {
        const prevState = state;

        if (nextState !== prevState) {
          const msg = `[${type}] State change: ${prevState} >>> ${nextState}`;
          console.log(msg);
          log(msg);
          // log(`discarded: ${document.wasDiscarded}`)
          state = nextState;
        }
      };

      // These lifecycle events can all use the same listener to observe state
      // changes (they call the `getState()` function to determine the next state).
      ["pageshow", "focus", "blur", "visibilitychange", "resume"].forEach(
        (type) => {
          window.addEventListener(
            type,
            () => logStateChange(getState(), type),
            { capture: true }
          );
        }
      );

      document.addEventListener(
        "visibilitychange",
        () => logStateChange(getState(), "visibilitychange"),
        { capture: true }
      );

      // The next two listeners, on the other hand, can determine the next
      // state from the event itself.
      window.addEventListener(
        "freeze",
        () => {
          // In the freeze event, the next state is always frozen.
          logStateChange("frozen");
        },
        { capture: true }
      );

      window.addEventListener(
        "pagehide",
        (event) => {
          if (event.persisted) {
            // If the event's persisted property is `true` the page is about
            // to enter the page navigation cache, which is also in the frozen state.
            logStateChange("frozen");
          } else {
            // If the event's persisted property is not `true` the page is
            // about to be unloaded.
            logStateChange("terminated");
          }
        },
        { capture: true }
      );
    },
  },
  {
    url: "/notifications",
    template: () => import("./templates/notifications.js"),
    async controller() {
      const notification = document.querySelector("#notification");
      const sendButton = document.querySelector("#send");
      const subscribeButton = document.querySelector("#subscribe");
      const unsubscribeButton = document.querySelector("#unsubscribe");
      const dialog = document.querySelector("#notification-dialog");
      const closeButton = document.querySelector("#notification-close");
      let mainContent;

      const registration = await navigator.serviceWorker.getRegistration();
      const pushSubscription = await registration.pushManager.getSubscription();

      const titleField = document.querySelector("#title");
      const messageField = document.querySelector("#message");
      const delayField = document.querySelector("#delay");
      const interactionField = document.querySelector("#interaction");

      if (pushSubscription) {
        subscribeButton.disabled = true;
        unsubscribeButton.disabled = false;
        sendButton.disabled = false;
      } else {
        subscribeButton.disabled = false;
        unsubscribeButton.disabled = true;
        sendButton.disabled = true;
      }

      const preventSwipe = (e) => e.preventDefault();

      closeButton.addEventListener("click", () => {
        dialog.close();
        mainContent.style.overflowY = "auto";
        document.documentElement.style.overflowY = "auto";
        mainContent.style.maxHeight = "auto";
        document.documentElement.style.maxHeight = "auto";
        mainContent.removeEventListener("touchmove", preventSwipe);
      });

      subscribeButton.addEventListener("click", async () => {
        const response = await (await fetch(`${apiUrl}/public-key`)).json();
        const publicKey = response.publicKey;

        try {
          await subscribeToPushMessages(registration, publicKey);

          subscribeButton.disabled = true;
          unsubscribeButton.disabled = false;
          sendButton.disabled = false;
        } catch (err) {
          if (Notification.permission === "denied") {
            // get reference to mainContent here, otherwise it still refers to the previous view
            mainContent =
              document.querySelector(".view.active .content") ||
              document.querySelector(".view .content");

            mainContent.style.overflowY = "hidden";
            mainContent.style.maxHeight = "100vh";
            document.documentElement.style.overflowY = "hidden";
            document.documentElement.style.maxHeight = "100vh";
            mainContent.addEventListener("touchmove", preventSwipe);
            dialog.open();
          }
        }
      });

      unsubscribeButton.addEventListener("click", async () => {
        const pushSubscription = await getPushSubscription();

        try {
          const success = await unsubscribeFromPushMessages(pushSubscription);

          if (success) {
            console.log("successfully unsubscribed");

            subscribeButton.disabled = false;
            unsubscribeButton.disabled = true;
            sendButton.disabled = true;
          } else {
            console.log("unsubscribing was not successful");
          }
        } catch (err) {
          console.log("error unsubscribing", err);
        }
      });

      const base64UrlToUint8Array = (base64UrlData) => {
        const padding = "=".repeat((4 - (base64UrlData.length % 4)) % 4);
        const base64 = (base64UrlData + padding)
          .replace(/\-/g, "+")
          .replace(/_/g, "/");

        const rawData = atob(base64);
        const buffer = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
          buffer[i] = rawData.charCodeAt(i);
        }

        return buffer;
      };

      const subscribeToPushMessages = (registration, publicKey) =>
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToUint8Array(publicKey),
        });

      const unsubscribeFromPushMessages = (subscription) =>
        subscription.unsubscribe();

      const getPushSubscription = () =>
        registration.pushManager.getSubscription();

      const apiUrl = "https://ca9akfgcre.execute-api.us-east-1.amazonaws.com";
      const sendPushMessage = async ({
        title,
        message,
        delay,
        interaction,
      }) => {
        const pushSubscription = await getPushSubscription();
        console.log("sending");
        fetch(`${apiUrl}/send-message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pushSubscription,
            title,
            message,
            delay: delay * 1000,
            interaction,
          }),
        });
      };

      sendButton.addEventListener("click", () => {
        const title = titleField.value;
        const message = messageField.value;
        const delay = delayField.value !== "" ? delayField.value : 0;
        const interaction = interactionField.checked;

        sendPushMessage({ title, message, delay, interaction });
      });

      const sendNotification = async () => {
        if (Notification.permission === "granted") {
          showNotification(notification.value);
        } else {
          if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();

            if (permission === "granted") {
              showNotification(notification.value);
            }
          }
        }
      };

      const showNotification = (body) => {
        const title = "What PWA Can Do Today";

        const payload = {
          body,
          icon: "/src/img/icons/icon-512x512.png",
          image: "/src/img/icons/icon-512x512.png",
        };

        if ("showNotification" in registration) {
          registration.showNotification(title, payload);
        } else {
          new Notification(title, payload);
        }
      };
    },
  },
  {
    url: "/bluetooth",
    template: () => import("./templates/bluetooth.js"),
    controller() {
      if ("bluetooth" in navigator) {
        const scan = document.querySelector("#scan");
        const batteryIndicator = document.querySelector("#battery-indicator");

        scan.addEventListener("click", async () => {
          const connectToDevice = async ({ bleService, bleCharacteristic }) => {
            try {
              const device = await navigator.bluetooth.requestDevice({
                filters: [
                  {
                    services: [bleService],
                  },
                ],
              });

              device.addEventListener("gattserverdisconnected", () => {
                batteryIndicator.value = 0;
              });

              const server = await device.gatt.connect();
              const service = await server.getPrimaryService(bleService);
              const characteristic = await service.getCharacteristic(
                bleCharacteristic
              );
              await characteristic.startNotifications();

              characteristic.addEventListener(
                "characteristicvaluechanged",
                (e) => {
                  const value = e.target.value.getUint8(0);

                  console.log(`${bleCharacteristic} changed`, value);

                  batteryIndicator.value = value;
                }
              );

              characteristic.readValue();

              return characteristic;
            } catch (err) {
              console.error(err);
            }
          };

          await connectToDevice({
            bleService: "battery_service",
            bleCharacteristic: "battery_level",
          });
        });
      }
    },
  },
  {
    url: "/contacts",
    template: () => import("./templates/contacts.js"),
    async controller() {
      if ("contacts" in navigator && "ContactsManager" in window) {
        const props = await navigator.contacts.getProperties();
        const list = document.querySelector("#contacts");
        const button = document.querySelector("#select-contacts");

        list.innerHTML = "";

        const showContacts = (contacts) => {
          const html = contacts.reduce((html, contact) => {
            const names = contact.name.join(", ");
            const emails = contact.email.join(", ");
            const telephone = contact.tel.join(", ");

            return `${html}
            <p>
              <span>
                <i class="material-icons">person</i>
                <strong>${names}</strong><br>
              </span>
              <span>
                <i class="material-icons">mail_outline</i>
                ${emails}<br>
              </span>
              <span>
                <i class="material-icons">phone</i>
                ${telephone}</p>
              </span>
            `;
          }, ``);

          list.innerHTML = html;
        };

        button.addEventListener("click", async (e) => {
          const contacts = await navigator.contacts.select(props, {
            multiple: true,
          });

          showContacts(contacts);
        });
      }
    },
    onExit() {
      document.querySelector("#contacts").innerHTML = "";
    },
  },
  {
    url: "/network-info",
    template: () => import("./templates/network-info.js"),
  },
  {
    url: "/info",
    template: () => import("./templates/info.js"),
    async controller() {
      await Promise.all([
        customElements.whenDefined("material-textfield"),
        customElements.whenDefined("material-button"),
      ]);

      const name = document.querySelector("#name");
      const email = document.querySelector("#email");
      const message = document.querySelector("#message");
      const challenge = document.querySelector("#challenge");
      const sendButton = document.querySelector("#send-button");
      const result = document.querySelector("#result");

      const handleButton = () =>
        (sendButton.disabled = !(
          name.isValid() &&
          email.isValid() &&
          challenge.value === "7" &&
          message.validity.valid
        ));

      name.addEventListener("change", handleButton);
      email.addEventListener("change", handleButton);
      message.addEventListener("keyup", handleButton);
      challenge.addEventListener("keyup", handleButton);

      sendButton.addEventListener("click", async () => {
        sendButton.disabled = true;

        const body = {
          name: name.value,
          email: email.value,
          message: message.value,
          challenge: challenge.value,
        };

        fetch(contactApi, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
          .then((response) => {
            name.value = "";
            email.value = "";
            message.value = "";
            challenge.value = "";

            result.textContent = "Message sent!";
          })
          .catch((err) => {
            console.log("error", err);

            result.classList.add("error");
            result.textContent = "Something went wrong, please try again";
          })
          .finally(() => {
            setTimeout(() => {
              result.textContent = "";
              result.classList.remove("error");
            }, 5000);
          });
      });

      handleButton();
    },
  },
  {
    url: "/payment",
    template: () => import("./templates/payment.js"),
    controller() {
      const applePayButton = document.querySelector("#apple-pay-button");
      const paymentButton = document.querySelector("#payment-button");

      const applePayMethod = {
        supportedMethods: "https://apple.com/apple-pay",
        data: {
          version: 3,
          merchantIdentifier: "merchant.whatpwacando.today",
          merchantCapabilities: [
            "supports3DS",
            "supportsCredit",
            "supportsDebit",
          ],
          supportedNetworks: [
            "amex",
            "discover",
            "masterCard",
            "visa",
            "maestro",
          ],
          countryCode: "US",
        },
      };

      const googlePayMethod = {
        supportedMethods: "https://google.com/pay",
        data: {
          environment: "TEST",
          apiVersion: 2,
          apiVersionMinor: 0,
          merchantInfo: {
            // A merchant ID is available after approval by Google.
            // 'merchantId':'12345678901234567890',
            merchantName: "What PWA Can Do Today",
          },
          allowedPaymentMethods: [
            {
              type: "CARD",
              parameters: {
                allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                allowedCardNetworks: [
                  "AMEX",
                  "DISCOVER",
                  "INTERAC",
                  "JCB",
                  "MASTERCARD",
                  "VISA",
                ],
              },
              tokenizationSpecification: {
                type: "PAYMENT_GATEWAY",
                // Check with your payment gateway on the parameters to pass.
                // @see {@link https://developers.google.com/pay/api/web/reference/request-objects#gateway}
                parameters: {
                  gateway: "example",
                  gatewayMerchantId: "exampleGatewayMerchantId",
                },
              },
            },
          ],
        },
      };

      const paymentDetails = {
        id: "order-123",
        displayItems: [
          {
            label: "PWA Demo Payment",
            amount: { currency: "USD", value: "0.01" },
          },
        ],
        total: {
          label: "Total",
          amount: { currency: "USD", value: "0.01" },
        },
      };

      if (applePayButton) {
        applePayButton.addEventListener("click", async () => {
          const request = new PaymentRequest([applePayMethod], paymentDetails);
          const response = await request.show();

          console.log(response);
        });
      }

      if (paymentButton) {
        const options = {
          requestPayerEmail: true,
          requestPayerName: true,
        };

        paymentButton.addEventListener("click", async () => {
          const request = new PaymentRequest(
            [googlePayMethod],
            paymentDetails,
            options
          );
          const response = await request.show();

          console.log(response);
        });
      }
    },
  },
  {
    url: "/wake-lock",
    template: () => import("./templates/wake-lock.js"),
    controller() {
      const wakeLockSwitch = document.querySelector("#wake-lock");

      let wakeLock = null;

      const requestWakeLock = async () => {
        try {
          wakeLock = await navigator.wakeLock.request("screen");

          wakeLock.addEventListener("release", () => {
            console.log("Wake Lock was released");
          });
          console.log("Wake Lock is active");
        } catch (err) {
          console.error(`${err.name}, ${err.message}`);
        }
      };

      const releaseWakeLock = () => {
        console.log("releasing wakeLock");

        wakeLock.release();
        wakeLock = null;
      };

      wakeLockSwitch.addEventListener("change", ({ detail }) => {
        const { checked } = detail;

        checked ? requestWakeLock() : releaseWakeLock();
      });
    },
  },
  {
    url: "/vibration",
    template: () => import("./templates/vibration.js"),
    controller() {
      const maker = document.querySelector("#pattern-maker");
      const visualizer = document.querySelector("#pattern-visualizer");
      const recordButton = document.querySelector("#record");
      const playButton = document.querySelector("#play");
      const stopButton = document.querySelector("#stop");
      const ripple = document.querySelector("#ripple");

      visualizer.innerHTML = "";

      let pattern = [];

      const patternLength = 3000;
      let startTime = 0;
      let currentTime = 0;
      let patternTime = 0;
      const frames = [];

      const visualizerWidth = visualizer.offsetWidth;

      const moveRipple = (e) => {
        const touches = [...e.changedTouches];

        if (touches.length) {
          const { pageX, pageY } = touches[0];
          ripple.style.top = `${pageY}px`;
          ripple.style.left = `${pageX}px`;
        }
      };

      const addPatternEntry = (e) => {
        e.preventDefault();

        const { type } = e;
        const touches = [...e.changedTouches];

        frames.map(cancelAnimationFrame);

        type === "touchstart"
          ? maker.addEventListener("touchmove", moveRipple)
          : maker.removeEventListener("touchmove", moveRipple);
        ripple.style.display = type === "touchstart" ? "block" : "none";

        if (touches.length) {
          const { pageX, pageY } = touches[0];
          ripple.style.top = `${pageY}px`;
          ripple.style.left = `${pageX}px`;
        }

        if (startTime !== 0 && Date.now() - startTime >= patternLength) {
          return false;
        }

        if (startTime === 0) {
          startTime = Date.now();
          visualizer.innerHTML = "";
          pattern = [];
        }

        if (patternTime !== 0) {
          pattern.push(currentTime - patternTime);
        }

        patternTime = Date.now();

        const className = type === "touchstart" ? "on" : "off";
        visualizer.insertAdjacentHTML(
          "beforeend",
          `<div class="${className}"></div>`
        );

        const curDiv = visualizer.lastChild;

        const run = () => {
          currentTime = Date.now();

          const w =
            ((currentTime - patternTime) / patternLength) * visualizerWidth;

          curDiv.style.width = `${w}px`;

          if (currentTime - startTime < patternLength) {
            frames.push(requestAnimationFrame(run));
          } else {
            pattern.push(currentTime - patternTime);

            startTime = 0;
            currentTime = 0;
            patternTime = 0;

            recordButton.disabled = false;
            playButton.disabled = false;
            ripple.style.display = "none";

            const totalWidth = [...visualizer.querySelectorAll("div")].reduce(
              (sum, div) => sum + parseFloat(div.style.width),
              0
            );

            const diff = visualizerWidth - totalWidth;
            curDiv.style.width = `${parseFloat(curDiv.style.width) + diff}px`;

            maker.removeEventListener("touchstart", addPatternEntry);
            maker.removeEventListener("touchend", addPatternEntry);
          }
        };

        requestAnimationFrame(run);
      };

      let playId;

      const playVibration = () => {
        playButton.disabled = true;
        stopButton.disabled = false;

        navigator.vibrate(pattern);

        playId = setTimeout(() => {
          playButton.disabled = false;
          stopButton.disabled = true;
        }, patternLength);
      };

      const stopVibration = () => {
        navigator.vibrate(0);

        clearTimeout(playId);

        playButton.disabled = false;
        stopButton.disabled = true;
      };

      playButton.addEventListener("click", playVibration);
      stopButton.addEventListener("click", stopVibration);

      recordButton.addEventListener("click", () => {
        visualizer.innerHTML = "";
        recordButton.disabled = true;
        playButton.disabled = true;

        maker.addEventListener("touchstart", addPatternEntry);
        maker.addEventListener("touchend", addPatternEntry);
      });
    },
  },
  {
    url: "/nfc",
    template: () => import("./templates/nfc.js"),
    controller() {
      const scanButton = document.querySelector("#scan");
      const stopScanButton = document.querySelector("#stop-scan");
      const writeButton = document.querySelector("#write");
      const name = document.querySelector("#name");
      const age = document.querySelector("#age");
      const city = document.querySelector("#city");

      const nfcDialog = document.querySelector("#nfc-dialog");
      const closeButton = document.querySelector("#close-dialog");

      let scanning = false;

      closeButton.addEventListener("click", () => {
        nfcDialog.close();
      });

      stopScanButton.disabled = true;

      const capitalize = (string) =>
        `${string.substr(0, 1).toUpperCase()}${string.substr(1)}`;

      const showTagData = (data) => {
        nfcDialog.body = [...Object.entries(data)].reduce(
          (html, [key, value]) => `${html}<p>${capitalize(key)}: ${value}</p>`,
          ``
        );

        nfcDialog.open();
      };

      const readTag = ({ message }) => {
        const { records } = message;

        return records.map((record) => {
          const { id, recordType, mediaType, encoding, data } = record;

          const decoder = encoding
            ? new TextDecoder(encoding)
            : new TextDecoder();

          switch (recordType) {
            case "url":
            case "text":
              console.log("data", decoder.decode(data));
              break;

            case "mime":
              showTagData(JSON.parse(decoder.decode(data)));

              break;
          }

          return ["url", "text"].includes(recordType)
            ? decoder.decode(data)
            : JSON.parse(decoder.decode(data));
        });
      };

      let abortController;

      const scanTag = () => {
        scanButton.disabled = true;
        stopScanButton.disabled = false;

        return new Promise((resolve, reject) => {
          try {
            const reader = new NDEFReader();
            abortController = new AbortController();

            reader.scan({ signal: abortController.signal });
            scanning = true;

            reader.addEventListener("reading", (e) => resolve(readTag(e)));

            reader.addEventListener("readingerror", (e) => {
              console.log("error reading tag", e);
              reject(e);
            });
          } catch (e) {
            console.log("error scanning tag:", e);

            scanButton.disabled = false;
            stopScanButton.disabled = true;
            scanning = false;

            reject(e);
          }
        });
      };

      const stopScan = () => {
        abortController.abort();

        scanButton.disabled = false;
        stopScanButton.disabled = true;
        scanning = false;
      };

      const writeTag = async () => {
        writeButton.disabled = true;

        if (scanning) {
          stopScan();
        }
        const encoder = new TextEncoder();

        const data = {
          name: name.value,
          age: age.value,
          city: city.value,
        };

        const records = [];

        records.push({
          recordType: "mime",
          mediaType: "application/json",
          data: encoder.encode(JSON.stringify(data)),
        });

        const reader = new NDEFReader();
        abortController = new AbortController();

        reader.scan({ signal: abortController.signal });

        try {
          await reader.write(
            { records },
            {
              overwrite: true,
            }
          );

          setTimeout(() => abortController.abort(), 3000);
        } catch (e) {
          console.log("error writing tag", e);
        } finally {
          writeButton.disabled = false;
        }
      };

      scanButton.addEventListener("click", scanTag);
      stopScanButton.addEventListener("click", stopScan);
      writeButton.addEventListener("click", writeTag);
    },
  },
  {
    url: "/file-system",
    template: () => import("./templates/file-system.js"),
    controller() {
      const fileContent = document.querySelector("#file-content");
      const fileTree = document.querySelector("file-tree");
      const saveButton = document.querySelector("#save-button");
      const saveAsButton = document.querySelector("#save-as-button");
      const createFileButton = document.querySelector("#create-file-button");
      const createDirectoryButton = document.querySelector(
        "#create-directory-button"
      );
      const fileSystemSwitch = document.querySelector(
        '[name="filesystem-switch"]'
      );

      fileTree.addEventListener("directory-opened", () => {
        createDirectoryButton.disabled = false;
        createFileButton.disabled = false;

        const textarea = fileContent.querySelector("textarea");
        if (textarea) {
          textarea.value = "";
        }
      });

      fileTree.addEventListener("directory-selected", () => {
        saveButton.disabled = true;
        saveAsButton.disabled = true;

        const textarea = fileContent.querySelector("textarea");
        if (textarea) {
          textarea.value = "";
        }
      });

      fileTree.addEventListener("file-unselected", () => {
        saveButton.disabled = true;
        saveAsButton.disabled = true;

        const textarea = fileContent.querySelector("textarea");
        if (textarea) {
          textarea.value = "";
        }
      });

      fileSystemSwitch.addEventListener("change", () => {
        const isOPFS = fileSystemSwitch.value === "opfs";
        fileTree.opfs = isOPFS;

        createDirectoryButton.disabled = !isOPFS;
        createFileButton.disabled = !isOPFS;
      });

      saveButton.addEventListener("click", () => {
        fileTree.saveFile(fileContent.querySelector("textarea").value);
      });

      createFileButton.addEventListener("click", () =>
        fileTree.showCreateFileDialog()
      );
      createDirectoryButton.addEventListener("click", () =>
        fileTree.showCreateDirectoryDialog()
      );

      saveAsButton.addEventListener("click", () =>
        fileTree.showSaveFileAsDialog(
          fileContent.querySelector("textarea").value
        )
      );

      fileTree.addEventListener("file-selected", ({ detail }) => {
        saveButton.disabled = true;
        saveAsButton.disabled = true;

        const { type, contents } = detail.file;
        switch (type) {
          case "image/png":
          case "image/jpg":
          case "image/jpeg":
          case "image/gif":
            fileContent.innerHTML = `<img src="${contents}">`;

            break;
          case "image/svg+xml":
            fileContent.innerHTML = contents;

            break;

          default:
            fileContent.innerHTML = `<textarea>${contents}</textarea>`;
            saveButton.disabled = false;
            saveAsButton.disabled = false;
        }
      });
    },
  },
  {
    url: "/barcode",
    template: () => import("./templates/barcode.js"),
    controller() {
      const reader = document.querySelector("barcode-reader");
      const scanButton = document.querySelector("#scan-button");
      const stopScanButton = document.querySelector("#stop-scan-button");
      const codeDialog = document.querySelector("#code-dialog");
      const dialogBody = codeDialog.querySelector('[slot="body"]');
      const cancelButton = document.querySelector("#cancel-dialog");
      const closeButton = document.querySelector("#close-dialog");

      scanButton.addEventListener("click", () => {
        reader.scan();
      });

      stopScanButton.addEventListener("click", () => {
        reader.stopScan();
      });

      closeButton.addEventListener("click", () => {
        codeDialog.close();
      });

      reader.addEventListener("scan-start", () => {
        scanButton.disabled = true;
        stopScanButton.disabled = false;
      });

      reader.addEventListener("scan-stop", () => {
        scanButton.disabled = false;
        stopScanButton.disabled = true;
      });

      reader.addEventListener("result", (e) => {
        const { rawValue } = e.detail.code;

        let url;
        let textContent;

        try {
          url = new URL(rawValue);
          textContent = `Navigate to ${rawValue}?`;
        } catch (e) {
          url = null;
          textContent = `Detected code: ${rawValue}`;
        }

        dialogBody.textContent = textContent;
        codeDialog.open();

        closeButton.addEventListener("click", (e) => {
          if (url) {
            window.open(url, "_blank");
          }

          codeDialog.close();

          reader.scan();
        });

        cancelButton.addEventListener("click", () => {
          codeDialog.close();

          reader.scan();
        });
      });
    },
  },
  {
    url: "/face-detection",
    template: () => import("./templates/face-detection.js"),
    controller() {
      const detector = document.querySelector("face-detector");
      const scanButton = document.querySelector("#scan-button");
      const stopScanButton = document.querySelector("#stop-scan-button");
      const showFacialFeatures = document.querySelector("#facial-features");

      scanButton.addEventListener("click", () => {
        detector.scan();
      });

      stopScanButton.addEventListener("click", () => {
        detector.stopScan();
      });

      detector.addEventListener("scan-start", () => {
        scanButton.disabled = true;
        stopScanButton.disabled = false;
      });

      detector.addEventListener("scan-stop", () => {
        scanButton.disabled = false;
        stopScanButton.disabled = true;
      });

      showFacialFeatures.addEventListener("change", ({ detail }) => {
        console.log(detail);
        detector.facialFeatures = detail.checked;
      });
    },
  },
  {
    url: "/background-sync",
    template: () => import("./templates/background-sync.js"),
    async controller() {
      let mainContent;
      const dialog = document.querySelector("#notification-dialog");
      const closeButton = document.querySelector("#notification-close");
      const syncButton = document.querySelector("#sync-button");
      const registration = await navigator.serviceWorker.getRegistration();
      const preventSwipe = (e) => e.preventDefault();
      if (registration && "sync" in registration) {
        let notificationNum = 0;

        syncButton.addEventListener("click", async () => {
          if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission();

            if (permission !== "granted") {
              // get reference to mainContent here, otherwise it still refers to the previous view
              mainContent =
                document.querySelector(".view.active .content") ||
                document.querySelector(".view .content");

              mainContent.style.overflowY = "hidden";
              mainContent.style.maxHeight = "100vh";
              document.documentElement.style.overflowY = "hidden";
              document.documentElement.style.maxHeight = "100vh";
              mainContent.addEventListener("touchmove", preventSwipe);
              dialog.open();
            }
          }

          const notification = {
            timestamp: Date.now(),
            title: "Background Sync Demo",
            message: `This is notification #${++notificationNum}`,
          };

          const idbStore = await getStore();
          idbStore.add(notification);
          await registration.sync.register(`sync-demo`);
          console.log(`sync-demo`);
        });

        closeButton.addEventListener("click", () => {
          dialog.close();
          mainContent.style.overflowY = "auto";
          document.documentElement.style.overflowY = "auto";
          mainContent.style.maxHeight = "auto";
          document.documentElement.style.maxHeight = "auto";
          mainContent.removeEventListener("touchmove", preventSwipe);
        });
      }
    },
  },
  {
    url: "/background-fetch",
    template: () => import("./templates/background-fetch.js"),
    async controller() {
      const downloadButtons = document.querySelectorAll(
        ".tracklist material-button"
      );
      const registration = await navigator.serviceWorker.ready;

      const ids = await registration.backgroundFetch.getIds();

      for (const id of ids) {
        const bgFetch = await registration.backgroundFetch.get(id);

        if (bgFetch) {
          const progressIndicator = document.querySelector(`#${id}`);
          const percent = Math.round(
            (bgFetch.downloaded / bgFetch.downloadTotal) * 100
          );
          progressIndicator.value = percent;

          progressIndicator.closest("li").classList.add("active");

          bgFetch.addEventListener("progress", () => {
            if (!bgFetch.downloadTotal) return;

            const percent = Math.round(
              (bgFetch.downloaded / bgFetch.downloadTotal) * 100
            );
            console.log("progress", percent, bgFetch);
            progressIndicator.value = percent;
          });
        }
      }

      const startBackgroundFetch = async (trackId) => {
        const bgFetch = await registration.backgroundFetch.fetch(
          `track-${trackId}`,
          [`https://d1rghwwvvp91e2.cloudfront.net/testfile.zip`],
          {
            title: `Thievery Corporation - Track ${trackId}`,
            icons: [
              {
                sizes: "64x64",
                src: "./src/img/media/mirror-conspiracy64x64.jpeg",
                type: "application/zip",
              },
            ],
            downloadTotal: 300 * 1024 * 1024,
          }
        );

        console.log("fetch", trackId, bgFetch);

        const progressIndicator = document.querySelector(`#track-${trackId}`);
        progressIndicator.closest("li").classList.add("active");

        bgFetch.addEventListener("progress", () => {
          if (!bgFetch.downloadTotal) return;

          const percent = Math.round(
            (bgFetch.downloaded / bgFetch.downloadTotal) * 100
          );
          console.log("progress", percent, bgFetch);
          progressIndicator.value = percent;
        });
      };

      downloadButtons.forEach((button) => {
        button.addEventListener("click", async () => {
          const trackId = button.dataset.track;
          startBackgroundFetch(trackId);
        });
      });

      const clearButton = document.querySelector("#clear");

      clearButton.addEventListener("click", async () => {
        const ids = await registration.backgroundFetch.getIds();

        for (const id of ids) {
          const bgFetch = await registration.backgroundFetch.get(id);

          if (bgFetch) {
            bgFetch.abort();
          }

          const progressIndicator = document.querySelector(`#${id}`);
          progressIndicator.value = 0;
          progressIndicator.closest("li").classList.remove("active");
        }
      });
    },
  },
  {
    url: "/storage",
    template: () => import("./templates/storage.js"),
    async controller() {
      const requestPersistentStorageButton = document.querySelector(
        "#request-persistent-storage-button"
      );
      const hasPersistentStorageDiv = document.querySelector(
        "#has-persistent-storage"
      );
      const noPersistentStorageDiv = document.querySelector(
        "#no-persistent-storage"
      );

      requestPersistentStorageButton.addEventListener("click", async () => {
        const persist = await navigator.storage.persist();

        console.log(persist);
        requestPersistentStorageButton.hidden = persist;
        hasPersistentStorageDiv.hidden = !persist;
        noPersistentStorageDiv.hidden = persist;
      });
    },
  },
  {
    url: "/audiosession",
    template: () => import("./templates/audiosession.js"),
    async controller() {
      const audioSessionType = document.querySelector(
        '[name="audiosession-type"]'
      );

      audioSessionType.addEventListener("change", ({ detail }) => {
        console.log(detail);

        const { value } = detail;
        navigator.audioSession.type = value;
      });

      navigator.audioSession.addEventListener("statechange", (e) => {
        console.log(e, navigator.audioSession.state);
      });
    },
  },
  {
    url: "/capture-handle",
    template: () => import("./templates/capture-handle.js"),
    async controller() {
      const openPageButton = document.querySelector("#open-page-button");
      const shareScreenButton = document.querySelector("#share-screen-button");
      const stopShareScreenButton = document.querySelector(
        "#stop-share-screen-button"
      );
      const previousButton = document.querySelector("#previous-button");
      const nextButton = document.querySelector("#next-button");
      const preview = document.querySelector("#preview");

      let capturedPage;
      openPageButton.addEventListener("click", () => {
        capturedPage = window.open("/image-gallery", "_blank");

        capturedPage.addEventListener("load", () => {
          shareScreenButton.disabled = false;
          openPageButton.disabled = true;
        });
      });

      let stream;

      shareScreenButton.addEventListener("click", async () => {
        let controller;

        if (
          "CaptureController" in window &&
          "setFocusBehavior" in CaptureController.prototype
        ) {
          controller = new CaptureController();
          controller.setFocusBehavior("no-focus-change");
        }

        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "browser", // sharing entire screen is preselected
          },
          audio: true,
          surfaceSwitching: "exclude", // option to switch tabs while sharing
          selfBrowserSurface: "exclude", // exclude tab of screen recorder
          preferCurrentTab: false, // "true" will only offer the current tab for capturing
          systemAudio: "include", // capture audio, default is 'include'
          monitorTypeSurfaces: "exclude", // offer option to share entire screen, default is 'include'
          ...(controller && { controller }),
        });

        preview.srcObject = stream;
        shareScreenButton.hidden = true;
        stopShareScreenButton.hidden = false;

        const [videoTrack] = stream.getVideoTracks();
        let captureHandle = videoTrack.getCaptureHandle();
        if (captureHandle) {
          previousButton.disabled = false;
          nextButton.disabled = false;
        }

        videoTrack.addEventListener("capturehandlechange", (e) => {
          console.log("capturehandlechange");
          captureHandle = e.target.getCaptureHandle();
        });

        videoTrack.addEventListener("ended", onScreenShareStop);

        const broadcastChannel = new BroadcastChannel("capture-handle");

        previousButton.addEventListener("click", () => {
          broadcastChannel.postMessage({
            handle: captureHandle.handle,
            command: "previous",
          });
        });

        nextButton.addEventListener("click", () => {
          broadcastChannel.postMessage({
            handle: captureHandle.handle,
            command: "next",
          });
        });
      });

      const onScreenShareStop = () => {
        preview.srcObject = null;
        capturedPage.close();

        openPageButton.disabled = false;
        shareScreenButton.disabled = true;
        shareScreenButton.hidden = false;
        stopShareScreenButton.hidden = true;
        previousButton.disabled = true;
        nextButton.disabled = true;
      };

      stopShareScreenButton.addEventListener("click", () => {
        stream.getTracks().forEach((track) => track.stop());

        onScreenShareStop();
      });
    },
  },
  {
    url: "/image-gallery",
    template: () => import("./templates/image-gallery.js"),
    async controller() {
      const config = {
        handle: crypto.randomUUID(),
        exposeOrigin: true,
        permittedOrigins: ["*"],
      };
      navigator.mediaDevices.setCaptureHandleConfig(config);

      const gallery = document.querySelector("image-gallery");
      const broadcastChannel = new BroadcastChannel("capture-handle");

      broadcastChannel.addEventListener("message", ({ data }) => {
        const { handle, command } = data;

        if (handle === config.handle) {
          switch (command) {
            case "previous":
              gallery.previous();
              break;
            case "next":
              gallery.next();
              break;
          }
        }
      });
    },
  },
];

const onAfterRender = () => {
  if ("onLine" in navigator) {
    if (navigator.onLine) {
      handleOnline();
    } else {
      handleOffline();
    }
  }
};

router({ outlet, nav, routes, onAfterRender });
