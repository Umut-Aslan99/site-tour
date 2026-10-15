import { startTours } from '../dist/site-tour.js';

window.siteTour = startTours([{
  id: 'demo',
  steps: [
    { title: 'Willkommen in der Demo-App', text: 'Das **Problem**: Niemand weiß, wo er klicken soll.\n\nIch zeige Ihnen in wenigen Schritten, was hier passiert.', mood: 'happy' },
    { target: '[data-tour="tiles"]', title: 'Kennzahlen auf einen Blick', text: 'Vier Kacheln mit den wichtigsten Zahlen.\n\n- Buchungen heute\n- Inventuren\n- Unter Mindestbestand', mood: 'pointing' },
    { target: '[data-tour="try"]', title: 'Probieren Sie es aus', text: 'Dieser Knopf ist jetzt **klickbar** – alles andere nicht.', interactive: true },
    { target: '[data-tour="table"]', title: 'Weit unten auf der Seite', text: 'Ich scrolle für Sie dorthin.', mood: 'curious' },
    { target: '[data-tour="late"]', title: 'Später geladen', text: 'Die Tour wartet, bis die Daten da sind.' },
    { target: '[data-tour="missing"]', title: 'Gibt es nicht', text: 'Dieser Schritt wird übersprungen.', wait: 500 },
    { path: '/demo/second.html', target: '[data-tour="second"]', title: 'Andere Seite', text: 'Die Tour wechselt die Seite selbst und macht dort weiter.', mood: 'worried' },
    { title: 'Fertig!', text: 'Das war’s. Über den runden Knopf unten links starten Sie die Tour neu. Mehr unter [umut-aslan.dev](https://umut-aslan.dev).' },
  ],
}]);
