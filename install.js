// "Add to Home Screen" helper: a friendly button for phone visitors who
// haven't added the site to their Home Screen yet.

// Which install help to show: "ios", "android", or null (desktop, or
// already opened from the Home Screen).
function installPlatform(userAgent, maxTouchPoints, standalone) {
  if (standalone) return null;
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  // iPads ask for the desktop site and report as a Mac with a touch screen.
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return null;
}

const SHARE_ICON =
  '<svg class="share-icon" viewBox="0 0 24 24" aria-label="Share"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6v11h12V10h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';

const STEPS = {
  ios: [
    `Tap the Share button ${SHARE_ICON} at the bottom of Safari.`,
    "Scroll down and tap <b>Add to Home Screen</b>.",
    "Tap <b>Add</b>. The phrase is now one tap away, every day.",
  ],
  android: [
    "Tap the <b>⋮</b> menu at the top right of Chrome.",
    "Tap <b>Add to Home screen</b> or <b>Install app</b>.",
    "Tap <b>Install</b> or <b>Add</b>. The phrase is now one tap away, every day.",
  ],
};

function setUpInstallHelp() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const platform = installPlatform(navigator.userAgent, navigator.maxTouchPoints || 0, standalone);
  if (!platform) return;
  try {
    if (localStorage.getItem("installHelpDismissed")) return;
  } catch (e) {}

  const bar = document.getElementById("install");
  const button = document.getElementById("install-button");
  const help = document.getElementById("install-help");
  const list = document.getElementById("install-steps");
  list.innerHTML = STEPS[platform].map((s) => `<li>${s}</li>`).join("");

  // Chrome on Android can install with one tap when it offers the prompt.
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
  });
  window.addEventListener("appinstalled", () => (bar.hidden = true));

  button.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      return;
    }
    help.hidden = !help.hidden;
  });

  document.getElementById("install-dismiss").addEventListener("click", () => {
    bar.hidden = true;
    try {
      localStorage.setItem("installHelpDismissed", "1");
    } catch (e) {}
  });

  bar.hidden = false;
}

if (typeof module !== "undefined") {
  module.exports = { installPlatform, STEPS };
} else {
  setUpInstallHelp();
}
