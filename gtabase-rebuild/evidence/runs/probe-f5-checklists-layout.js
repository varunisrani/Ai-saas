(() => {
  const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { top: Math.round(b.top + scrollY), h: Math.round(b.height), w: Math.round(b.width), pos: cs.position, display: cs.display }; };
  return { docH: document.documentElement.scrollHeight, vw: innerWidth, module: r('.completion-percentage-wrapper'), sidebar: r('#ja-sidebar'), main: r('#ja-mainbody'), toc: r('.rl_quickindex'), firstSection: r('h2.checklist-item'), comments: r('#jcm-comments'), footer: r('footer') };
})()
