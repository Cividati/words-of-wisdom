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

// Small seeded random number generator (mulberry32), so every visitor
// computes the same shuffle.
function seededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The order of phrase indexes for one cycle: a shuffle of 0..count-1
// seeded by the cycle number and the list size.
function shuffledOrder(count, cycle) {
  const order = Array.from({ length: count }, (_, i) => i);
  const random = seededRandom(Math.imul(cycle, 2654435761) ^ count);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Order for a cycle, adjusted so it never starts with the phrase that
// ended the previous cycle (no same phrase two days in a row).
// With two phrases, simply alternating is the only order that never repeats.
function cycleOrder(count, cycle) {
  if (count === 2) return [0, 1];
  const order = shuffledOrder(count, cycle);
  if (count > 2) {
    const previous = shuffledOrder(count, cycle - 1);
    if (order[0] === previous[count - 1]) [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
}

// Everyone sees the same phrase on the same day. Days are grouped into
// cycles as long as the list; each cycle shows every phrase exactly once,
// in a shuffled order, before any phrase repeats.
function phraseForDate(phrases, date) {
  if (phrases.length === 0) return null;
  const day = dayNumber(date);
  const cycle = Math.floor(day / phrases.length);
  return phrases[cycleOrder(phrases.length, cycle)[day % phrases.length]];
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
  module.exports = { parseCsv, parsePhrases, dayNumber, cycleOrder, phraseForDate };
} else {
  showPhraseOfTheDay();
}
