/**
 * Tiny, safe markup for tour texts – no innerHTML: paragraphs (blank line), lists ("- "), **bold** and [links](url).
 * Tour texts are our own, but rendering them as text keeps the library safe to reuse anywhere.
 */
export function renderText(source: string, doc: Document = document): DocumentFragment {
  const out = doc.createDocumentFragment();
  for (const block of source.trim().split(/\n\s*\n/)) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0 && lines.every((l) => l.startsWith('- '))) {
      const ul = doc.createElement('ul');
      for (const line of lines) {
        const li = doc.createElement('li');
        li.append(inline(line.slice(2), doc));
        ul.append(li);
      }
      out.append(ul);
    } else {
      const p = doc.createElement('p');
      p.append(inline(lines.join(' '), doc));
      out.append(p);
    }
  }
  return out;
}

const TOKEN = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string, doc: Document): DocumentFragment {
  const frag = doc.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) frag.append(text.slice(last, m.index));
    if (m[1] !== undefined) {
      const b = doc.createElement('strong');
      b.textContent = m[1];
      frag.append(b);
    } else if (m[2] !== undefined && m[3] !== undefined && /^(https?:\/\/|\/)/.test(m[3])) {
      const a = doc.createElement('a');
      a.textContent = m[2];
      a.href = m[3];
      if (m[3].startsWith('http')) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      frag.append(a);
    } else {
      frag.append(m[0]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.append(text.slice(last));
  return frag;
}
