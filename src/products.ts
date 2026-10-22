import { makeHeadphones } from './models/headphones';
import { makeEarbuds } from './models/earbuds';
import { makeSpeaker } from './models/speaker';
import { makeTheater } from './models/theater';
import type { Model } from './models/common';
import type { View } from './camera';
/** Label groups share scroll windows with the story beats: eng = engineering reveal, a = electronics beat, b = sound beat. */
export type LabelGroup = 'eng' | 'a' | 'b';
export const LABEL_WINDOWS: Record<LabelGroup, [number, number, number, number]> = { eng: [0.2, 0.26, 0.36, 0.41], a: [0.45, 0.5, 0.6, 0.65], b: [0.7, 0.75, 0.8, 0.85] };
export interface Copy {
  hero: { eyebrow: string; title: string; sub: string; body: string };
  eng: { eyebrow: string; title: string; lines: [string, string] };
  feat: { eyebrow: string; title: string; points: [string, string, string] };
  sound: { eyebrow: string; title: string; lines: [string, string] };
  cta: { title: [string, string]; sub: string; micro: string };
}
export interface Product {
  id: string; name: string; category: string; blurb: string; view: View; build: () => Model; copy: Copy;
  nav: { feature: string }; labels: { part: string; text: string; group: LabelGroup }[]; specs: [string, string][]; specsTitle: string;
}
export const PRODUCTS: Product[] = [
  {
    id: 'wh-1000xm6', name: 'WH-1000XM6', category: 'Headphones', blurb: 'Flagship wireless noise cancelling.', view: { yaw: [36, 14], pitch: [9, 6] }, build: makeHeadphones, nav: { feature: 'Noise Cancelling' }, specsTitle: 'Engineered, not assembled.',
    copy: {
      hero: { eyebrow: 'Flagship wireless noise cancelling', title: 'Sony WH-1000XM6', sub: 'Silence, perfected.', body: 'Flagship wireless noise cancelling, re-engineered for a world that never stops.' },
      eng: { eyebrow: 'Technology', title: 'Precision-engineered for silence.', lines: ['Custom drivers, sealed acoustic chambers, and optimised airflow deliver studio-grade clarity.', 'Every component is tuned for balance, power, and comfort, hour after hour.'] },
      feat: { eyebrow: 'Noise cancelling', title: 'Adaptive noise cancelling, redefined.', points: ['Multi-microphone array listens in every direction.', 'Real-time noise analysis adjusts to your environment.', 'Your music stays pure. Planes, trains, and crowds fade away.'] },
      sound: { eyebrow: 'Sound', title: 'Immersive, lifelike sound.', lines: ['High-performance drivers unlock detail, depth, and texture in every track.', 'AI-enhanced upscaling restores clarity to compressed audio, so every note feels alive.'] },
      cta: { title: ['Hear everything.', 'Feel nothing else.'], sub: 'WH-1000XM6. Designed for focus, crafted for comfort.', micro: 'Engineered for airports, offices, and everything in between.' },
    },
    labels: [{ part: 'cushionR', text: 'Ear cushion', group: 'eng' }, { part: 'shellR', text: 'Acoustic chamber', group: 'eng' }, { part: 'sliderR', text: 'Slider arm', group: 'eng' }, { part: 'micL1', text: 'Multi-microphone array', group: 'a' }, { part: 'boardL', text: 'Processing chip', group: 'a' }, { part: 'micL0', text: 'Microphone module', group: 'a' }, { part: 'coneR', text: 'Driver unit', group: 'b' }, { part: 'coilR', text: 'Voice coil', group: 'b' }, { part: 'magnetR', text: 'Magnet', group: 'b' }],
    specs: [['Adaptive noise cancelling', 'A multi-microphone array listens in every direction and adjusts in real time.'], ['Lifelike sound', 'High-performance drivers unlock detail, depth and texture in every track.'], ['AI-enhanced upscaling', 'Restores clarity and presence to compressed audio.'], ['All-day comfort', 'Soft cushions and a balanced headband, hour after hour.'], ['Built for focus', 'Designed for airports, offices and everything in between.'], ['Precision engineering', 'Sealed acoustic chambers and optimised airflow, tuned for balance and power.']],
  },
  {
    id: 'wf-1000xm5', name: 'WF-1000XM5', category: 'Earbuds', blurb: 'Truly wireless noise cancelling.', view: { yaw: [18, 8], pitch: [10, 6] }, build: makeEarbuds, nav: { feature: 'Noise Cancelling' }, specsTitle: 'Small by design.',
    copy: {
      hero: { eyebrow: 'Truly wireless noise cancelling', title: 'Sony WF-1000XM5', sub: 'Big sound. Tiny silence.', body: 'Truly wireless noise cancelling, shrunk to fit your ear and slip into any pocket.' },
      eng: { eyebrow: 'Technology', title: 'A whole system, in the size of a bean.', lines: ['A driver, battery and processing board are folded into a housing shaped around the ear.', 'Every part is tuned for balance, power and all-day comfort.'] },
      feat: { eyebrow: 'Noise cancelling', title: 'Noise cancelling that fits in your pocket.', points: ['Microphones on the outside and inside listen to the world.', 'Real-time analysis adapts to wherever you are.', 'Wind, engines and chatter fade into the background.'] },
      sound: { eyebrow: 'Sound', title: 'Detail in every note.', lines: ['A compact driver delivers depth, texture and a natural sense of space.', 'AI-enhanced upscaling restores clarity to compressed audio.'] },
      cta: { title: ['Small enough to forget.', 'Good enough to remember.'], sub: 'WF-1000XM5. Designed for movement, crafted for comfort.', micro: 'Engineered for commutes, gyms, and everything in between.' },
    },
    labels: [{ part: 'shellR', text: 'Housing', group: 'eng' }, { part: 'tipR', text: 'Ear tip', group: 'eng' }, { part: 'nozzleR', text: 'Acoustic nozzle', group: 'eng' }, { part: 'micL0', text: 'Microphone', group: 'a' }, { part: 'boardL', text: 'Processing board', group: 'a' }, { part: 'micL1', text: 'Microphone', group: 'a' }, { part: 'driverR', text: 'Driver unit', group: 'b' }, { part: 'coilR', text: 'Voice coil', group: 'b' }, { part: 'magnetR', text: 'Magnet', group: 'b' }],
    specs: [['Adaptive noise cancelling', 'Inner and outer microphones adapt to your surroundings in real time.'], ['Rich, detailed sound', 'A compact driver with depth, texture and space.'], ['AI-enhanced upscaling', 'Restores clarity and presence to compressed audio.'], ['Comfort-first fit', 'Soft ear tips and a housing shaped around the ear.'], ['Pocket-sized case', 'A slim charging case that keeps the music going.'], ['Built to move', 'Designed for commutes, gyms and everything in between.']],
  },
  {
    id: 'srs-xg300', name: 'SRS-XG300', category: 'Portable speaker', blurb: 'Room-filling sound, anywhere.', view: { yaw: [38, 66], pitch: [12, 14], soundRight: true }, build: makeSpeaker, nav: { feature: 'Power' }, specsTitle: 'Built to be moved.',
    copy: {
      hero: { eyebrow: 'Portable party speaker', title: 'Sony SRS-XG300', sub: 'Take the party anywhere.', body: 'A portable speaker with room-filling sound and a light show to match.' },
      eng: { eyebrow: 'Technology', title: 'Built to move. Tuned to fill the room.', lines: ['Dual woofers and a dedicated tweeter sit behind a protective grille.', 'A rugged housing carries the weight, the battery and the bass.'] },
      feat: { eyebrow: 'Power', title: 'Power, precisely delivered.', points: ['An efficient amplifier drives every driver with control.', 'A large battery keeps the music going for hours.', 'Lighting reacts to the beat in real time.'] },
      sound: { eyebrow: 'Sound', title: 'Bass you can feel.', lines: ['Large woofers move air for deep, punchy low end.', 'A tweeter keeps vocals and detail crisp at any volume.'] },
      cta: { title: ['Turn it up.', 'Take it anywhere.'], sub: 'SRS-XG300. Designed for gatherings, built for the outdoors.', micro: 'Engineered for parties, picnics, and everything in between.' },
    },
    labels: [{ part: 'shell', text: 'Rear housing', group: 'eng' }, { part: 'handle', text: 'Carry handle', group: 'eng' }, { part: 'endcapR', text: 'End cap', group: 'eng' }, { part: 'amp', text: 'Amplifier board', group: 'a' }, { part: 'controls', text: 'Control panel', group: 'a' }, { part: 'battery', text: 'Battery pack', group: 'a' }, { part: 'wooferL', text: 'Woofer', group: 'b' }, { part: 'tweeter', text: 'Tweeter', group: 'b' }, { part: 'magnetL', text: 'Magnet', group: 'b' }],
    specs: [['Room-filling sound', 'Dual woofers and a tweeter fill the space with deep, clear sound.'], ['Powerful bass', 'Large woofers move air for a low end you can feel.'], ['Light show', 'Lighting that reacts to the beat of the music.'], ['Rugged build', 'A tough housing and a carry handle for life on the move.'], ['Long listening', 'A large battery keeps the party going for hours.'], ['Easy controls', 'A simple control panel right where your hand lands.']],
  },
  {
    id: 'ht-a7000', name: 'HT-A7000', category: 'Home theater', blurb: 'Soundbar and subwoofer.', view: { yaw: [28, 62], pitch: [10, 12], soundRight: true }, build: makeTheater, nav: { feature: 'Processing' }, specsTitle: 'A cinema, engineered.',
    copy: {
      hero: { eyebrow: 'Soundbar and subwoofer', title: 'Sony HT-A7000', sub: 'The cinema, at home.', body: 'A soundbar and subwoofer system that wraps the whole room in sound.' },
      eng: { eyebrow: 'Technology', title: 'A theatre, folded into a bar.', lines: ['Multiple drivers fire forward, outward and upward from one slim enclosure.', 'A dedicated subwoofer adds the weight you feel in your chest.'] },
      feat: { eyebrow: 'Processing', title: 'Intelligent processing, every channel.', points: ['A dedicated board places sound all around you.', 'Up-firing drivers add height for overhead effects.', 'Room calibration adapts the sound to your space.'] },
      sound: { eyebrow: 'Sound', title: 'Dialogue you can follow. Action you can feel.', lines: ['Dedicated centre and side drivers keep voices clear and present.', 'The subwoofer delivers deep, controlled low frequencies.'] },
      cta: { title: ['Movie night,', 'rebuilt.'], sub: 'HT-A7000. Designed for the living room, crafted for the story.', micro: 'Engineered for films, games, and everything in between.' },
    },
    labels: [{ part: 'barcapR', text: 'End cap', group: 'eng' }, { part: 'cabinet', text: 'Subwoofer cabinet', group: 'eng' }, { part: 'subport', text: 'Bass port', group: 'eng' }, { part: 'barboard', text: 'Processing board', group: 'a' }, { part: 'psu', text: 'Power supply', group: 'a' }, { part: 'centerdriver', text: 'Center driver', group: 'b' }, { part: 'tweeterL', text: 'Tweeter', group: 'b' }, { part: 'subdriver', text: 'Bass driver', group: 'b' }],
    specs: [['Wrap-around sound', 'Drivers that fire forward, outward and upward fill the room.'], ['Clear dialogue', 'A dedicated centre driver keeps voices clear and present.'], ['Deep, controlled bass', 'A wireless subwoofer delivers the weight of the action.'], ['Overhead effects', 'Up-firing drivers add height to the soundstage.'], ['Room calibration', 'Adapts the sound to the space you actually have.'], ['Clean living-room design', 'A slim bar and a compact sub that blend into your room.']],
  },
];
export const byId = (id: string) => PRODUCTS.find(p => p.id === id) || PRODUCTS[0];
export const idFromHash = (h: string) => { const m = /^#\/p\/([\w-]+)/.exec(h); return m ? byId(m[1]).id : PRODUCTS[0].id };
export const hashFor = (id: string) => (id === PRODUCTS[0].id ? '#/' : `#/p/${id}`);
