import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { Stage } from './stage';
import { FrameSequence } from './frames';
import { updateBeats, progressOf, type BeatEl } from './overlay';
import { sectionAt, SECTIONS, trap } from './story';
import { Soundtrack } from './music';
import { PRODUCTS, byId, idFromHash, hashFor, type Product } from './products';
import { renderThumbs } from './thumbs';
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const titleOf = (p: Product) => `${p.name} | ${p.copy.hero.sub} (unofficial concept)`;
export default function App() {
  const [pid, setPid] = useState(() => idFromHash(location.hash)), product = byId(pid);
  const storyRef = useRef<HTMLElement>(null), cv3Ref = useRef<HTMLCanvasElement>(null), cv2Ref = useRef<HTMLCanvasElement>(null), labelsRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null), lenisRef = useRef<Lenis | null>(null);
  const [mode, setMode] = useState<'boot' | '3d' | 'frames' | 'none'>('boot'), [viewMode, setViewMode] = useState<'3d' | 'frames'>('3d'), [pct, setPct] = useState(0), [solid, setSolid] = useState(false), [sec, setSec] = useState(0), [sound, setSound] = useState(false), [hint, setHint] = useState(false), [curtain, setCurtain] = useState<string | null>(null), [thumbs, setThumbs] = useState<Record<string, string>>({});
  const psRef = useRef(0), stRef = useRef<Soundtrack | null>(null), timerRef = useRef<number>(0), soundOn = useRef(false);
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, story = storyRef.current!, cv3 = cv3Ref.current!, cv2 = cv2Ref.current!, stageEl = stageRef.current!;
    const lenis = reduce ? null : new Lenis({ lerp: 0.085 }); lenisRef.current = lenis;
    let stage: Stage | null = null, seq: FrameSequence | null = null, raf = 0, ps = 0, prev = performance.now(), alive = true, lastSec = -1, lastPs = 0, lastAudio = 0, busy = false, current = idFromHash(location.hash);
    const beats: BeatEl[] = ([['hero', 'up'], ['engineering', 'left'], ['noise', 'right'], ['sound', 'left'], ['cta', 'up']] as const).map(([name, dir]) => ({ name, dir, el: document.getElementById('b-' + name)! }));
    /** Chooses the renderer for a product: its photoreal frame sequence if one was added, otherwise the live 3D model. */
    const setup = async (p: Product, first: boolean) => {
      seq = null;
      if (await FrameSequence.available(p.id)) { const s = new FrameSequence(cv2, p.id); s.resize(); try { await s.preload(n => first && setPct(n / 120)); seq = s } catch { seq = null } }
      if (!seq) { if (stage) stage.setProduct(p); else { try { stage = new Stage(cv3, labelsRef.current, p) } catch { stage = null } } }
      if (alive) { setViewMode(seq ? 'frames' : '3d'); if (first) setMode(seq ? 'frames' : stage ? '3d' : 'none') }
    };
    const goProduct = async (id: string) => {
      if (busy || id === current) return; busy = true; const p = byId(id), st = stRef.current; setCurtain(p.name); if (st && soundOn.current) st.accent('riser', st.ctx.currentTime, 1);
      await sleep(480); if (!alive) return; current = id; lenis ? lenis.scrollTo(0, { immediate: true }) : scrollTo(0, 0); scrollTo(0, 0); ps = 0; psRef.current = 0; st?.reset(0);
      setPid(id); document.title = titleOf(p); await setup(p, false); await sleep(140); setCurtain(null); busy = false;
      if (alive && idFromHash(location.hash) !== current) goProduct(idFromHash(location.hash));
    };
    document.title = titleOf(byId(current)); setup(byId(current), true);
    const onHash = () => goProduct(idFromHash(location.hash)), onVis = () => { const st = stRef.current; if (!st) return; if (document.hidden) (st.ctx as AudioContext).suspend?.(); else if (soundOn.current) (st.ctx as AudioContext).resume?.() };
    const onResize = () => { stage?.resize(); seq?.resize() }, onScroll = () => setSolid(scrollY > 24);
    addEventListener('hashchange', onHash); document.addEventListener('visibilitychange', onVis); addEventListener('resize', onResize); addEventListener('scroll', onScroll, { passive: true }); onScroll();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now; lenis?.raf(now);
      const r = story.getBoundingClientRect(), p = progressOf(r.top, story.offsetHeight, innerHeight); ps = reduce ? p : ps + (p - ps) * (1 - Math.exp(-dt * 10));
      updateBeats(beats, ps); if (seq) seq.draw(ps); else stage?.render(ps, now / 1000); psRef.current = ps;
      const st = stRef.current; if (st && soundOn.current) { if (now - lastAudio > 33) { st.update(ps, Math.abs(ps - lastPs) / Math.max(0.001, (now - lastAudio) / 1000), st.ctx.currentTime); lastPs = ps; lastAudio = now } stageEl.style.setProperty('--bass', st.bass().toFixed(3)) } else stageEl.style.setProperty('--bass', '0');
      stageEl.style.setProperty('--mic', trap(ps, 0.38, 0.46, 0.62, 0.7).toFixed(3)); stageEl.style.setProperty('--drv', trap(ps, 0.62, 0.7, 0.82, 0.88).toFixed(3)); stageEl.style.setProperty('--p', ps.toFixed(4));
      const s = sectionAt(ps); if (s !== lastSec) { lastSec = s; setSec(s) }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); lenis?.destroy(); stage?.dispose(); removeEventListener('hashchange', onHash); document.removeEventListener('visibilitychange', onVis); removeEventListener('resize', onResize); removeEventListener('scroll', onScroll); clearInterval(timerRef.current); stRef.current?.close() };
  }, []);
  useEffect(() => { if (mode === 'boot') return; setHint(true); const t = setTimeout(() => setHint(false), 9000), t2 = setTimeout(() => { try { setThumbs(renderThumbs(PRODUCTS)) } catch { /* no WebGL: cards fall back to text */ } }, 900); return () => { clearTimeout(t); clearTimeout(t2) } }, [mode]);
  /** Must run from a click: browsers only allow audio after a user gesture. */
  const toggleSound = async () => {
    setHint(false); const next = !soundOn.current; soundOn.current = next; setSound(next);
    try {
      if (!stRef.current) { const AC = window.AudioContext || (window as any).webkitAudioContext, ctx = new AC(); await ctx.resume(); stRef.current = new Soundtrack(ctx) }
      const st = stRef.current, ctx = st.ctx as AudioContext; clearInterval(timerRef.current);
      if (next) { await ctx.resume(); st.nextT = ctx.currentTime + 0.08; st.fade(true); st.update(psRef.current, 0); timerRef.current = window.setInterval(() => st.schedule(ctx.currentTime + 0.3, () => psRef.current), 40) }
      else { st.fade(false); setTimeout(() => { if (!soundOn.current) ctx.suspend() }, 600) }
    } catch { soundOn.current = false; setSound(false) }
  };
  const go = (id: string) => {
    const story = storyRef.current!, H = story.offsetHeight - innerHeight, y = id === 'story' ? 0 : id === 'tech' ? story.offsetTop + 0.2 * H : id === 'nc' ? story.offsetTop + 0.46 * H : document.getElementById(id)!.offsetTop;
    lenisRef.current ? lenisRef.current.scrollTo(y) : scrollTo({ top: y, behavior: 'smooth' });
  };
  const toProgress = (p: number) => { const s = storyRef.current!, y = s.offsetTop + p * (s.offsetHeight - innerHeight); lenisRef.current ? lenisRef.current.scrollTo(y) : scrollTo({ top: y, behavior: 'smooth' }) };
  const c = product.copy, NAV: [string, string][] = [['Overview', 'story'], ['Technology', 'tech'], [product.nav.feature, 'nc'], ['Specs', 'specs'], ['Range', 'range'], ['Buy', 'buy']], soundSide = product.view.soundRight ? 'right' : 'left';
  return (
    <>
      <nav className={'nav' + (solid ? ' solid' : '')} aria-label="Primary"><a className="brand" href="#/" onClick={e => { e.preventDefault(); go('story') }}><b>Sony</b><span>{product.name}</span></a>
        <ul>{NAV.map(([l, id]) => <li key={l}><a href={'#' + id} onClick={e => { e.preventDefault(); go(id) }}>{l}</a></li>)}</ul>
        <div className="navr"><button className={'snd' + (sound ? ' on' : '')} onClick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}><span className="eq" aria-hidden="true"><i /><i /><i /><i /></span><span className="sndl">{sound ? 'Sound on' : 'Sound off'}</span></button><a className="btn grad sm" href="#buy" onClick={e => { e.preventDefault(); go('buy') }}>Experience {product.name}</a></div>
        {hint && !sound && <button className="soundhint" onClick={toggleSound}>Turn sound on for the full experience <span aria-hidden="true">&#9835;</span></button>}</nav>
      <div className={'boot' + (mode !== 'boot' ? ' done' : '')} aria-hidden="true"><span>{product.name}</span><i style={{ width: Math.max(pct, mode === 'boot' ? 0.12 : 1) * 100 + '%' }} /></div>
      <div className={'curtain' + (curtain ? ' on' : '')} aria-hidden="true"><span>{curtain}</span></div>
      <section id="story" ref={storyRef} className="story"><div className="stage" ref={stageRef}>
        <div className="glow" /><div className="grid" />
        <canvas ref={cv3Ref} className={'cv' + (viewMode === '3d' ? '' : ' off')} role="img" aria-label={`Interactive 3D view of the ${product.name} separating into its internal components and reassembling as you scroll`} /><canvas ref={cv2Ref} className={'cv' + (viewMode === 'frames' ? '' : ' off')} aria-hidden="true" />
        <div className={'labels' + (viewMode === '3d' ? '' : ' off')} ref={labelsRef} />
        {mode === 'none' && <p className="nogl">Your browser could not start 3D graphics. The story below still works.</p>}
        <div className="cw top"><div className="copy" id="b-hero"><p className="eyebrow">{c.hero.eyebrow}</p><h1 className="gt">{c.hero.title}</h1><p className="sub">{c.hero.sub}</p><p className="body">{c.hero.body}</p></div></div>
        <div className="cw left"><div className="copy" id="b-engineering"><p className="eyebrow">{c.eng.eyebrow}</p><h2 className="gt">{c.eng.title}</h2>{c.eng.lines.map(l => <p className="body" key={l}>{l}</p>)}</div></div>
        <div className="cw right"><div className="copy" id="b-noise"><p className="eyebrow">{c.feat.eyebrow}</p><h2 className="gt">{c.feat.title}</h2><ul className="points">{c.feat.points.map(l => <li key={l}>{l}</li>)}</ul></div></div>
        <div className={'cw ' + soundSide}><div className="copy" id="b-sound"><p className="eyebrow">{c.sound.eyebrow}</p><h2 className="gt">{c.sound.title}</h2>{c.sound.lines.map(l => <p className="body" key={l}>{l}</p>)}</div></div>
        <div className="cw bottom"><div className="copy" id="b-cta"><h2 className="gt">{c.cta.title[0]}<br />{c.cta.title[1]}</h2><p className="sub small">{c.cta.sub}</p><div className="ctas"><a className="btn grad" href="#buy" onClick={e => { e.preventDefault(); go('buy') }}>Experience {product.name}</a><a className="link" href="#specs" onClick={e => { e.preventDefault(); go('specs') }}>See full specs <span aria-hidden="true">&rarr;</span></a></div><p className="micro">{c.cta.micro}</p></div></div>
        <ol className="dots" aria-label="Story progress">{SECTIONS.map((s, i) => <li key={s} className={i === sec ? 'on' : ''}><button onClick={() => toProgress([0, 0.22, 0.48, 0.72, 0.97][i])} aria-label={s}><span>{s}</span><i /></button></li>)}</ol>
        <div className="hint" aria-hidden="true"><span>Scroll</span><i /></div>
      </div></section>
      <section id="specs" className="sec alt"><div className="wrap"><p className="eyebrow">Specs</p><h2 className="gt big">{product.specsTitle}</h2><div className="cards">{product.specs.map(([t, d]) => <article key={t} className="card"><h3>{t}</h3><p>{d}</p></article>)}</div></div></section>
      <section id="range" className="sec"><div className="wrap"><p className="eyebrow">Explore the range</p><h2 className="gt big">More from the Sony sound family.</h2><p className="body rangeintro">Tap any product to watch it come apart and go back together, with the same story and the same bass.</p>
        <div className="range">{PRODUCTS.map(p => <a key={p.id} href={hashFor(p.id)} className={'pcard' + (p.id === pid ? ' cur' : '')} aria-current={p.id === pid ? 'page' : undefined} onClick={e => { if (p.id === pid) { e.preventDefault(); go('story') } }}>
          <div className="pimg">{thumbs[p.id] ? <img src={thumbs[p.id]} alt="" /> : <span className="pph">{p.category}</span>}</div>
          <div className="pmeta"><span className="pcat">{p.category}</span><h3>{p.name}</h3><p>{p.blurb}</p><span className="pgo">{p.id === pid ? 'You are here' : 'Experience it'} <span aria-hidden="true">&rarr;</span></span></div></a>)}</div></div></section>
      <section id="buy" className="sec alt"><div className="wrap center"><p className="eyebrow">Buy</p><h2 className="gt big">Ready when you are.</h2><p className="body">Experience the {product.category.toLowerCase()} for yourself.</p><div className="ctas"><a className="btn grad" href="https://www.sony.com" target="_blank" rel="noopener">Visit Sony</a><a className="btn ghost" href="#/" onClick={e => { e.preventDefault(); go('story') }}>Watch it again</a></div></div></section>
      <footer className="foot"><p>Unofficial concept page created for design practice. Not affiliated with, authorised or endorsed by Sony. Product names belong to their owners. All claims and specifications here are illustrative: please see Sony for official information.</p></footer>
    </>
  );
}
