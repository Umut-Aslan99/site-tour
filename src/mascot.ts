export type Mood = 'happy' | 'curious' | 'worried' | 'pointing' | 'celebrate';

const MOUTH: Record<Mood, string> = {
  happy: '<path class="mouth" d="M24 41 Q32 48 40 41" />',
  curious: '<ellipse class="mouth-o" cx="32" cy="43" rx="3.2" ry="3.8" />',
  worried: '<path class="mouth" d="M24 45 Q28 41 32 44 Q36 47 40 43" />',
  pointing: '<path class="mouth" d="M25 41 Q32 46 39 41" />',
  celebrate: '<path class="mouth-open" d="M22 39 Q32 52 42 39 Z" />',
};

const BROWS: Record<Mood, string> = {
  happy: '',
  curious: '<path class="brow" d="M20 24 Q24 21 28 23" /><path class="brow" d="M36 23 Q40 20 44 23" />',
  worried: '<path class="brow" d="M20 24 L28 22" /><path class="brow" d="M36 22 L44 24" />',
  pointing: '',
  celebrate: '',
};

/**
 * The tour guide: a round face with a hard hat (the demos are about machine builders).
 * Eyes follow the highlighted element via the --look-x/--look-y custom properties; the mood changes mouth and brows.
 */
export function mascotSvg(mood: Mood): string {
  const eyes = mood === 'celebrate'
    ? '<path class="eye-happy" d="M21 31 Q25 26 29 31" /><path class="eye-happy" d="M35 31 Q39 26 43 31" />'
    : `<g class="eyes"><ellipse class="eye" cx="25" cy="31" rx="4.2" ry="5" /><ellipse class="eye" cx="39" cy="31" rx="4.2" ry="5" />
         <g class="pupils"><circle class="pupil" cx="25" cy="31" r="2.3" /><circle class="pupil" cx="39" cy="31" r="2.3" />
         <circle class="glint" cx="26.2" cy="29.6" r="0.8" /><circle class="glint" cx="40.2" cy="29.6" r="0.8" /></g></g>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" data-mood="${mood}">
    <circle class="face" cx="32" cy="35" r="22" />
    <ellipse class="cheek" cx="17.5" cy="40" rx="3.6" ry="2.2" /><ellipse class="cheek" cx="46.5" cy="40" rx="3.6" ry="2.2" />
    ${eyes}${BROWS[mood]}${MOUTH[mood]}
    <path class="hat" d="M12 22 Q12 7 32 7 Q52 7 52 22 Z" />
    <rect class="brim" x="8" y="20" width="48" height="5" rx="2.5" />
    <rect class="hat-ridge" x="29.5" y="7.5" width="5" height="13" rx="2" />
  </svg>`;
}
