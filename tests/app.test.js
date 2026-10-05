const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { parseCsv, parsePhrases, dayNumber, phraseForDate } = require("../app.js");

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

test("same day gives same phrase, next day gives the next one", () => {
  const phrases = ["a", "b", "c"].map((p) => ({ phrase: p, author: "" }));
  const morning = new Date(2026, 9, 5, 0, 1);
  const night = new Date(2026, 9, 5, 23, 59);
  const tomorrow = new Date(2026, 9, 6, 8, 0);
  assert.equal(phraseForDate(phrases, morning), phraseForDate(phrases, night));
  assert.equal(dayNumber(tomorrow) - dayNumber(morning), 1);
  const i = phrases.indexOf(phraseForDate(phrases, morning));
  assert.equal(phraseForDate(phrases, tomorrow), phrases[(i + 1) % 3]);
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
