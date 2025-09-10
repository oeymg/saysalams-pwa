import { useEffect, useId, useState } from 'react';

export default function Collapsible({ title, children, defaultOpenDesktop = true, defaultOpenMobile = false }) {
  const [open, setOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const mq = window.matchMedia && window.matchMedia('(max-width: 640px)');
        return mq && mq.matches ? defaultOpenMobile : defaultOpenDesktop;
      }
    } catch (_) {}
    return defaultOpenDesktop;
  });
  const cid = useId();

  useEffect(() => {
    try {
      const mq = window.matchMedia && window.matchMedia('(max-width: 640px)');
      const update = () => setOpen(mq.matches ? defaultOpenMobile : defaultOpenDesktop);
      update();
      if (mq && mq.addEventListener) {
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
      }
    } catch (_) {
      // noop (SSR)
    }
  }, [defaultOpenDesktop, defaultOpenMobile]);

  return (
    <div className="collapsible">
      <button
        className="collapsible-header"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={`collapsible-${cid}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="collapsible-title">{title}</span>
        <span className={`collapsible-icon ${open ? 'open' : ''}`} aria-hidden>▾</span>
      </button>
      <div id={`collapsible-${cid}`} className="collapsible-content" style={{ display: open ? 'block' : 'none' }}>
        {children}
      </div>
    </div>
  );
}
