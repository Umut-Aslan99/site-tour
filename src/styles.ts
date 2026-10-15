/** Styles live inside the shadow root: the host page cannot break the tour, the tour cannot break the page.
 *  Fonts and colors come from the host's design tokens (custom properties inherit into shadow DOM) with fallbacks. */
export const css = `
:host([hidden]) { display: none !important; }
:host { all: initial; font-family: var(--font-body, 'Inter Variable', ui-sans-serif, system-ui, sans-serif); color: #16161a; }
* { box-sizing: border-box; }
.layer { position: fixed; inset: 0; z-index: 2147483000; pointer-events: none; }
.block { position: fixed; background: transparent; pointer-events: auto; }
.spot { position: fixed; border-radius: 12px; pointer-events: none; box-shadow: 0 0 0 200vmax rgb(8 8 10 / 0.74), 0 0 0 3px var(--accent, #e8834a), 0 0 28px 6px rgb(232 131 74 / 0.45);
  transition: top .35s cubic-bezier(.2,.7,.1,1), left .35s cubic-bezier(.2,.7,.1,1), width .35s cubic-bezier(.2,.7,.1,1), height .35s cubic-bezier(.2,.7,.1,1); }
.spot.none { box-shadow: 0 0 0 200vmax rgb(8 8 10 / 0.74); width: 0 !important; height: 0 !important; top: 50% !important; left: 50% !important; }
.bubble { position: fixed; display: flex; align-items: flex-end; gap: 10px; width: min(500px, calc(100vw - 24px)); pointer-events: auto;
  transition: top .35s cubic-bezier(.2,.7,.1,1), left .35s cubic-bezier(.2,.7,.1,1); outline: none; }
.mascot { flex: none; width: 76px; height: 76px; filter: drop-shadow(0 6px 14px rgb(0 0 0 / .35)); animation: bob 3.2s ease-in-out infinite; }
.mascot svg { width: 100%; height: 100%; display: block; }
.speech { position: relative; flex: 1; min-width: 0; background: #fffdf8; border-radius: 16px; padding: 16px 18px 14px; box-shadow: 0 18px 50px -12px rgb(0 0 0 / .6);
  border: 1px solid rgb(0 0 0 / .06); }
.speech::before { content: ''; position: absolute; left: -9px; bottom: 22px; width: 18px; height: 18px; background: #fffdf8; transform: rotate(45deg);
  border-left: 1px solid rgb(0 0 0 / .06); border-bottom: 1px solid rgb(0 0 0 / .06); border-radius: 0 0 0 4px; }
.kicker { margin: 0 0 4px; font: 600 11px/1.2 var(--font-mono, ui-monospace, monospace); letter-spacing: .08em; text-transform: uppercase; color: #8a5a3a; }
h2 { margin: 0 0 6px; font: 600 18px/1.25 var(--font-display, 'Space Grotesk Variable', ui-sans-serif, system-ui, sans-serif); color: #121214; letter-spacing: -.01em; }
.text { font-size: 14.5px; line-height: 1.55; color: #2c2b29; max-height: min(42vh, 360px); overflow-y: auto; }
.text p { margin: 0 0 8px; }
.text ul { margin: 0 0 8px; padding-left: 20px; }
.text li { margin: 2px 0; }
.text strong { color: #121214; }
.text a { color: #b4521f; }
.controls { display: flex; align-items: center; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.grow { flex: 1; }
button { font: 600 13.5px/1 var(--font-body, ui-sans-serif, system-ui, sans-serif); border-radius: 999px; padding: 9px 14px; cursor: pointer; border: 1px solid rgb(0 0 0 / .14);
  background: transparent; color: #2c2b29; }
button:hover { border-color: rgb(0 0 0 / .35); }
button:focus-visible { outline: 3px solid var(--accent, #e8834a); outline-offset: 2px; }
button.primary { background: var(--accent, #e8834a); border-color: var(--accent, #e8834a); color: #1a0d05; }
button.link { border: 0; padding: 9px 4px; color: #6b6964; font-weight: 500; text-decoration: underline; text-underline-offset: 3px; }
.dots { display: flex; gap: 5px; margin-top: 10px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: rgb(0 0 0 / .15); }
.dot.on { background: var(--accent, #e8834a); width: 16px; border-radius: 3px; }
.launcher { position: fixed; z-index: 2147482000; bottom: 16px; width: 54px; height: 54px; padding: 4px; border-radius: 50%; background: #16161a;
  border: 2px solid var(--accent, #e8834a); box-shadow: 0 10px 24px -8px rgb(0 0 0 / .6); display: grid; place-items: center; }
.launcher.left { left: 16px; }
.launcher.right { right: 16px; }
.launcher svg { width: 44px; height: 44px; }
.launcher .tip { position: absolute; bottom: calc(100% + 8px); white-space: nowrap; background: #16161a; color: #f4f1ea; padding: 6px 10px; border-radius: 8px;
  font: 500 12px/1 var(--font-body, system-ui); opacity: 0; transform: translateY(4px); transition: opacity .2s, transform .2s; pointer-events: none; }
.launcher.left .tip { left: 0; }
.launcher.right .tip { right: 0; }
.launcher:hover .tip, .launcher:focus-visible .tip { opacity: 1; transform: none; }
.face { fill: #fbe7cf; stroke: #1b1b1f; stroke-width: 2; }
.cheek { fill: #f2a07a; opacity: .55; }
.eye { fill: #fff; stroke: #1b1b1f; stroke-width: 1.4; }
.pupils { transform: translate(var(--look-x, 0px), var(--look-y, 0px)); transition: transform .35s ease; }
.pupil { fill: #1b1b1f; }
.glint { fill: #fff; }
.eyes { transform-origin: 32px 31px; animation: blink 5.5s infinite; }
.eye-happy, .mouth, .brow { fill: none; stroke: #1b1b1f; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.mouth-o { fill: #1b1b1f; }
.mouth-open { fill: #7a2e1d; stroke: #1b1b1f; stroke-width: 2; stroke-linejoin: round; }
.hat { fill: var(--accent, #e8834a); stroke: #1b1b1f; stroke-width: 2; }
.brim { fill: var(--accent, #e8834a); stroke: #1b1b1f; stroke-width: 2; }
.hat-ridge { fill: #ffb37f; stroke: #1b1b1f; stroke-width: 1.4; }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
@keyframes blink { 0%, 94%, 100% { transform: scaleY(1); } 96% { transform: scaleY(.1); } }
@keyframes nudge { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
.bubble.nudge .speech { animation: nudge .3s ease; }
/* Phones: the speech bubble becomes a sheet at the bottom; the highlighted element is scrolled into the upper part. */
.bubble.sheet { left: 8px !important; right: 8px; bottom: 8px; top: auto !important; width: auto; }
.bubble.sheet .mascot { width: 58px; height: 58px; }
@media (prefers-reduced-motion: reduce) {
  .spot, .bubble, .pupils { transition: none; }
  .mascot, .eyes { animation: none; }
}
@media print { .layer, .launcher { display: none; } }
`;
