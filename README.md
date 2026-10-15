# site-tour – geführte Tour für alle Demos auf umut-aslan.dev

Eine kleine, framework-unabhängige Bibliothek (TypeScript, Shadow DOM, ~20 KB): Beim ersten Besuch führt ein Maskottchen
mit Sprechblase durch die Seite. Alles außer dem erklärten Element ist abgedunkelt und nicht klickbar; die Tour erklärt
zuerst das **Problem**, dann jede Funktion, zum Schluss den **Nutzen**.

Eingesetzt in sieben Seiten mit sechs Frameworks: Astro (Portfolio, MAUI-Showcase), SvelteKit (Einsatz), React (ERP-Cockpit),
Angular (Lager-Scan), Vue (Maschinen-Monitor), Blazor (Kalkulation). Jede Seite bindet sie mit **einem Script-Tag** ein.

## Verwendung

```html
<script type="module" src="/tour.js"></script>
```

```js
// tour.js der jeweiligen Seite – nur Texte und Ziele, die Mechanik kommt aus site-tour.js
import { startTours } from '/site-tour.js';

startTours([{
  id: 'erp',                                  // Speicher-Schlüssel: site-tour:erp
  steps: [
    { title: 'Kurz zum Problem', mood: 'worried', text: 'Ausgewertet wird **von Hand** …' },
    { target: '[data-tour="kpis"]', title: 'Die wichtigsten Zahlen', text: '…' },
    { path: '/import', target: '[data-tour="samples"]', title: 'Der Import', text: '…' },
    { title: 'Warum das hilft', mood: 'celebrate', text: '- **Sekunden** statt Stunden …' },
  ],
}]);
```

| Schritt-Option | Wirkung |
|---|---|
| `target` | CSS-Selektor des Elements; ohne Ziel steht die Sprechblase in der Mitte |
| `path` | Seite des Schritts – die Tour navigiert dorthin (über einen Link, sonst per Seitenladen und macht danach weiter) |
| `click` | vor dem Schritt anklicken (Zeile öffnen, Tab wechseln) |
| `interactive` | das Ziel bleibt bedienbar („Probieren Sie es aus“) |
| `advanceOnClick` | Klick aufs Ziel führt weiter – auch über ein Formular mit Seitenladen hinweg (Anmeldung) |
| `when` | Schritt nur zeigen, wenn die Bedingung gilt (Rolle, Seite); sonst still überspringen |
| `mood` | Gesichtsausdruck: `happy`, `curious`, `worried`, `pointing`, `celebrate` |
| `wait`, `padding`, `nextLabel` | Wartezeit auf das Ziel, Abstand der Hervorhebung, Text des Hauptknopfs |

Text-Markup: Leerzeile = Absatz, `- ` = Liste, `**fett**`, `[Link](/pfad)` – gerendert ohne `innerHTML`.

## Verhalten

- **Erster Besuch:** startet von selbst; „Überspringen“ oder „Fertig“ wird pro Browser und Seite in `localStorage` gemerkt
  (kein Cookie, nichts verlässt den Browser). Ein runder Knopf unten links startet die Tour erneut.
- **Seitenwechsel:** Fortschritt in `sessionStorage` – nach einem Neuladen geht es am selben Schritt weiter.
- **Robust:** wartet auf nachgeladene Daten, findet Elemente wieder, die das Framework ersetzt (Blazor-Prerendering),
  positioniert bei Scrollen, Größenänderung und Layout-Verschiebung neu; auf dem Handy wird die Sprechblase zum Bottom-Sheet.
- **Barrierearm:** Dialog mit `aria-modal`, Fokus bleibt in der Sprechblase, Tastatur (Pfeile, Esc), `prefers-reduced-motion`.
- **Automatisierte Browser** (Tests, Vorschau-Dienste) bekommen keine Tour, außer die Adresse enthält `?tour=start`.

## Tests

`./test-e2e.sh` – Unit-Tests (Vitest) und Browser-Tests (Playwright) gegen die Demo-Seiten in `demo/`: erster Besuch,
Überspringen wird gemerkt, Blockieren vs. interaktive Ziele, Scrollen, späte Daten, fehlende Ziele, Seitenwechsel mit
Fortsetzen, ersetzte Elemente, Tastatur, Handy-Layout.

Jedes Projekt hat zusätzlich einen `tour.spec.ts`, der seine Tour **Schritt für Schritt durchklickt** – fehlt ein Ziel nach einer
Änderung der Oberfläche, schlägt der Test fehl.

## Verteilen

`./sync.sh [projekt]` baut die Bibliothek und kopiert `site-tour.js` in die Projekte (jede Seite liefert ihre eigene Kopie aus:
kein fremder Origin, passt zu jeder Content-Security-Policy, funktioniert offline in den PWAs).
`tools/tour-shots.mjs` macht Screenshots jedes Schritts zur Sichtkontrolle.

---
Ein Projekt von [Umut Aslan](https://umut-aslan.dev)
