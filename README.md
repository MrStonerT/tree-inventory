# Arborist Assistant

An offline tree inventory that lays trees over a plot plan survey, then records what you
find about each one — measurements, condition, defects, recommended work, photos, and notes
— building history across repeat visits.

**Live app: https://mrstonert.github.io/tree-inventory/**

No build step, no dependencies, no server, no accounts, no tracking. The whole application
is one HTML file.

## Your data never leaves your device

This repository hosts the *application* only. It ships blank.

Everything you record — surveys, trees, photos, GPS coordinates, notes — stays in your own
browser's storage and in the `.zip` packages you export to your own disk. The app makes no
network requests at all once loaded. There is no backend, and nothing is uploaded anywhere.

## What it does

- **Plot plan as the base layer.** Import a PNG/JPG/WebP/SVG of your survey and place trees
  on it. Geometry is stored normalized, so zoom, window size, or re-scanning the plan at a
  different DPI never move your trees.
- **Scale calibration.** Drag along a known distance — the survey's scale bar, a property
  line, a building face — and everything downstream becomes real measurements.
- **True-scale canopy circles**, coloured by condition, so you can see overhang over
  structures and crowding between trees rather than just dots on a map.
- **Visits over time.** Measurements are recorded against a visit, carried forward on
  revisit, so growth and condition change build up automatically with deltas.
- **Photos with metadata.** GPS position and accuracy, camera bearing ("facing 218° SW"),
  and true capture time are read from the original file before downscaling.
- **Draw on photos.** Line, arrow, freehand, and circle tools to mark where to cut. Stored
  as vectors so the original photo is untouched and marks stay editable.
- **Portable packages.** Everything exports to a real `.zip` you can hand to someone else,
  open in Explorer or Finder, or reopen here to carry on.
- **Arborist fields.** DBH, height, spread, condition, priority, defects, recommended work,
  protected/heritage status, botanical names.
- CSV export and a printable client report.

## Using it offline and on a phone

A service worker caches the app, so after your first visit it opens with no connection —
in an ordinary browser tab, no install required.

Installing it (iOS: Share → *Add to Home Screen*; Android: the **Install app** button in the
Project tab) adds a home-screen icon and a standalone window, and — the part that matters —
makes the browser treat your storage as permanent. Ordinary websites can have their storage
evicted, and iOS Safari clears it after about 7 days of non-use. Home-screen apps are exempt.

Either way, the exported `.zip` is the real backup.

The Project tab always reports where you stand: cached offline or not, installed or not,
storage permanent or not.

## Running it locally

Download `tree_plot_plan_editor.html` and open it. That is the whole app.

The one caveat is that browsers block persistent storage on `file://` addresses, so photos
live in memory only until you save a package. The app detects this and says so. To get
persistent storage locally, serve it instead:

```bash
python -m http.server 8777
```

Then open `http://localhost:8777/`. Note that `localhost` is a secure context but a LAN
address like `http://192.168.1.5` is **not**, so serving from a laptop to a phone over wifi
will not enable offline caching or storage — use the hosted URL above for that.

## Browser support

Needs `CompressionStream` — Chrome/Edge 80+, Safari 16.4+, Firefox 113+ — which is what lets
the app write real ZIP files with no library.

## Development

The app is a single self-contained file. Edit `tree_plot_plan_editor.html` directly; it is
organized into commented sections (schema and migration, storage, photos, EXIF, annotation,
ZIP, geometry, rendering, interaction, panels, export).

After changing the HTML, bump `CACHE_VERSION` in `sw.js` so caches refresh promptly. The
worker also compares the fetched page against its cached copy and prompts open tabs to
reload when they differ, so an HTML-only deploy will not go unnoticed either way.

## Licence

MIT — see [LICENSE](LICENSE).
