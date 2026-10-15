import { renderText } from '../src/text';

const html = (s: string) => {
  const d = document.createElement('div');
  d.append(renderText(s));
  return d.innerHTML;
};

describe('renderText', () => {
  it('builds paragraphs, lists, bold and links', () => {
    expect(html('Das **Problem**: Excel.\n\n- eins\n- zwei')).toBe('<p>Das <strong>Problem</strong>: Excel.</p><ul><li>eins</li><li>zwei</li></ul>');
    expect(html('Mehr auf [der Seite](/angebote).')).toBe('<p>Mehr auf <a href="/angebote">der Seite</a>.</p>');
    expect(html('[Portfolio](https://umut-aslan.dev)')).toBe('<p><a href="https://umut-aslan.dev" target="_blank" rel="noopener">Portfolio</a></p>');
  });

  it('never creates markup from the text itself', () => {
    expect(html('<img src=x onerror=alert(1)>')).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    expect(html('[klick](javascript:alert(1))')).toBe('<p>[klick](javascript:alert(1))</p>');
  });
});
