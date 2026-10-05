# words-of-wisdom

A one-page site that shows a different phrase of wisdom each day.

## How it works

- `index.html` is the page; `app.js` loads `phrases.csv` and picks today's phrase.
- Everyone sees the same phrase on the same day. It moves to the next row at
  local midnight and loops back to the top after the last one.

## Adding phrases

Edit `phrases.csv`. The first line must be the header `phrase,author`; each
following line is one phrase. Wrap a phrase in double quotes if it contains a
comma, and write a literal quote as `""`. The author column is optional.

```csv
phrase,author
"Well done is better than well said.",Benjamin Franklin
```

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
