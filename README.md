# Sony sound range: scrollytelling (unofficial concept)

A cinematic, Apple-style scroll story: a product sits in a deep black void, then **explodes into a floating technical diagram and reassembles** as you scroll, while copy slides in and out in sync and a bass soundtrack follows the scroll. Built with React + TypeScript + Three.js + Lenis (smooth scroll).

**Four products, one experience.** Scroll down to *Explore the range* and tap a product: the page fades through a curtain and the same story plays for it (own 3D model, copy, callouts, specs; same music).

| Product | Category | What explodes |
|---|---|---|
| WH-1000XM6 | Headphones | cushions, shells, drivers, mics, boards, headband |
| WF-1000XM5 | Earbuds + case | ear tips, nozzles, drivers, mics, boards, battery cells; the case opens into lid, tray, charging board, battery, coil, base |
| SRS-XG300 | Portable speaker | grille, woofers, magnets, tweeter, amp board, battery, housing, handle, end caps |
| HT-A7000 | Home theater | soundbar (grille, drivers, up-firing drivers, boards, housing) and subwoofer (driver, magnet, port, amp, cabinet) |

Each product is a deep link: `#/` (flagship), `#/p/wf-1000xm5`, `#/p/srs-xg300`, `#/p/ht-a7000`. Back/forward work.

> Unofficial concept page for design practice. Not affiliated with or endorsed by Sony. All copy and specs are illustrative.

## How it works
- **Sticky 450vh stage**: the canvas stays pinned (CSS `position: sticky`, no JS pinning) while scroll progress `0..1` drives everything.
- **Two renderers, one story**
  - *3D mode (default, no assets needed):* a procedural 3D model of the headphones built from ~30 parts (headband, pad, sliders, hinges, ear cushions, shells, outer plates, drivers, voice coils, magnets, boards, battery, 6 microphones). Each part has an assembled and an exploded position. Mics/boards glow cyan during the noise-cancelling beat and drivers glow blue during the sound beat. Technical callout labels track the parts.
  - *Frame mode:* put 120 JPG frames in `public/frames/<product-id>/` (see `public/frames/README.md`) and that product switches to a canvas image-sequence player automatically.
  - *Auto-fit camera:* for every model the exact camera distance that keeps every vertex in frame is computed per aspect ratio and explosion amount, so new models need no hand-tuning. The product also slides away from whichever side the copy is on.
  - *Callouts:* labels sit in a column opposite the copy of each beat, joined to their part by a leader line, so they never collide with each other or the text.
- **Story beats** (scroll %): 0-15 hero, 15-40 engineering reveal (copy from the left), 40-65 noise cancelling (from the right), 65-85 sound and upscaling, 85-100 reassembly and call to action.
- **Bass music (generative, scroll-synced):** there is no audio file. `src/music.ts` synthesises the soundtrack live with the Web Audio API, and every layer is a pure function of scroll progress: calm sub-bass drone and pad in the hero; kick and bass line enter as the parts separate (half-time at first, four-on-the-floor, syncopated at the peak); tempo rises 68 to 84 BPM and the filter opens with the explosion; hi-hats from the noise-cancelling beat; a bell lead only in the sound beat; the groove stops and a sub drop lands on the reassembly. A "world noise" bed fades in and is **cancelled** during the noise-cancelling beat, mirroring the copy. Risers/impacts fire when you cross each story milestone, scrolling fast adds a soft swish, and the page glow and the nav equaliser pulse with the real bass. Starts only when the visitor clicks **Sound** (browser autoplay rule), fades in/out, pauses when the tab is hidden. No copyrighted music is used.
- **Premium details:** `#050505` page colour identical to the canvas (no visible edges), glass nav that fades in after a small scroll, gradient headings and buttons, ambient glows that react to each beat, frame-rate independent smoothing for buttery motion, `prefers-reduced-motion` support, mobile layout.

## Run
```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production build in dist/
npm run build:single   # one self-contained HTML file in dist-single/
npm test               # 53 tests
npx tsx scripts/render-audio.ts   # renders the soundtrack for a scripted scroll to /tmp/xm6-soundtrack.wav and analyses it
npm run preview:model  # CPU-renders the model at 6 scroll positions to /tmp/preview.ppm
```

## Tests (what is verified)
- Explosion curve: 0 at hero, 1 at peak, 0 at the end, never overshoots, no velocity jumps (smooth).
- Copy beats never overlap and are fully visible inside their windows.
- The whole model stays **inside the frame at every scroll position** on 16:9, 4:3 and portrait screens.
- Fully exploded diagram has **no colliding parts**; assembled model is mirror-symmetric.
- Highlights light only the right parts per beat. Frame player maps scroll to frames 1-120 and contains/centres each frame.
- The full page renders (nav, all copy, sections) even where WebGL is unavailable; the sound toggle works with a real Web Audio context and stays off, without crashing, if audio is blocked.
- **Audio is rendered offline and measured:** never clips (peak < 0.95), audible from second one, sub + bass carry over 70% of the energy in every section, louder at the peak, drums land exactly on the 16th-note grid and only where the story calls for them, world noise is cancelled in the noise-cancelling beat.

## Honest notes
- The 3D model is **stylised, not photoreal**. For the "8K photorealistic" look, render your own frames and drop them in `public/frames/`.
- I verified geometry, framing and layout with tests and a CPU rasteriser, but **could not run a real GPU/browser here**, so check the lighting, performance on your devices and the exact look of the glow and labels yourself.
- I cannot listen to audio. The soundtrack was verified by rendering and measuring it (levels, spectrum, timing), not by ear, so taste (mix, volume, sound design) is yours to judge: all levels are plain constants at the top of `music.ts`.
- The three extra products are **my own procedural models**, stylised like the headphones. Names are real Sony models but all copy is qualitative and illustrative (no spec numbers). The "Explore the range" card art is rendered from those same 3D models in your browser (with a text-card fallback if WebGL is unavailable), which I could not run here.
- Page copy follows the brief; specs are deliberately qualitative so nothing false is claimed about a real product.

## Resume bullets
- Built a scroll-driven product story (React, TypeScript, Three.js, Lenis) where a 30-part procedural 3D headphone model explodes into a technical diagram and reassembles, synchronised with five copy beats.
- Engineered smooth motion: monotone cubic easing, frame-rate independent smoothing, camera dolly/orbit that keeps every part framed on desktop and mobile (verified by automated projection tests).
- Added a canvas image-sequence player for 120 photorealistic frames with automatic fallback to the 3D renderer.

## Add another product
1. Write a builder in `src/models/` that returns `{ root, parts, frames }` (see `speaker.ts`: each part has a base position, an exploded position and a tag: `pcb`/`mic` light up in the electronics beat, `driver` in the sound beat).
2. Add an entry to `PRODUCTS` in `src/products.ts` with its camera `view`, copy, labels and specs.
3. `npm test` checks the new model automatically: parts in frame at every scroll position and screen shape, no colliding parts when exploded, labels pointing at real parts on the correct side.
