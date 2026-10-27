# Drawn by Leon: homepage v2 prototype

Clickable prototype of Leon's homepage notes (22 Oct 2026), built on the site's own styles and images.

## 👉 View the prototype

**https://raw.githack.com/monashbobo-boop/drawn-by-leon-prototype/main/index.html**

Works straight away in any browser, on a computer or a phone. Once GitHub Pages is on, the same prototype is also at https://monashbobo-boop.github.io/drawn-by-leon-prototype/

## What changed (latest round, 27 Oct)

- **Menu**: Home added. On computers each page is a boxed link that turns yellow on hover; the page you are on is navy. Book Leon keeps its yellow pill and drop-down. Phones and tablets keep the full-screen hamburger menu.
- **Hero**: "CARICATURES" in Leon's face letters under "hi, I'm Leon!". A few letters hop, glance around, sway or shiver now and then, and any letter jumps when you point at it. The photos behind now fade from one set to the next instead of scrolling.
- **Two ways**: the two cards run edge to edge. Live at events shows event photos that fade between birthday parties, weddings and markets; Drawn from photos shows five framed drawings that grow a little under the pointer.
- **Home**: tighter gaps between sections; "Every guest goes home smiling" removed; the Mr Bean colour-in game moved to the end. Order: hero, services strip, two ways, about, recent drawings, kind words, colour-in game.
- **Recent drawings**: all three drawings change at the same moment.
- **Book Leon page**: three picture cards (Live at my event, Drawn from my photo, Something else) sitting right on top of the postcard; booking length 2 to 6 hours or Not sure; optional photo upload (up to 3).

## How it moves to WordPress.com

Everything is written as core blocks Leon can edit in the editor:

- Menu: one Navigation block in the header, with a Submenu block for Book Leon (Site Editor > Navigation).
- Face letters: a Gallery block with the theme's "Face letters" style; each letter is one picture.
- Hero photos and the live events photos: Gallery blocks with the "Crossfade" style; add, remove or reorder pictures, and the captions become the little labels.
- Drawn from photos collage: a Gallery block with the "Collage" style (five pictures).
- Two ways: a Columns block with two coloured Columns; title and button sit in a Row.
- Upload: Jetpack form "File upload" field.

## Turning on GitHub Pages

Settings > Pages > Deploy from a branch > main, / (root).

The prototype's form is not connected; nothing is sent.
