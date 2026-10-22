# Drawn by Leon: homepage v2 prototype

Clickable prototype of Leon's homepage notes (22 Oct 2026), built on the site's own styles and images.

## What changed

- **Menu**: on computers every page sits in the top bar, and Book Leon opens a small menu (Live at events, Drawn from photos, Other inquiries). Phones and tablets keep the full-screen hamburger menu.
- **Home**: hero without the buttons and with "Charming Caricatures" added; a redesigned "Two ways to get drawn" section right under it; then About, quick facts, Recent drawings, Kind words, and the Mr Bean colour-in game at the end. Nothing was removed.
- **Recent drawings**: all three drawings change at the same moment.
- **Book Leon page**: booking length 2 to 6 hours or Not sure; optional photo upload (up to 3) on the portrait form; a third tab for other questions.

## How it moves to WordPress.com

Everything is written as core blocks Leon can edit in the editor:

- Menu: one Navigation block in the header, with a Submenu block for Book Leon (Site Editor > Navigation).
- Two ways: a Columns block with two coloured Columns; each holds an Image, Heading, Paragraph, List (shown as pills) and Button.
- Upload: Jetpack form "File upload" field.

## Viewing it

Open `index.html`, or turn on GitHub Pages (Settings > Pages > Deploy from branch > main, root).

The prototype's form is not connected; nothing is sent.
