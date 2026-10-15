import { mascotSvg, type Mood } from './mascot';
import { css } from './styles';
import { renderText } from './text';

export interface TourStep {
  /** CSS selector of the element to highlight; without one the bubble is centered (intro, summary). */
  target?: string;
  title: string;
  /** Short markup: blank line = paragraph, "- " = list item, **bold**, [link](/path). */
  text: string;
  mood?: Mood;
  /** Page this step belongs to. The tour navigates there first (via a link on the page if there is one). */
  path?: string;
  /** Click this element before the step is shown – e.g. open a tab or a row. */
  click?: string;
  /** The highlighted element stays usable ("try it yourself"). Everything else is still blocked. */
  interactive?: boolean;
  /** Clicking the highlighted element moves on to the next step – also across a full page load (e.g. a sign-in form). */
  advanceOnClick?: boolean;
  /** Label of the main button instead of "Weiter". */
  nextLabel?: string;
  padding?: number;
  /** How long to wait for the target in ms (data may still be loading). */
  wait?: number;
  /** Show this step only if this returns true (e.g. only on the sign-in page, only for some roles); otherwise skip it silently. */
  when?: () => boolean;
}

export interface TourOptions {
  id: string;
  steps: TourStep[];
  lang?: 'de' | 'en';
  /** The tour belongs to pages where this returns true (several tours per site are possible). */
  when?: () => boolean;
  autoStart?: boolean;
}

const LABELS = {
  de: { skip: 'Tour überspringen', skipShort: 'Überspringen', back: 'Zurück', next: 'Weiter', start: 'Los geht’s', done: 'Fertig', step: (i: number, n: number) => `Schritt ${i} von ${n}`, welcome: 'Willkommen' },
  en: { skip: 'Skip tour', skipShort: 'Skip', back: 'Back', next: 'Next', start: 'Let’s go', done: 'Done', step: (i: number, n: number) => `Step ${i} of ${n}`, welcome: 'Welcome' },
};

type Rect = { top: number; left: number; width: number; height: number };
const MOBILE = 640;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Waits until a selector matches a visible element (data may still be loading); null after the timeout. */
export async function waitFor(selector: string, timeout = 5000): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el && (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)) return el;
    if (Date.now() > deadline) return null;
    await sleep(80);
  }
}

export class Tour {
  readonly options: TourOptions;
  private readonly labels: (typeof LABELS)['de'];
  private host?: HTMLElement;
  private root?: ShadowRoot;
  private els!: { layer: HTMLElement; spot: HTMLElement; blocks: HTMLElement[]; bubble: HTMLElement; mascot: HTMLElement; speech: HTMLElement };
  private index = -1;
  private seq = 0;
  private target: HTMLElement | null = null;
  private observer?: ResizeObserver;
  private frame = 0;
  private cleanup: (() => void)[] = [];
  onClose?: () => void;

  constructor(options: TourOptions) {
    this.options = options;
    this.labels = LABELS[options.lang ?? 'de'];
  }

  get running(): boolean { return this.index >= 0; }
  get current(): number { return this.index; }
  private get doneKey() { return `site-tour:${this.options.id}`; }
  private get resumeKey() { return `site-tour:${this.options.id}:step`; }

  /** Finished or skipped in this browser before. */
  get seen(): boolean { return safe(() => localStorage.getItem(this.doneKey)) !== null; }
  /** Step to continue with after a page load during the tour, if any. */
  get resumeAt(): number | null {
    const v = safe(() => sessionStorage.getItem(this.resumeKey));
    return v === null || v === undefined ? null : Number(v);
  }

  start(from = 0): void {
    this.mount();
    void this.show(Math.max(0, Math.min(from, this.options.steps.length - 1)), 1);
  }

  next(): void {
    if (this.index >= this.options.steps.length - 1) this.close('done');
    else void this.show(this.index + 1, 1);
  }

  back(): void {
    if (this.index > 0) void this.show(this.index - 1, -1);
  }

  skip(): void { this.close('skipped'); }

  close(result: 'done' | 'skipped'): void {
    safe(() => localStorage.setItem(this.doneKey, result));
    safe(() => sessionStorage.removeItem(this.resumeKey));
    this.seq++;
    this.index = -1;
    this.detach();
    this.host?.remove();
    this.host = undefined;
    document.removeEventListener('keydown', this.onKey, true);
    this.onClose?.();
  }

  private mount(): void {
    if (this.host) return;
    this.host = document.createElement('div');
    this.host.setAttribute('data-site-tour', this.options.id);
    this.root = this.host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    const layer = el('div', 'layer');
    const blocks = [0, 1, 2, 3].map(() => el('div', 'block'));
    const spot = el('div', 'spot');
    const bubble = el('section', 'bubble');
    bubble.setAttribute('role', 'dialog');
    bubble.setAttribute('aria-modal', 'true');
    bubble.setAttribute('aria-labelledby', 'tour-title');
    bubble.setAttribute('aria-describedby', 'tour-text');
    bubble.tabIndex = -1;
    const mascot = el('div', 'mascot');
    const speech = el('div', 'speech');
    bubble.append(mascot, speech);
    layer.append(...blocks, spot, bubble);
    this.root.append(style, layer);
    for (const b of blocks) b.addEventListener('click', () => this.nudge());
    document.body.append(this.host);
    document.addEventListener('keydown', this.onKey, true);
    this.els = { layer, spot, blocks, bubble, mascot, speech };
  }

  private async show(i: number, dir: 1 | -1): Promise<void> {
    const token = ++this.seq;
    const step = this.options.steps[i];
    if (!step) return;
    this.detach();
    this.index = i;
    safe(() => sessionStorage.setItem(this.resumeKey, String(i)));

    if (step.when && !step.when()) {
      const nextIndex = i + dir;
      if (nextIndex < 0 || nextIndex >= this.options.steps.length) this.close('done');
      else void this.show(nextIndex, dir);
      return;
    }
    if (step.path && !onPath(step.path)) {
      const reloading = await navigate(step.path);
      if (reloading || token !== this.seq) return;
    }
    if (step.click) (await waitFor(step.click, step.wait ?? 5000))?.click();

    let target: HTMLElement | null = null;
    if (step.target) {
      target = await waitFor(step.target, step.wait ?? 5000);
      if (token !== this.seq) return;
      if (!target) {
        console.warn(`[site-tour] ${this.options.id}: step ${i + 1} „${step.title}“ – ${step.target} not found, skipped`);
        const nextIndex = i + dir;
        if (nextIndex < 0 || nextIndex >= this.options.steps.length) this.close('done');
        else void this.show(nextIndex, dir);
        return;
      }
    }
    this.target = target;
    this.render(step, i);
    // Hidden while the page scrolls to the target, then shown in place (no bubble flying across stale positions).
    this.els.bubble.classList.add('moving');
    if (target) await this.bringIntoView(target);
    if (token !== this.seq) return;
    this.position();
    this.els.bubble.classList.remove('moving');
    this.attach(step, target, i);
    this.els.speech.querySelector<HTMLButtonElement>('button.primary')?.focus({ preventScroll: true });
  }

  private render(step: TourStep, i: number): void {
    const n = this.options.steps.length;
    const L = this.labels;
    const last = i === n - 1;
    const s = this.els.speech;
    s.replaceChildren();
    const kicker = el('p', 'kicker');
    kicker.textContent = i === 0 && !step.target ? L.welcome : L.step(i + 1, n);
    const title = el('h2');
    title.id = 'tour-title';
    title.textContent = step.title;
    const text = el('div', 'text');
    text.id = 'tour-text';
    text.append(renderText(step.text));
    const controls = el('div', 'controls');
    if (!last) {
      const skip = button('', 'link', () => this.skip(), 'tour-skip');
      const full = el('span', 'full');
      full.textContent = L.skip;
      const short = el('span', 'short');
      short.textContent = L.skipShort;
      skip.append(full, short);
      controls.append(skip);
    }
    controls.append(el('span', 'grow'));
    if (i > 0) controls.append(button(L.back, '', () => this.back(), 'tour-back'));
    const nextLabel = step.nextLabel ?? (last ? L.done : i === 0 ? L.start : L.next);
    if (!(step.advanceOnClick && step.interactive)) controls.append(button(nextLabel, 'primary', () => this.next(), 'tour-next'));
    const dots = el('div', 'dots');
    for (let d = 0; d < n; d++) dots.append(el('span', d === i ? 'dot on' : 'dot'));
    s.append(kicker, title, text, controls, dots);
    this.els.mascot.innerHTML = mascotSvg(step.mood ?? (i === 0 ? 'happy' : last ? 'celebrate' : 'pointing'));
    this.els.bubble.setAttribute('data-step', String(i + 1));
  }

  private async bringIntoView(target: HTMLElement): Promise<void> {
    const r = target.getBoundingClientRect();
    const vh = innerHeight;
    const reserve = innerWidth < MOBILE ? Math.min(this.els.bubble.offsetHeight || 260, vh * 0.55) + 16 : 40;
    if (r.top >= 72 && r.bottom <= vh - reserve) return;
    const behavior: ScrollBehavior = reducedMotion() ? 'auto' : 'smooth';
    if (innerWidth < MOBILE) {
      target.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      const r2 = target.getBoundingClientRect();
      scrollBy({ top: r2.top - 76, behavior });
    } else {
      target.scrollIntoView({ block: r.height > vh * 0.6 ? 'start' : 'center', behavior });
    }
    await scrollEnd();
  }

  private position = (): void => {
    if (!this.host) return;
    const { spot, bubble, blocks } = this.els;
    const sel = this.options.steps[this.index]?.target;
    if (this.target && !this.target.isConnected && sel) {
      // Frameworks may replace the element (e.g. Blazor taking over the prerendered page): find it again.
      const fresh = document.querySelector<HTMLElement>(sel);
      if (fresh) {
        this.target = fresh;
        this.observer?.observe(fresh);
      }
    }
    const vw = innerWidth;
    const vh = innerHeight;
    const step = this.options.steps[this.index];
    const target = this.target;
    const mobile = vw < MOBILE;
    bubble.classList.toggle('sheet', mobile);

    if (!target) {
      spot.classList.add('none');
      place(blocks[0]!, { top: 0, left: 0, width: vw, height: vh });
      for (const b of blocks.slice(1)) place(b, { top: 0, left: 0, width: 0, height: 0 });
      if (!mobile) {
        bubble.style.left = `${Math.max(12, (vw - bubble.offsetWidth) / 2)}px`;
        bubble.style.top = `${Math.max(12, (vh - bubble.offsetHeight) / 2)}px`;
      }
      this.look(0, 0);
      return;
    }

    spot.classList.remove('none');
    const pad = step?.padding ?? 8;
    const r = target.getBoundingClientRect();
    const top = Math.max(r.top - pad, 4);
    const bottom = Math.min(r.bottom + pad, vh - 4);
    const s: Rect = { top, left: Math.max(r.left - pad, 4), width: Math.min(r.width + 2 * pad, vw - 8), height: Math.max(bottom - top, 0) };
    place(spot, s);

    if (step?.interactive) {
      // Four blocks around the hole: the highlighted element stays clickable, nothing else.
      place(blocks[0]!, { top: 0, left: 0, width: vw, height: s.top });
      place(blocks[1]!, { top: s.top + s.height, left: 0, width: vw, height: Math.max(vh - s.top - s.height, 0) });
      place(blocks[2]!, { top: s.top, left: 0, width: s.left, height: s.height });
      place(blocks[3]!, { top: s.top, left: s.left + s.width, width: Math.max(vw - s.left - s.width, 0), height: s.height });
    } else {
      place(blocks[0]!, { top: 0, left: 0, width: vw, height: vh });
      for (const b of blocks.slice(1)) place(b, { top: 0, left: 0, width: 0, height: 0 });
    }

    if (mobile) {
      const b = bubble.getBoundingClientRect();
      this.look((s.left + s.width / 2 - (b.left + 30)) / vw, (s.top + s.height / 2 - (b.top + 30)) / vh);
      return;
    }
    const w = bubble.offsetWidth;
    const h = bubble.offsetHeight;
    const gap = 16;
    const fitsBelow = s.top + s.height + gap + h <= vh - 8;
    const fitsAbove = s.top - gap - h >= 8;
    const fitsRight = s.left + s.width + gap + w <= vw - 8;
    const fitsLeft = s.left - gap - w >= 8;
    let left: number;
    let topPx: number;
    if (fitsBelow || fitsAbove) {
      topPx = fitsBelow ? s.top + s.height + gap : s.top - gap - h;
      left = clamp(s.left + Math.min(s.width / 2, 120) - 40, 12, vw - w - 12);
    } else if (fitsRight || fitsLeft) {
      left = fitsRight ? s.left + s.width + gap : s.left - gap - w;
      topPx = clamp(s.top + s.height / 2 - h / 2, 12, vh - h - 12);
    } else {
      // Large element: the bubble sits on top of it, at the bottom of the screen.
      left = clamp(s.left + 24, 12, vw - w - 12);
      topPx = vh - h - 16;
    }
    bubble.style.left = `${left}px`;
    bubble.style.top = `${topPx}px`;
    this.look((s.left + s.width / 2 - (left + 38)) / vw, (s.top + s.height / 2 - (topPx + h - 38)) / vh);
  };

  /** The mascot looks towards the highlighted element. */
  private look(dx: number, dy: number): void {
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, len * 4);
    this.els.mascot.style.setProperty('--look-x', `${((dx / len) * 1.6 * k).toFixed(2)}px`);
    this.els.mascot.style.setProperty('--look-y', `${((dy / len) * 1.6 * k).toFixed(2)}px`);
  }

  private attach(step: TourStep, target: HTMLElement | null, i: number): void {
    const schedule = () => {
      cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(this.position);
    };
    addEventListener('resize', schedule);
    addEventListener('scroll', schedule, true);
    // Layout can also shift without a resize (late data, re-rendering): check twice a second.
    const timer = setInterval(schedule, 500);
    this.cleanup.push(() => removeEventListener('resize', schedule), () => removeEventListener('scroll', schedule, true), () => clearInterval(timer));
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(schedule);
      this.observer.observe(document.body);
      if (target) this.observer.observe(target);
    }
    if (target && step.interactive && step.advanceOnClick) {
      const onClick = async () => {
        // Survives a full page load (form post); in a single-page app we move on ourselves – once the page has changed.
        safe(() => sessionStorage.setItem(this.resumeKey, String(i + 1)));
        const from = location.href;
        const deadline = Date.now() + 10_000;
        while (location.href === from && Date.now() < deadline) await sleep(100);
        await sleep(300);
        if (this.index === i) this.next();
      };
      target.addEventListener('click', onClick, true);
      this.cleanup.push(() => target.removeEventListener('click', onClick, true));
    }
  }

  private detach(): void {
    this.observer?.disconnect();
    cancelAnimationFrame(this.frame);
    for (const c of this.cleanup.splice(0)) c();
  }

  private nudge(): void {
    const b = this.els.bubble;
    b.classList.remove('nudge');
    void b.offsetWidth;
    b.classList.add('nudge');
  }

  private onKey = (e: KeyboardEvent): void => {
    if (!this.running) return;
    if (e.key === 'Escape') { e.preventDefault(); this.skip(); return; }
    const inField = e.composedPath().some((n) => n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement || n instanceof HTMLSelectElement);
    if (e.key === 'ArrowRight' && !inField) { e.preventDefault(); this.next(); return; }
    if (e.key === 'ArrowLeft' && !inField) { e.preventDefault(); this.back(); return; }
    if (e.key === 'Tab') {
      // Keep keyboard focus inside the speech bubble (and the highlighted element on interactive steps).
      const step = this.options.steps[this.index];
      const buttons = [...this.els.speech.querySelectorAll<HTMLElement>('button, a[href]')];
      const inTarget = step?.interactive && this.target?.contains(document.activeElement);
      if (inTarget || buttons.length === 0) return;
      const active = this.root?.activeElement as HTMLElement | null;
      const pos = active ? buttons.indexOf(active) : -1;
      e.preventDefault();
      const nextPos = pos < 0 ? 0 : (pos + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      buttons[nextPos]?.focus();
    }
  };
}

function el(tag: string, cls?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function button(label: string, cls: string, onClick: () => void, testId: string): HTMLButtonElement {
  const b = el('button', cls) as HTMLButtonElement;
  b.type = 'button';
  b.textContent = label;
  b.dataset.testid = testId;
  b.addEventListener('click', onClick);
  return b;
}

function place(e: HTMLElement, r: Rect): void {
  e.style.top = `${r.top}px`;
  e.style.left = `${r.left}px`;
  e.style.width = `${r.width}px`;
  e.style.height = `${r.height}px`;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, Math.max(lo, hi)));

function safe<T>(f: () => T): T | undefined {
  try { return f(); } catch { return undefined; }
}

export function onPath(path: string): boolean {
  const want = new URL(path, location.href);
  return want.pathname === location.pathname && (!want.search || want.search === location.search);
}

/** Navigates like a visitor would: via a link on the page (single-page apps route it), otherwise with a page load.
 *  Returns true if a full page load is under way – the tour resumes on the new page. */
async function navigate(path: string): Promise<boolean> {
  const want = new URL(path, location.href);
  const link = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].find((a) => {
    const u = new URL(a.href, location.href);
    return u.origin === location.origin && u.pathname === want.pathname && u.search === want.search && !a.target && !a.hasAttribute('download');
  });
  if (link) {
    link.click();
    const deadline = Date.now() + 4000;
    while (Date.now() < deadline) {
      if (onPath(path)) return false;
      await sleep(60);
    }
  }
  location.assign(want.href);
  return true;
}

function scrollEnd(): Promise<void> {
  return new Promise((resolve) => {
    let timer = setTimeout(done, 120);
    function onScroll() {
      clearTimeout(timer);
      timer = setTimeout(done, 120);
    }
    function done() {
      removeEventListener('scroll', onScroll, true);
      resolve();
    }
    addEventListener('scroll', onScroll, true);
  });
}
