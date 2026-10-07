const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseCsv, parsePhrases, dayNumber, cycleOrder, phraseForDate } = require("../app.js");

test("parseCsv handles quotes, commas, escaped quotes and CRLF", () => {
  const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\r\n');
  assert.deepEqual(rows, [["a", "b"], ["x, y", 'say "hi"']]);
});

test("parsePhrases reads phrase and author columns and skips blanks", () => {
  const phrases = parsePhrases('﻿phrase,author\n"One, two",Ann\n\nThree,\n');
  assert.deepEqual(phrases, [
    { phrase: "One, two", author: "Ann" },
    { phrase: "Three", author: "" },
  ]);
});

test("parsePhrases works without an author column", () => {
  assert.deepEqual(parsePhrases("phrase\nHello\n"), [{ phrase: "Hello", author: "" }]);
});

test("parsePhrases rejects a file with no phrase column", () => {
  assert.throws(() => parsePhrases("quote\nHello\n"), /phrase/);
});

test("same day gives same phrase at any hour", () => {
  const phrases = ["a", "b", "c"].map((p) => ({ phrase: p, author: "" }));
  const morning = new Date(2026, 9, 5, 0, 1);
  const night = new Date(2026, 9, 5, 23, 59);
  const tomorrow = new Date(2026, 9, 6, 8, 0);
  assert.equal(phraseForDate(phrases, morning), phraseForDate(phrases, night));
  assert.equal(dayNumber(tomorrow) - dayNumber(morning), 1);
});

function makePhrases(n) {
  return Array.from({ length: n }, (_, i) => ({ phrase: `p${i}`, author: "" }));
}

function daysFrom(start, count) {
  return Array.from({ length: count }, (_, i) => new Date(2026, 0, 1 + start + i, 12));
}

test("every phrase is shown once before any phrase repeats", () => {
  for (const n of [1, 2, 3, 4, 7, 25]) {
    const phrases = makePhrases(n);
    const days = daysFrom(0, n * 6);
    const firstCycleStart = days.findIndex((d) => dayNumber(d) % n === 0);
    for (let c = 0; c < 4; c++) {
      const window = days.slice(firstCycleStart + c * n, firstCycleStart + (c + 1) * n);
      const shown = new Set(window.map((d) => phraseForDate(phrases, d)));
      assert.equal(shown.size, n, `cycle ${c} with ${n} phrases`);
    }
  }
});

test("the same phrase is never shown two days in a row", () => {
  for (const n of [2, 3, 4, 5, 10]) {
    const phrases = makePhrases(n);
    const days = daysFrom(0, 400);
    for (let i = 1; i < days.length; i++) {
      assert.notEqual(phraseForDate(phrases, days[i]), phraseForDate(phrases, days[i - 1]));
    }
  }
});

test("cycles use different shuffled orders", () => {
  const orders = new Set();
  for (let c = 0; c < 20; c++) orders.add(cycleOrder(6, c).join());
  assert.ok(orders.size > 1);
});

test("phraseForDate returns null for an empty list", () => {
  assert.equal(phraseForDate([], new Date()), null);
});

test("bundled phrases.csv parses and every row has an author", () => {
  const text = fs.readFileSync(path.join(__dirname, "..", "phrases.csv"), "utf8");
  const phrases = parsePhrases(text);
  assert.ok(phrases.length >= 1);
  for (const p of phrases) assert.ok(p.author, `missing author for: ${p.phrase}`);
});

test("app.js can be loaded the way the Scriptable widget loads it", () => {
  const code = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  const mod = { exports: {} };
  new Function("module", code)(mod);
  const csv = fs.readFileSync(path.join(__dirname, "..", "phrases.csv"), "utf8");
  const day = new Date(2026, 9, 7);
  assert.deepEqual(
    mod.exports.phraseForDate(mod.exports.parsePhrases(csv), day),
    phraseForDate(parsePhrases(csv), day),
  );
});

test("Scriptable widget script is valid JavaScript", () => {
  const code = fs.readFileSync(path.join(__dirname, "..", "widget", "scriptable.js"), "utf8");
  const AsyncFunction = (async () => {}).constructor;
  assert.doesNotThrow(() => new AsyncFunction(code));
});

test("manifest lists icons that exist", () => {
  const root = path.join(__dirname, "..");
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.webmanifest"), "utf8"));
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(root, icon.src)), icon.src);
  assert.ok(fs.existsSync(path.join(root, "icons", "apple-touch-icon.png")));
});

test("install help picks the right phone and skips desktop and installed apps", () => {
  const { installPlatform, STEPS } = require("../install.js");
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1";
  const ipad = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15";
  const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129.0 Mobile Safari/537.36";
  const desktop = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129.0 Safari/537.36";
  assert.equal(installPlatform(iphone, 5, false), "ios");
  assert.equal(installPlatform(ipad, 5, false), "ios");
  assert.equal(installPlatform(ipad, 0, false), null);
  assert.equal(installPlatform(android, 5, false), "android");
  assert.equal(installPlatform(desktop, 0, false), null);
  assert.equal(installPlatform(iphone, 5, true), null);
  assert.ok(STEPS.ios.length && STEPS.android.length);
});
