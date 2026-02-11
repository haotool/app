---
'@app/haotool': patch
---

fix(a11y): resolve WCAG accessibility violations in haotool portfolio

- Fix dlitem: wrap dt/dd stats in <dl> element (was in <div>)
- Fix label-content-name-mismatch: aria-label now matches visible text
- Fix landmark-one-main: Projects/Contact/About pages use <div> not <main>
  (Layout already provides the single <main> landmark)
