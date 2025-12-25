# HimmlischeHilfe Extension

Chrome extension scaffold for Ikariam with separate dev/live builds.

## Quick start

1) Install dependencies

```
npm install
```

2) Build

```
# dev build (name: HimmlischerVersuch)
npm run build:dev

# live build (name: HimmlischeHilfe)
npm run build:live
```

3) Load into Chrome

- Open `chrome://extensions`
- Enable Developer mode
- Click "Load unpacked"
- Pick `dist/dev` or `dist/live`

## Dev workflow

```
npm run dev
```

This watches the dev build. Reload the extension in Chrome after each build.

## Files

- `src/content/content.js`: Injects the tab and panel into the Ikariam UI.
- `public/content.css`: Styles the tab and panel.
- `manifest.dev.json` and `manifest.live.json`: Source manifests.

## Icons

Placeholder icons live in `public/icons`. Replace them with real PNGs.
