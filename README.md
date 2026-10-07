# words-of-wisdom

A one-page site that shows a different phrase of wisdom each day.

## How it works

- `index.html` is the page; `app.js` loads `phrases.csv` and picks today's phrase.
- Everyone sees the same phrase on the same day; it changes at local midnight.
- Phrases rotate in a shuffled order: every phrase is shown once before any
  phrase repeats, and the same phrase never shows two days in a row. Each new
  round uses a different shuffle. (Adding or removing phrases starts a fresh
  shuffle from that day.)

## Adding phrases

Edit `phrases.csv`. The first line must be the header `phrase,author`; each
following line is one phrase. Wrap a phrase in double quotes if it contains a
comma, and write a literal quote as `""`. The author column is optional.

```csv
phrase,author
"Well done is better than well said.",Benjamin Franklin
```

## iPhone

- **Home Screen icon:** open the site in Safari, tap Share, then
  **Add to Home Screen**. It opens full screen like an app.
- **Home Screen widget:** install the free [Scriptable](https://scriptable.app)
  app, create a new script, paste in [`widget/scriptable.js`](widget/scriptable.js)
  (also served at https://cividati.github.io/words-of-wisdom/widget/scriptable.js),
  then add a Scriptable widget to the Home Screen, long-press it, tap
  **Edit Widget** and choose the script. Tapping the widget opens the site.

## Running it locally

Browsers block reading files from disk, so serve the folder over HTTP:

```sh
npm start        # or: python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing

Every push to `main` runs the tests and deploys the site to GitHub Pages at
https://cividati.github.io/words-of-wisdom/ (see `.github/workflows/pages.yml`).
One-time setup: in the repo's Settings → Pages, set **Source** to **GitHub Actions**.

## Tests

```sh
npm test
```
