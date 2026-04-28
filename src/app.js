let device;
let characteristic;

const SERVICE_UUID = "12345678-1234-1234-1234-123456789abc";
const CHARACTERISTIC_UUID = "abcd1234-5678-1234-5678-abcdef123456";

const statusLbl = document.getElementById("status");
const connectBtn = document.getElementById("bleConnectBtn");

const lockBtn = document.getElementById("lockBtn");
const unlockBtn = document.getElementById("unlockBtn");

const lockLbl = document.getElementById("lockLbl");
const soundBtn = document.getElementById("soundBtn");

const textbox = document.getElementById("txtBox");

if (!navigator.bluetooth) {
    alert("Bluetooth is not supported on this device/browser. Please use Chrome on Android or a desktop browser.");
}

/* debounce flag */

let buttonCooldown = false;

/* helper function */

function startCooldown() {

    lockLbl.textContent = "Locking Mode: Processing...";
    buttonCooldown = true;

    lockBtn.disabled = true;
    unlockBtn.disabled = true;
    soundBtn.disabled = true;

    setTimeout(() => {

        buttonCooldown = false;

        lockBtn.disabled = false;
        unlockBtn.disabled = false;
        soundBtn.disabled = false;

    }, 500);
}

/* START DISABLED ON PAGE LOAD */

lockBtn.disabled = true;
unlockBtn.disabled = true;
soundBtn.disabled = true;

/* GPS handler (MOVED OUTSIDE so it is reusable) */
function onGpsCharacteristicChanged(event) {
    let value = new TextDecoder().decode(event.target.value);

    console.log("GPS received:", value);

    let coords = value.split(",");

    let lat = parseFloat(coords[0]);
    let lng = parseFloat(coords[1]);

    updateLocation(lat, lng);
}

/* Disconnect handler (MOVED OUTSIDE) */
function onDeviceDisconnected() {
    statusLbl.textContent = "Status: Disconnected";
    statusLbl.className = "status disconnected";

    lockBtn.disabled = true;
    unlockBtn.disabled = true;
    soundBtn.disabled = true;

    console.log("BLE lost connection.");
}

/* CONNECT BUTTON */

connectBtn.addEventListener("click", async () => {

    try {

        statusLbl.textContent = "Status: Connecting...";
        statusLbl.className = "status connecting";

        device = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [SERVICE_UUID]
        });

        const server = await device.gatt.connect();

        const service = await server.getPrimaryService(SERVICE_UUID);

        characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        await characteristic.startNotifications();

        /* 🔥 IMPORTANT FIX: prevent duplicate listeners */
        if (characteristic) {
            characteristic.removeEventListener(
                "characteristicvaluechanged",
                onGpsCharacteristicChanged
            );
        }

        characteristic.addEventListener(
            "characteristicvaluechanged",
            onGpsCharacteristicChanged
        );

        statusLbl.textContent = "Status: Connected";
        statusLbl.className = "status connected";

        lockBtn.disabled = false;
        unlockBtn.disabled = false;
        soundBtn.disabled = false;

        /* 🔥 IMPORTANT FIX: avoid stacking disconnect listeners */
        device.removeEventListener(
            "gattserverdisconnected",
            onDeviceDisconnected
        );

        device.addEventListener(
            "gattserverdisconnected",
            onDeviceDisconnected
        );

    } catch (error) {

        console.log(error);

        statusLbl.textContent = "Status: Disconnected";
        statusLbl.className = "status disconnected";

    }

});


/* LOCK BUTTON */

lockBtn.addEventListener("click", async () => {

    if (!characteristic || buttonCooldown) return;

    if (textbox.value != "67" && textbox.value != "1234567890") return;

    await characteristic.writeValue(
        new TextEncoder().encode("0")
    );

    startCooldown();

    lockLbl.textContent = "Mode: LOCKED";

});


/* UNLOCK BUTTON */

unlockBtn.addEventListener("click", async () => {

    if (!characteristic || buttonCooldown) return;

    if (textbox.value != "67" && textbox.value != "1234567890") return;

    await characteristic.writeValue(
        new TextEncoder().encode("1")
    );

    startCooldown();

    lockLbl.textContent = "Mode: UNLOCKED";

});

/* SOUND BUTTON */

soundBtn.addEventListener("click", async () => {

    if (!characteristic || buttonCooldown) return;

    if (textbox.value != "67" && textbox.value != "1234567890") return;

    await characteristic.writeValue(
        new TextEncoder().encode("3")
    );

    startCooldown();
    
});

