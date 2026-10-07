// Words of Wisdom home screen widget for the Scriptable app (iOS).
// Paste this whole file into a new Scriptable script, then add a Scriptable
// widget to your Home Screen and pick this script.
//
// It downloads the site's own app.js and phrases.csv, so the widget always
// shows exactly the same phrase as https://cividati.github.io/words-of-wisdom/

const SITE = "https://cividati.github.io/words-of-wisdom/";

async function loadText(file) {
  const req = new Request(SITE + file + "?t=" + Date.now());
  return req.loadString();
}

async function todaysPhrase() {
  const [code, csv] = await Promise.all([loadText("app.js"), loadText("phrases.csv")]);
  const mod = { exports: {} };
  new Function("module", code)(mod);
  const { parsePhrases, phraseForDate } = mod.exports;
  return phraseForDate(parsePhrases(csv), new Date());
}

function nextMidnight() {
  const d = new Date();
  d.setHours(24, 0, 30, 0);
  return d;
}

async function buildWidget() {
  const dark = Device.isUsingDarkAppearance();
  const bg = dark ? new Color("#1c1a18") : new Color("#f7f3ec");
  const text = dark ? new Color("#eee6dc") : new Color("#2b2622");
  const muted = dark ? new Color("#a39788") : new Color("#7a6f64");
  const accent = dark ? new Color("#e09a5a") : new Color("#b5651d");
  const family = config.widgetFamily || "medium";

  const w = new ListWidget();
  w.backgroundColor = bg;
  w.setPadding(14, 16, 14, 16);
  w.url = SITE;
  w.refreshAfterDate = nextMidnight();

  if (family !== "small") {
    const label = w.addText("WISDOM OF THE DAY");
    label.font = Font.semiboldSystemFont(10);
    label.textColor = accent;
    w.addSpacer(6);
  }

  try {
    const pick = await todaysPhrase();
    const phrase = w.addText(pick ? pick.phrase : "No phrases yet.");
    phrase.font = new Font("Georgia", family === "small" ? 14 : family === "large" ? 24 : 17);
    phrase.textColor = text;
    phrase.minimumScaleFactor = 0.5;
    if (pick && pick.author) {
      w.addSpacer(6);
      const author = w.addText("— " + pick.author);
      author.font = new Font("Georgia-Italic", 12);
      author.textColor = muted;
    }
  } catch (err) {
    const msg = w.addText("Couldn't load today's phrase.");
    msg.font = Font.systemFont(13);
    msg.textColor = muted;
    w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  }
  return w;
}

const widget = await buildWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
