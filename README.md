# Drawn by Leon: homepage v2 prototype

Clickable prototype of Leon's homepage notes (22 Oct 2026), built on the site's own styles and images.

## 👉 View the prototype

**https://raw.githack.com/monashbobo-boop/drawn-by-leon-prototype/main/index.html**

Works straight away in any browser, on a computer or a phone. Once GitHub Pages is on, the same prototype is also at https://monashbobo-boop.github.io/drawn-by-leon-prototype/

## What changed (latest round, 28 Oct)

- **Menu**: phone menu items stay on one line. On computers each page is a boxed link that turns yellow on hover; the page you are on is navy. Book Leon keeps its yellow pill and drop-down.
- **Hero**: fills the window below the header, so nothing is cut off on shorter screens. "CARICATURES" in Leon's face letters, a few of them come alive now and then; the photos behind fade from one set to the next.
- **Two ways**: edge to edge. Live at events shows the birthday photo; Drawn from photos shows five framed drawings that grow under the pointer.
- **About**: "my promise" removed. "Leon has drawn at" is now a yellow band that runs straight into the footer wave.
- **Live caricatures and Custom portraits**: each page ends differently now. Live caricatures: "How booking works" in three steps. Custom portraits: a framed drawing with a "What to send me" checklist.
- **Book Leon page**: three picture cards on top of the postcard; inked postmark beside the stamp; photo upload (up to 3); smoother falling doodles.
- **Footer**: copyright year and a new Privacy & copyright page.
- **SEO**: page titles, descriptions and business details for Google on every page.

## How it moves to WordPress.com

Everything is written as core blocks Leon can edit in the editor:

- Menu: one Navigation block in the header, with a Submenu block for Book Leon (Site Editor > Navigation).
- Face letters: a Gallery block with the theme's "Face letters" style; each letter is one picture.
- Hero photos and the live events photos: Gallery blocks with the "Crossfade" style; add, remove or reorder pictures, and the captions become the little labels.
- Drawn from photos collage: a Gallery block with the "Collage" style (five pictures).
- Two ways: a Columns block with two coloured Columns; title and button sit in a Row.
- Booking steps and the portrait checklist: List blocks with the "Steps" and "Ticks" styles.
- Upload: Jetpack form "File upload" field.

## Turning on GitHub Pages

Settings > Pages > Deploy from a branch > main, / (root).

The prototype's form is not connected; nothing is sent.
