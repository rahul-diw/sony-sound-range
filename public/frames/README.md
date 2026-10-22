# Optional photorealistic frame sequences (one folder per product)

Put 120 JPG frames for a product in `public/frames/<product-id>/` named `0001.jpg` ... `0120.jpg`.
When the first and last frame exist, that product automatically switches from the built-in 3D model to your frames. Products without frames keep the 3D model.

Product ids: `wh-1000xm6`, `wf-1000xm5`, `srs-xg300`, `ht-a7000`
Example: `public/frames/srs-xg300/0001.jpg`

Requirements for a seamless result:
- Same camera for every frame, product centred, 16:9 (1920x1080 or larger).
- Background exactly `#050505` (the page colour), so the image edges are invisible.
- Frame 1 = assembled hero shot, frame ~60 = fully exploded technical diagram, frame 120 = reassembled.
  (The scroll story is timed for this: separation starts at 12%, peak at 65-85%, reassembly from 85%.)
- Keep each JPG under ~400 KB (quality 80-85) so 120 frames load quickly.

Ways to make the frames: render an exploded-view animation in Blender or KeyShot, or generate a short video with an AI video tool and export 120 frames with
`ffmpeg -i clip.mp4 -vf "fps=30,scale=1920:-1" -frames:v 120 -q:v 3 %04d.jpg`.
