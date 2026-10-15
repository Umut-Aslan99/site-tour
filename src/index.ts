import { mascotSvg } from './mascot';
import { css } from './styles';
import { Tour, onPath, type TourOptions, type TourStep } from './tour';

export { Tour, type TourOptions, type TourStep };

export interface StartOptions {
  /** Where the round "replay the tour" button sits; false hides it. */
  launcher?: 'left' | 'right' | false;
  /** Automated browsers (tests, screenshot and link-preview services) get no tour unless the URL asks for it
   *  with ?tour=start. Set to 'run' to treat them like people (the library's own tests). */
  automated?: 'skip' | 'run';
}

/**
 * Registers the tours of a site. On the first visit (per browser) the tour of the current page starts by itself;
 * after a page load in the middle of a tour it continues; the launcher button replays it any time.
 */
export function startTours(tours: TourOptions[], options: StartOptions = {}): { tours: Tour[]; start: () => void } {
  const all = tours.map((t) => new Tour(t));
  const forPage = () => all.find((t) => t.options.when?.() ?? true);
  let active: Tour | undefined;
  let launcher: HTMLElement | undefined;

  const begin = (tour: Tour, from = 0) => {
    if (active?.running) return;
    active = tour;
    setLauncher(false);
    tour.onClose = () => setLauncher(true);
    tour.start(from);
  };

  const consider = () => {
    if (active?.running) return;
    const resuming = all.find((t) => t.resumeAt !== null);
    if (resuming) { begin(resuming, resuming.resumeAt ?? 0); return; }
    const t = forPage();
    if (t && !t.seen && t.options.autoStart !== false) begin(t);
  };

  function setLauncher(visible: boolean) {
    if (options.launcher === false) return;
    if (!launcher) {
      launcher = document.createElement('div');
      launcher.setAttribute('data-site-tour-launcher', '');
      const shadow = launcher.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = css;
      const btn = document.createElement('button');
      btn.className = `launcher ${options.launcher ?? 'left'}`;
      btn.type = 'button';
      const de = (document.documentElement.lang || 'de').startsWith('de');
      const label = de ? 'Tour starten' : 'Start the tour';
      btn.setAttribute('aria-label', label);
      btn.dataset.testid = 'tour-launcher';
      btn.innerHTML = mascotSvg('happy');
      const tip = document.createElement('span');
      tip.className = 'tip';
      tip.textContent = de ? 'Tour noch einmal ansehen' : 'Take the tour again';
      btn.append(tip);
      btn.addEventListener('click', () => { const t = forPage(); if (t) begin(t); });
      shadow.append(style, btn);
      document.body.append(launcher);
    }
    launcher.hidden = !visible || !forPage();
  }

  const run = () => {
    const params = new URLSearchParams(location.search);
    const requested = params.get('tour') === 'start';
    if (requested) {
      params.delete('tour');
      const query = params.toString();
      history.replaceState(history.state, '', location.pathname + (query ? `?${query}` : '') + location.hash);
    }
    if (navigator.webdriver && options.automated !== 'run' && !requested && !all.some((t) => t.resumeAt !== null)) return;
    if (requested) { const t = forPage(); if (t) begin(t); } else consider();
    if (!active?.running) setLauncher(true);
    // Single-page apps change the page without a load: check again when the path changes.
    let path = location.pathname;
    setInterval(() => {
      if (location.pathname === path) return;
      path = location.pathname;
      if (!active?.running) { setLauncher(true); consider(); }
    }, 400);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();

  return { tours: all, start: () => { const t = forPage(); if (t) begin(t); } };
}

export { onPath };
