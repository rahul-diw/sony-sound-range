// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { updateBeats, progressOf, type BeatEl } from '../src/overlay';

describe('copy overlay', () => {
  const mk = (): BeatEl[] => (['hero', 'engineering', 'noise', 'sound', 'cta'] as const).map((name, i) => ({ name, dir: (['up', 'left', 'right', 'left', 'up'] as const)[i], el: { style: {} } }));
  it('shows the hero at the top, the engineering copy sliding in from the left, noise from the right, and the CTA at the end', () => {
    const els = mk(), at = (n: string) => els.find(b => b.name === n)!.el.style;
    updateBeats(els, 0); expect(Number(at('hero').opacity)).toBeGreaterThan(0.95); expect(at('hero').visibility).toBe('visible'); expect(at('noise').visibility).toBe('hidden');
    updateBeats(els, 0.2); expect(at('engineering').transform).toMatch(/translate3d\(-/); expect(Number(at('engineering').opacity)).toBeGreaterThan(0.1); expect(at('engineering').filter).toMatch(/blur/);
    updateBeats(els, 0.3); expect(at('engineering').transform).toBe('translate3d(0.0px,0.0px,0)'); expect(at('engineering').pointerEvents).toBe('auto'); expect(at('hero').visibility).toBe('hidden');
    updateBeats(els, 0.455); expect(at('noise').transform).toMatch(/translate3d\(\d/);
    updateBeats(els, 0.77); expect(at('sound').pointerEvents).toBe('auto'); updateBeats(els, 1); expect(Number(at('cta').opacity)).toBeGreaterThan(0.99); expect(at('cta').pointerEvents).toBe('auto');
  });
  it('maps the sticky section position to progress 0..1', () => { expect(progressOf(0, 4000, 800)).toBe(0); expect(progressOf(-1600, 4000, 800)).toBeCloseTo(0.5, 5); expect(progressOf(-9000, 4000, 800)).toBe(1); expect(progressOf(300, 4000, 800)).toBe(0) });
});
describe('whole page in a browser without WebGL', () => {
  it('still renders the full story, navigation and sections, and degrades gracefully', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    vi.stubGlobal('Image', class { onload: any; onerror: any; decoding = ''; set src(_: string) { setTimeout(() => this.onerror?.(), 0) } }); window.scrollTo = () => {};
    const React = await import('react'), { createRoot } = await import('react-dom/client'), { act } = await import('react'), App = (await import('../src/App')).default; (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    const root = document.createElement('div'); root.id = 'root'; document.body.appendChild(root); await act(async () => { createRoot(root).render(React.createElement(App)) }); await act(async () => { await new Promise(r => setTimeout(r, 60)) });
    const txt = document.body.textContent || '';
    expect(document.querySelectorAll('.nav ul a').length).toBe(6); expect(document.querySelector('.nav .btn')!.textContent).toBe('Experience WH-1000XM6'); expect(document.querySelector('h1')!.textContent).toBe('Sony WH-1000XM6');
    for (const s of ['Silence, perfected.', 'Precision-engineered for silence.', 'Adaptive noise cancelling, redefined.', 'Immersive, lifelike sound.', 'Hear everything.', 'See full specs', 'Engineered, not assembled.', 'Unofficial concept page']) expect(txt).toContain(s);
    expect(document.querySelectorAll('.dots li').length).toBe(5); expect(document.querySelectorAll('.card').length).toBe(6); expect(document.querySelector('canvas')).toBeTruthy(); expect(document.querySelector('.nogl')).toBeTruthy(); expect(document.querySelector('.boot.done')).toBeTruthy();
  });
});
describe('frame sequence player (for your own photorealistic frames)', () => {
  it('names frames 0001..0120 and draws the right frame, contained and centred, skipping redraws', async () => {
    const { FrameSequence, framePath } = await import('../src/frames'); expect(framePath('srs-xg300', 0)).toMatch(/frames\/srs-xg300\/0001\.jpg$/); expect(framePath('srs-xg300', 119)).toMatch(/frames\/srs-xg300\/0120\.jpg$/);
    const calls: any[] = [], ctx: any = { fillRect() {}, drawImage: (...a: any[]) => calls.push(a), set fillStyle(_: string) {} }, canvas: any = { width: 1600, height: 900, clientWidth: 800, clientHeight: 450, getContext: () => ctx };
    const seq = new FrameSequence(canvas, 'wh-1000xm6'); seq.imgs = Array.from({ length: 120 }, (_, i) => ({ naturalWidth: 1920, naturalHeight: 1080, i }) as any);
    seq.draw(0); expect(calls[0][0].i).toBe(0); seq.draw(0.0001); expect(calls.length).toBe(1); seq.draw(1); expect(calls[1][0].i).toBe(119); seq.draw(0.5); expect(calls[2][0].i).toBe(60);
    expect(calls[2].slice(1)).toEqual([0, 0, 1600, 900]); canvas.width = 1000; canvas.height = 900; seq.last = -1; seq.draw(0.5); expect(calls[3][2]).toBeCloseTo((900 - 1080 * (1000 / 1920)) / 2, 5);
  });
});
describe('sound toggle', () => {
  const mount = async () => {
    const React = await import('react'), { createRoot } = await import('react-dom/client'), { act } = await import('react'), App = (await import('../src/App')).default; (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    document.body.innerHTML = '<div id="root"></div>'; const root = createRoot(document.getElementById('root')!); await act(async () => { root.render(React.createElement(App)) }); await act(async () => { await new Promise(r => setTimeout(r, 60)) }); return { root, act };
  };
  const stubs = () => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })); vi.stubGlobal('Image', class { onerror: any; decoding = ''; set src(_: string) { setTimeout(() => this.onerror?.(), 0) } }); window.scrollTo = () => {} };
  it('starts off, shows a hint, and stays off (no crash) when the browser refuses audio', async () => {
    stubs(); (window as any).AudioContext = class { constructor() { throw new Error('audio blocked') } }; const { act, root } = await mount();
    const btn = document.querySelector('.snd') as HTMLButtonElement; expect(btn.getAttribute('aria-pressed')).toBe('false'); expect(btn.textContent).toContain('Sound off'); expect(document.querySelector('.soundhint')).toBeTruthy();
    await act(async () => { btn.click(); await new Promise(r => setTimeout(r, 30)) }); expect(btn.getAttribute('aria-pressed')).toBe('false'); await act(async () => { root.unmount() });
  });
  it('turns on and off with a real Web Audio context and removes the hint', async () => {
    stubs(); const NA = await import('node-web-audio-api'); (window as any).AudioContext = class extends (NA.AudioContext as any) { constructor() { super({ sinkId: 'none' }) } }; const { act, root } = await mount();
    const btn = document.querySelector('.snd') as HTMLButtonElement; await act(async () => { btn.click(); await new Promise(r => setTimeout(r, 400)) });
    expect(btn.getAttribute('aria-pressed')).toBe('true'); expect(btn.textContent).toContain('Sound on'); expect(btn.className).toContain('on'); expect(document.querySelector('.soundhint')).toBeFalsy();
    await act(async () => { btn.click(); await new Promise(r => setTimeout(r, 50)) }); expect(btn.getAttribute('aria-pressed')).toBe('false'); await act(async () => { root.unmount(); await new Promise(r => setTimeout(r, 50)) });
  });
});

describe('multi-product page', () => {
  const stubs = () => { vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} }); vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })); vi.stubGlobal('Image', class { onerror: any; decoding = ''; set src(_: string) { setTimeout(() => this.onerror?.(), 0) } }); window.scrollTo = () => {} };
  const mount = async () => { const React = await import('react'), { createRoot } = await import('react-dom/client'), { act } = await import('react'), App = (await import('../src/App')).default; (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true; document.body.innerHTML = '<div id="root"></div>'; const root = createRoot(document.getElementById('root')!); await act(async () => { root.render(React.createElement(App)) }); await act(async () => { await new Promise(r => setTimeout(r, 80)) }); return { root, act } };
  const h1 = () => document.querySelector('h1')!.textContent, wait = (act: any, ms: number) => act(async () => { await new Promise(r => setTimeout(r, ms)) });
  it('lists every product in "Explore the range" with a link to its own page', async () => {
    stubs(); location.hash = ''; const { root, act } = await mount(); const cards = [...document.querySelectorAll<HTMLAnchorElement>('.pcard')];
    expect(cards.map(c => c.getAttribute('href'))).toEqual(['#/', '#/p/wf-1000xm5', '#/p/srs-xg300', '#/p/ht-a7000']); expect(cards[0].getAttribute('aria-current')).toBe('page'); expect(cards.map(c => c.querySelector('h3')!.textContent)).toEqual(['WH-1000XM6', 'WF-1000XM5', 'SRS-XG300', 'HT-A7000']); await act(async () => { root.unmount() });
  });
  it('opens a deep link straight into that product with its own copy, specs and sound-beat side', async () => {
    stubs(); location.hash = '#/p/ht-a7000'; const { root, act } = await mount();
    expect(h1()).toBe('Sony HT-A7000'); expect(document.querySelector('.brand span')!.textContent).toBe('HT-A7000'); expect(document.title).toContain('HT-A7000'); expect(document.body.textContent).toContain('The cinema, at home.'); expect(document.body.textContent).toContain('A cinema, engineered.'); expect(document.querySelector('#b-sound')!.parentElement!.className).toContain('right'); expect(document.querySelector('.pcard.cur h3')!.textContent).toBe('HT-A7000'); await act(async () => { root.unmount() });
  });
  it('tapping a card switches the whole experience (copy, nav, specs, title) through the curtain, and back works too', async () => {
    stubs(); location.hash = ''; const { root, act } = await mount(); expect(h1()).toBe('Sony WH-1000XM6');
    await act(async () => { document.querySelector<HTMLAnchorElement>('.pcard[href="#/p/wf-1000xm5"]')!.click(); await new Promise(r => setTimeout(r, 30)) }); expect(document.querySelector('.curtain.on')).toBeTruthy(); expect(location.hash).toBe('#/p/wf-1000xm5');
    await wait(act, 1300); expect(document.querySelector('.curtain.on')).toBeFalsy(); expect(h1()).toBe('Sony WF-1000XM5'); expect(document.body.textContent).toContain('Big sound. Tiny silence.'); expect(document.body.textContent).toContain('Small by design.'); expect(document.title).toContain('WF-1000XM5'); expect(document.querySelector('.pcard.cur h3')!.textContent).toBe('WF-1000XM5'); expect(document.querySelector('.snd')).toBeTruthy();
    await act(async () => { location.hash = '#/p/srs-xg300'; await new Promise(r => setTimeout(r, 30)) }); await wait(act, 1300); expect(h1()).toBe('Sony SRS-XG300'); expect([...document.querySelectorAll('.nav ul a')].map(a => a.textContent)).toContain('Power');
    await act(async () => { location.hash = '#/'; await new Promise(r => setTimeout(r, 30)) }); await wait(act, 1300); expect(h1()).toBe('Sony WH-1000XM6'); expect([...document.querySelectorAll('.nav ul a')].map(a => a.textContent)).toContain('Noise Cancelling'); await act(async () => { root.unmount() });
  });
});
