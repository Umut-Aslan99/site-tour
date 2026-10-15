import { Tour, waitFor } from '../src/tour';

describe('Tour state', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); document.body.innerHTML = ''; });

  const tour = () => new Tour({ id: 't', steps: [{ title: 'A', text: 'a' }, { title: 'B', text: 'b' }] });

  it('is unseen until finished or skipped, and remembers where it was during a page load', () => {
    const t = tour();
    expect(t.seen).toBe(false);
    sessionStorage.setItem('site-tour:t:step', '1');
    expect(t.resumeAt).toBe(1);
    t.close('skipped');
    expect(t.seen).toBe(true);
    expect(localStorage.getItem('site-tour:t')).toBe('skipped');
    expect(t.resumeAt).toBeNull();
  });

  it('removes itself from the page when closed', () => {
    const t = tour();
    t.start();
    expect(document.querySelector('[data-site-tour="t"]')).not.toBeNull();
    t.close('done');
    expect(document.querySelector('[data-site-tour="t"]')).toBeNull();
    expect(t.running).toBe(false);
  });

  it('waits for elements that appear later and gives up after the timeout', async () => {
    setTimeout(() => { document.body.innerHTML = '<p id="late">x</p>'; }, 50);
    // jsdom has no layout: treat any matched element as visible for this test.
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 10 });
    expect(await waitFor('#late', 1000)).not.toBeNull();
    expect(await waitFor('#never', 150)).toBeNull();
  });
});
