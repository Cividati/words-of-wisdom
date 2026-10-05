// Words of Wisdom: shows one phrase per day, read from phrases.csv.

// Parses CSV text into an array of rows (arrays of strings).
// Supports quoted fields containing commas, newlines and escaped quotes ("").
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Turns CSV text with a "phrase,author" header into [{ phrase, author }].
// Blank lines are skipped and a missing author becomes "".
function parsePhrases(text) {
  const rows = parseCsv(text.replace(/^﻿/, ""));
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const phraseCol = header.indexOf("phrase");
  const authorCol = header.indexOf("author");
  if (phraseCol === -1) throw new Error('phrases.csv needs a "phrase" column');

  return rows
    .slice(1)
    .map((r) => ({
      phrase: (r[phraseCol] || "").trim(),
      author: authorCol === -1 ? "" : (r[authorCol] || "").trim(),
    }))
    .filter((p) => p.phrase !== "");
}

// Whole days since 1970-01-01 in the viewer's local calendar,
// so the phrase changes at local midnight.
function dayNumber(date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

// Everyone sees the same phrase on the same day; it cycles through the list in order.
function phraseForDate(phrases, date) {
  if (phrases.length === 0) return null;
  return phrases[dayNumber(date) % phrases.length];
}

async function showPhraseOfTheDay() {
  const phraseEl = document.getElementById("phrase");
  const authorEl = document.getElementById("author");
  const dateEl = document.getElementById("date");
  const today = new Date();

  dateEl.textContent = today.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const res = await fetch("phrases.csv", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const pick = phraseForDate(parsePhrases(await res.text()), today);
    if (!pick) throw new Error("phrases.csv has no phrases");
    phraseEl.textContent = pick.phrase;
    authorEl.textContent = pick.author ? `— ${pick.author}` : "";
  } catch (err) {
    phraseEl.textContent = "Couldn't load today's phrase.";
    authorEl.textContent = String(err.message || err);
    console.error(err);
  }
}

if (typeof module !== "undefined") {
  module.exports = { parseCsv, parsePhrases, dayNumber, phraseForDate };
} else {
  showPhraseOfTheDay();
}
