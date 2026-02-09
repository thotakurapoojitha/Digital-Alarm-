const timeEl = document.getElementById("time");
const dateInput = document.getElementById("alarmDate");
const timeInput = document.getElementById("alarmTime");
const setBtn = document.getElementById("setAlarm");
const alarmsEl = document.getElementById("alarms");
const audio = document.getElementById("alarmAudio");

let alarms = JSON.parse(localStorage.getItem("alarms")) || [];
let alarmTimeouts = [];
const MAX_ALARMS = 5;

// Update live time
function updateTime() {
    const now = new Date();
    let hrs = now.getHours();
    const mins = now.getMinutes().toString().padStart(2, "0");
    const secs = now.getSeconds().toString().padStart(2, "0");
    const ampm = hrs >= 12 ? "PM" : "AM";
    hrs = hrs % 12 || 12;
    timeEl.textContent = `${hrs.toString().padStart(2, "0")}:${mins}:${secs} ${ampm}`;
}

// Set min date to today
function setMinDate() {
    const today = new Date().toISOString().split("T")[0];
    dateInput.min = today;
}
setMinDate();

// Render alarms list
function renderAlarms() {
    if (alarms.length === 0) {
        alarmsEl.innerHTML = "<small class='text-white-50'>No alarms set</small>";
        return;
    }
    alarmsEl.innerHTML = alarms.map((alarm, idx) => {
        const alarmDate = new Date(alarm);
        return `
            <div class="alarm row align-items-center p-2" data-idx="${idx}">
                <div class="col">
                    <div>${alarmDate.toLocaleString()}</div>
                </div>
                <div class="col-auto">
                    <button class="btn btn-outline-danger btn-sm me-1 delete-alarm">Delete</button>
                </div>
            </div>
        `;
    }).join("");
    addDeleteListeners();
}

// Add delete listeners
function addDeleteListeners() {
    document.querySelectorAll(".delete-alarm").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idx = parseInt(e.target.closest(".alarm").dataset.idx);
            alarms.splice(idx, 1);
            localStorage.setItem("alarms", JSON.stringify(alarms));
            clearAlarm(idx);
            renderAlarms();
        });
    });
}

// Clear specific alarm timeout
function clearAlarm(idx) {
    if (alarmTimeouts[idx]) {
        clearTimeout(alarmTimeouts[idx]);
        alarmTimeouts[idx] = null;
    }
}

// Set alarm
setBtn.addEventListener("click", () => {
    const alarmDateTime = new Date(dateInput.value + "T" + timeInput.value);
    const now = new Date();
    if (alarmDateTime <= now) {
        alert("Please select a future date and time.");
        return;
    }
    if (alarms.length >= MAX_ALARMS) {
        alert(`Maximum ${MAX_ALARMS} alarms allowed.`);
        return;
    }
    alarms.push(alarmDateTime.toISOString());
    localStorage.setItem("alarms", JSON.stringify(alarms));
    const timeUntil = alarmDateTime - now;
    const idx = alarms.length - 1;
    alarmTimeouts[idx] = setTimeout(() => triggerAlarm(idx), timeUntil);
    renderAlarms();
    dateInput.value = "";
    timeInput.value = "";
});

// Trigger alarm with audio and UI feedback
function triggerAlarm(idx) {
    const alarmEl = document.querySelector(`[data-idx="${idx}"]`);
    if (alarmEl) {
        alarmEl.classList.add("alarm-ringing");
    }
    audio.play().catch(() => console.log("Audio play failed; user interaction needed."));
    // Show snooze/stop modal or buttons (simplified with alert + buttons)
    const stopBtn = document.createElement("button");
    stopBtn.className = "btn btn-danger me-2";
    stopBtn.textContent = "Stop";
    stopBtn.onclick = () => stopAlarm(idx);
    const snoozeBtn = document.createElement("button");
    snoozeBtn.className = "btn btn-warning";
    snoozeBtn.textContent = "Snooze 10min";
    snoozeBtn.onclick = () => snoozeAlarm(idx);
    alarmsEl.appendChild(stopBtn);
    alarmsEl.appendChild(snoozeBtn);
}

// Stop alarm
function stopAlarm(idx) {
    audio.pause();
    audio.currentTime = 0;
    const alarmEl = document.querySelector(`[data-idx="${idx}"]`);
    if (alarmEl) alarmEl.classList.remove("alarm-ringing");
    alarms.splice(idx, 1);
    localStorage.setItem("alarms", JSON.stringify(alarms));
    clearAlarm(idx);
    renderAlarms();
}

// Snooze (reschedule 10 min later)
function snoozeAlarm(idx) {
    audio.pause();
    audio.currentTime = 0;
    const alarmDate = new Date(alarms[idx]);
    alarmDate.setMinutes(alarmDate.getMinutes() + 10);
    alarms[idx] = alarmDate.toISOString();
    localStorage.setItem("alarms", JSON.stringify(alarms));
    clearAlarm(idx);
    const timeUntil = alarmDate - new Date();
    alarmTimeouts[idx] = setTimeout(() => triggerAlarm(idx), timeUntil);
    renderAlarms();
}

// Init
renderAlarms();
setInterval(updateTime, 1000);
updateTime();

// Re-arm persisted alarms
alarms.forEach((alarmStr, idx) => {
    const alarmDate = new Date(alarmStr);
    const now = new Date();
    if (alarmDate > now) {
        const timeUntil = alarmDate - now;
        alarmTimeouts[idx] = setTimeout(() => triggerAlarm(idx), timeUntil);
    }
});
