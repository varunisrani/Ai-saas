/* =============================================================================
   Diwali — "Shri Ram, Sita, Lakshman & Hanuman come home to Ayodhya"
   Painted stroke by stroke with p5.brush (standalone build), plus a 2D light
   layer on top for things that glow: diya flames, halo light, stars,
   fireworks and the title. 1080x1920, 30 fps.
   renderFrame(f) paints every stroke scheduled up to frame f, then composites.
   ============================================================================= */
const W = 1080, H = 1920, FPS = 30, DUR = 21;
const G = 1420;                                  // ground line the figures stand on
const INK = '#2a150b', CREAM = '#fbf1dc';
const GOLD = '#e8ae35', GOLD_L = '#f7dc8a', GOLD_D = '#a8691a';
const T = {                                      // timeline (seconds) — matches voice/lines.json
  sky: [0.3, 2.2], palace: [2.2, 3.0], floor: [2.9, 3.4],
  ram: [3.6, 5.6], sita: [5.0, 6.9], lakshman: [6.5, 8.4], hanuman: [8.0, 10.0],
  diyas: [9.8, 10.8], rangoli: [10.0, 11.4], light: [11.2, 13.6],
  text1: 15.0, text2: 16.4,
};

// ── scheduling ────────────────────────────────────────────────────────────────
const ops = [];
const at = (t, fn) => ops.push({ t, fn });
const spread = (t0, t1, fns) =>
  fns.forEach((fn, i) => at(fns.length < 2 ? t0 : t0 + (t1 - t0) * i / (fns.length - 1), fn));

// ── maths helpers ─────────────────────────────────────────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp01 = v => Math.max(0, Math.min(1, v));
const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeInOut = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeOutBack = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const ell = (cx, cy, rx, ry = rx, n = 28) =>
  Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const mirror = pts => pts.map(([x, y]) => [-x, y]).reverse();
const flipX = pts => pts.map(([x, y]) => [-x, y]);

function catmull(pts, per = 6) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
        + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
// polygon of a ribbon following a curve (bow, tail, stole, mace handle)
function band(pts, w0, w1 = w0) {
  const c = catmull(pts, 6), L = [], R = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const w = (w0 + (w1 - w0) * i / (c.length - 1)) / 2;
    L.push([p[0] + nx * w, p[1] + ny * w]); R.push([p[0] - nx * w, p[1] - ny * w]);
  });
  return L.concat(R.reverse());
}

// ── brush helpers ─────────────────────────────────────────────────────────────
function shape(pts, curv = 0.5) { brush.beginShape(curv); for (const [x, y] of pts) brush.vertex(x, y); brush.endShape(true); }
function wash(col, pts, curv = 0.5) { brush.noStroke(); brush.noFill(); brush.wash(col, 255); shape(pts, curv); brush.noWash(); }
function paint(col, op, pts, o = {}) {
  brush.noStroke(); brush.noWash(); brush.fill(col, op);
  brush.fillBleed(o.bleed ?? 0.05); brush.fillTexture(o.tex ?? 0.35, o.border ?? 0.45, o.scatter ?? true, o.split ?? 0.04);
  shape(pts, o.curv ?? 0.5); brush.noFill();
}
function ink(pts, o = {}) {
  brush.noFill(); brush.noWash(); brush.set(o.brush ?? 'pen', o.col ?? INK, o.w ?? 1.4);
  if (o.close) shape(pts, o.curv ?? 0.5); else brush.spline(pts, o.curv ?? 0.5);
  brush.noStroke();
}
function dots(pts, col, r, every = 1) { pts.forEach((p, i) => { if (i % every === 0) wash(col, ell(p[0], p[1], r, r, 10)); }); }

// figure frame: local coords (origin = feet centre, y up is negative) → canvas
function F(X, s, G0 = G) {
  const P = ([x, y]) => [X + x * s, G0 + y * s];
  const M = pts => pts.map(P);
  return { P, M, s, X, E: (cx, cy, rx, ry = rx, n = 28) => M(ell(cx, cy, rx, ry, n)),
    B: (pts, w0, w1) => band(M(pts), w0 * s, (w1 ?? w0) * s) };
}

const halos = [];   // for the glow layer
function haloOps(f, cy, r, tGlow) {
  const [hx, hy] = f.P([0, cy]);
  halos.push({ x: hx, y: hy, r: r * f.s, t0: tGlow });
  return [
    () => { wash(GOLD_L, f.E(0, cy, r, r, 44)); paint(GOLD, 150, f.E(0, cy, r * 0.97, r * 0.97, 44), { tex: 0.45, border: 0.65, bleed: 0.02 }); },
    () => {
      ink(f.E(0, cy, r, r, 44), { close: true, col: GOLD_D, w: 1.6 });
      ink(f.E(0, cy, r * 0.8, r * 0.8, 40), { close: true, col: GOLD_D, w: 1.1 });
      for (let i = 0; i < 36; i++) {
        const a = i / 36 * Math.PI * 2;
        const p1 = f.P([Math.cos(a) * r * 0.84, cy + Math.sin(a) * r * 0.84]);
        const p2 = f.P([Math.cos(a) * r * 0.95, cy + Math.sin(a) * r * 0.95]);
        brush.set('pen', GOLD_D, 1); brush.line(p1[0], p1[1], p2[0], p2[1]);
      }
      brush.noStroke();
    },
  ];
}

// ── standing prince (Ram / Lakshman) ──────────────────────────────────────────
function prince(X, s, c, t0, t1) {
  const f = F(X, s);
  const face = f.E(0, -650, 43, 57, 32);
  const crown = f.M([[-46, -698], [-50, -730], [-38, -770], [-22, -805], [0, -835], [22, -805], [38, -770], [50, -730], [46, -698]]);
  const crownBand = f.M([[-51, -692], [51, -692], [52, -716], [-52, -716]]);
  const spire = f.E(0, -843, 8, 9, 12);
  const hairL = [[-40, -700], [-52, -660], [-58, -600], [-70, -552], [-46, -556], [-38, -600], [-34, -660]];
  const hair = [f.M(hairL), f.M(mirror(hairL))];
  const ears = [f.E(-45, -645, 7, 13, 12), f.E(45, -645, 7, 13, 12)];
  const rings = [f.E(-48, -618, 10, 10, 14), f.E(48, -618, 10, 10, 14)];
  const neck = f.M([[-17, -605], [17, -605], [19, -572], [-19, -572]]);
  const torso = f.M([[-88, -568], [-58, -582], [58, -582], [88, -568], [82, -480], [64, -385], [-64, -385], [-82, -480]]);
  const armLl = [[-90, -566], [-106, -565], [-120, -500], [-126, -430], [-128, -340], [-104, -340], [-100, -430], [-92, -495], [-80, -540]];
  const armL = f.M(armLl), handL = f.E(-116, -325, 18, 21, 16);
  let armR, handR, extraR = [], bandR;
  if (c.arm === 'bless') {          // abhaya mudra: right hand raised, palm out
    armR = f.M([[80, -560], [106, -566], [120, -500], [124, -445], [100, -432], [92, -495]]);
    extraR = [f.M([[98, -440], [124, -440], [138, -492], [114, -498]])];
    handR = f.M([[112, -494], [108, -522], [111, -548], [117, -553], [121, -540], [123, -556], [129, -558], [132, -542],
      [137, -552], [142, -548], [143, -522], [140, -494]]);
    bandR = f.M([[93, -500], [121, -505]]);
  } else {
    armR = f.M(mirror(armLl)); handR = f.E(116, -325, 18, 21, 16);
    bandR = f.M([[93, -500], [121, -505]]);
  }
  const dhoti = f.M([[-66, -392], [66, -392], [74, -270], [84, -120], [90, -26], [30, -18], [0, -40], [-30, -18], [-90, -26], [-84, -120], [-74, -270]]);
  const belt = f.M([[-70, -400], [70, -400], [72, -372], [-72, -372]]);
  const sashHang = f.M([[-14, -375], [14, -375], [20, -185], [0, -165], [-20, -185]]);
  const feet = [f.E(-34, -8, 26, 11, 16), f.E(34, -8, 26, 11, 16)];
  const stole = f.B([[-86, -562], [-66, -470], [0, -432], [66, -470], [86, -562]], 20);
  const bowPath = [[-150, -640], [-124, -520], [-116, -322], [-124, -130], [-150, -10]];
  const garland = catmull(f.M([[-72, -566], [-82, -430], [-64, -280], [0, -215], [64, -280], [82, -430], [72, -566]]), 10);
  const skinBody = [neck, torso, armL, armR, ...extraR];
  const skinSmall = [handL, handR, ...feet, ...ears];
  const all = [...hair, crown, crownBand, spire, ...skinBody, ...skinSmall, face, dhoti, belt, sashHang];
  const eye = sx => f.M([[-34, -657], [-19, -666], [-5, -658], [-19, -651]].map(([x, y]) => [x * sx, y]));

  const list = [
    ...haloOps(f, -675, 108, t0 + 0.2),
    // bow first, so the hand can grip over it
    () => { wash(CREAM, f.B(bowPath, 13), 0); paint('#94561c', 230, f.B(bowPath, 9), { curv: 0, bleed: 0, tex: 0.3 });
      ink(f.M(bowPath), { w: 1.1 }); ink(f.M([bowPath[0], bowPath[4]]), { col: '#f3e3c0', w: 0.8, curv: 0 }); },
    // underpaint (gesso) so colours stay bright over the night sky
    () => { hair.forEach(p => wash(c.hair, p)); [crown, crownBand, spire, ...skinBody, ...skinSmall, face, dhoti, belt, sashHang].forEach(p => wash(CREAM, p)); },
    () => skinBody.forEach(p => paint(c.skin, 205, p, { tex: 0.3, border: 0.5 })),
    () => { [...skinSmall, face].forEach(p => paint(c.skin, 205, p, { tex: 0.25, border: 0.5 })); },
    () => paint(c.dhoti, 220, dhoti, { tex: 0.35, border: 0.55 }),
    () => { paint(c.sash, 215, belt); paint(c.sash, 205, sashHang); },
    () => { wash(CREAM, stole, 0); paint(c.stole, 225, stole, { curv: 0, tex: 0.3 }); paint(c.stole, 120, stole, { curv: 0, tex: 0.2 }); },
    () => { paint(GOLD, 215, crown, { tex: 0.4 }); paint(GOLD_D, 170, crownBand); paint(GOLD, 200, spire); },
    () => { // shading glazes
      paint(c.skinShade, 80, f.M([[-88, -568], [-64, -572], [-72, -480], [-58, -400], [-64, -385], [-82, -480]]), { tex: 0.2, border: 0.2 });
      paint(c.dhotiShade, 100, f.M([[-66, -392], [-42, -392], [-52, -200], [-60, -30], [-90, -26], [-84, -120], [-74, -270]]), { tex: 0.3, border: 0.2 });
      paint(c.dhotiShade, 80, f.M(flipX([[-66, -392], [-42, -392], [-52, -200], [-60, -30], [-90, -26], [-84, -120], [-74, -270]])), { tex: 0.3, border: 0.2 });
    },
    () => { ink(face, { close: true }); ears.forEach(e => ink(e, { close: true, w: 1.1 })); },
    () => { ink(torso, { close: true }); ink(f.M([[-17, -605], [-19, -574]]), { curv: 0 }); ink(f.M([[17, -605], [19, -574]]), { curv: 0 }); },
    () => { [armL, armR, ...extraR, handL, handR].forEach(p => ink(p, { close: true, w: 1.3 })); },
    () => { ink(dhoti, { close: true }); ink(belt, { close: true, w: 1.1 }); ink(sashHang, { close: true, w: 1.1 }); },
    () => { ink(stole, { close: true, curv: 0, w: 1.0 }); feet.forEach(p => ink(p, { close: true, w: 1.1 })); hair.forEach(p => ink(p, { close: true, w: 1 })); },
    () => { ink(crown, { close: true, w: 1.3 }); ink(crownBand, { close: true, w: 1.1 }); ink(spire, { close: true, w: 1 });
      dots(f.M([[-30, -704], [0, -704], [30, -704]]), '#c8263a', 5 * s); wash('#c8263a', f.M([[0, -790], [9, -770], [0, -752], [-9, -770]])); },
    () => { // eyes
      [-1, 1].forEach(sx => wash('#fffaf0', eye(sx)));
      [-1, 1].forEach(sx => wash(INK, f.E(-18 * sx, -658, 4.6, 5.4, 10)));
      [-1, 1].forEach(sx => { ink(f.M([[-35, -657], [-19, -667], [-4, -658]].map(([x, y]) => [x * sx, y])), { w: 1.4 });
        ink(f.M([[-34, -657], [-19, -651], [-5, -658]].map(([x, y]) => [x * sx, y])), { w: 0.8 }); });
    },
    () => { // brows, nose, lips
      [-1, 1].forEach(sx => ink(f.M([[-36, -671], [-21, -680], [-6, -673]].map(([x, y]) => [x * sx, y])), { w: 1.6 }));
      ink(f.M([[-2, -655], [-5, -632], [0, -627], [5, -630]]), { w: 1 });
      paint('#c2333a', 220, f.M([[-11, -612], [0, -617], [11, -612], [0, -604]]), { bleed: 0, tex: 0.1 });
      ink(f.M([[-11, -612], [0, -610], [11, -612]]), { w: 0.9 });
    },
    () => { // Vaishnava tilak
      ink(f.M([[-7, -692], [-5, -679], [0, -675], [5, -679], [7, -692]]), { col: '#fff7e6', w: 1.6 });
      ink(f.M([[0, -692], [0, -679]]), { col: '#d4202c', w: 1.6, curv: 0 });
    },
    () => { // necklaces + earrings
      ink(f.M([[-38, -576], [0, -543], [38, -576]]), { col: GOLD_D, w: 2.2 });
      ink(f.M([[-54, -572], [-30, -528], [0, -512], [30, -528], [54, -572]]), { col: GOLD_D, w: 2.2 });
      dots(catmull(f.M([[-54, -572], [-30, -528], [0, -512], [30, -528], [54, -572]]), 6), GOLD, 3.2 * s, 2);
      rings.forEach(p => { wash(GOLD, p); ink(p, { close: true, w: 1 }); });
    },
    () => { // vaijayanti garland
      ink(garland, { col: '#2f7d3a', w: 2.6, curv: 0.3 });
      const cols = ['#fff4e0', '#d8263a', '#f5c518'];
      garland.forEach((p, i) => { if (i % 3 === 0) wash(cols[(i / 3) % 3], ell(p[0], p[1], 6.5 * s, 6.5 * s, 10)); });
    },
    () => { // sacred thread, arm bands, wrist bands
      ink(f.M([[-62, -574], [-10, -480], [58, -392]]), { col: '#fff4dc', w: 1.1 });
      ink(f.M([[-121, -505], [-93, -500]]), { col: GOLD_D, w: 3, curv: 0 }); ink(bandR, { col: GOLD_D, w: 3, curv: 0 });
      ink(f.M([[-128, -350], [-104, -350]]), { col: GOLD_D, w: 3, curv: 0 });
    },
    () => { // dhoti folds and hem border
      ink(f.M([[0, -380], [3, -200], [4, -45]]), { col: c.dhotiInk, w: 1 });
      ink(f.M([[-30, -362], [-36, -200], [-42, -24]]), { col: c.dhotiInk, w: 1 });
      ink(f.M([[30, -362], [36, -200], [42, -24]]), { col: c.dhotiInk, w: 1 });
      ink(f.M([[-90, -34], [-60, -36], [-30, -26]]), { col: GOLD_D, w: 3 }); ink(f.M([[30, -26], [60, -36], [90, -34]]), { col: GOLD_D, w: 3 });
      ink(f.M([[-30, -6], [-34, -2]]), { col: GOLD_D, w: 2, curv: 0 });
    },
  ];
  spread(t0, t1, list);
}

// ── Sita ──────────────────────────────────────────────────────────────────────
function sita(X, s, t0, t1) {
  const f = F(X, s);
  const veil = f.M([[-38, -702], [-56, -650], [-64, -570], [-92, -520], [-100, -380], [100, -380], [92, -520], [64, -570], [56, -650], [38, -702], [0, -716]]);
  const hair = f.E(0, -628, 47, 57, 28);
  const face = f.E(0, -620, 39, 52, 30);
  const crown = f.M([[-38, -662], [-32, -690], [-16, -704], [0, -722], [16, -704], [32, -690], [38, -662]]);
  const crownBand = f.M([[-40, -656], [40, -656], [40, -674], [-40, -674]]);
  const neck = f.M([[-15, -575], [15, -575], [17, -546], [-17, -546]]);
  const blouse = f.M([[-72, -545], [-46, -556], [46, -556], [72, -545], [66, -470], [56, -420], [-56, -420], [-66, -470]]);
  const skirt = f.M([[-58, -432], [58, -432], [70, -300], [84, -150], [96, -20], [-96, -20], [-84, -150], [-70, -300]]);
  const pallu = f.B([[-64, -556], [-24, -500], [28, -446], [70, -404]], 46);
  const upL = [[-68, -546], [-84, -540], [-92, -480], [-90, -445], [-70, -442], [-70, -492]];
  const foreL = [[-90, -462], [-74, -438], [-14, -468], [-18, -494]];
  const arms = [upL, foreL, mirror(upL), mirror(foreL)].map(p => f.M(p));
  const hands = [f.E(-14, -484, 13, 16, 14), f.E(14, -484, 13, 16, 14)];
  const lotus = [f.M([[0, -556], [12, -530], [0, -504], [-12, -530]]), f.M([[-4, -506], [-30, -538], [-22, -512]]), f.M([[4, -506], [30, -538], [22, -512]])];
  const feet = [f.E(-28, -8, 22, 10, 14), f.E(28, -8, 22, 10, 14)];
  const eye = sx => f.M([[-31, -626], [-18, -634], [-5, -627], [-18, -620]].map(([x, y]) => [x * sx, y]));
  const list = [
    ...haloOps(f, -640, 98, t0 + 0.2),
    () => { wash(CREAM, veil); paint('#c3162d', 225, veil, { tex: 0.4, border: 0.55 }); paint('#a3101f', 120, veil, { tex: 0.3, border: 0.3 }); },
    () => { wash('#1d1622', hair); [face, neck, crown, crownBand, ...feet].forEach(p => wash(CREAM, p)); },
    () => { [face, neck, ...feet].forEach(p => paint('#f2c49c', 205, p, { tex: 0.25, border: 0.5 })); },
    () => { wash(CREAM, blouse); paint('#1f7a4a', 220, blouse, { tex: 0.35 }); },
    () => { wash(CREAM, skirt); paint('#c3162d', 225, skirt, { tex: 0.4, border: 0.55 }); paint('#a3101f', 130, skirt, { tex: 0.3, border: 0.3 }); },
    () => { wash(CREAM, pallu, 0); paint('#b0122a', 230, pallu, { curv: 0, tex: 0.35 }); paint('#8e0c1c', 110, pallu, { curv: 0, tex: 0.3 }); },
    () => { // saree hem border + pallu borders in gold (under the arms)
      wash(GOLD, f.B([[-96, -34], [0, -26], [96, -34]], 14), 0);
      ink(catmull(f.M([[-64, -556], [-24, -500], [28, -446], [70, -404]]), 4).map(([x, y]) => [x - 16 * s, y - 16 * s]), { col: GOLD, w: 3.2 });
      ink(catmull(f.M([[-64, -556], [-24, -500], [28, -446], [70, -404]]), 4).map(([x, y]) => [x + 16 * s, y + 16 * s]), { col: GOLD, w: 3.2 });
      ink(veil.slice(0, 5), { col: GOLD, w: 3 }); ink(veil.slice(6), { col: GOLD, w: 3 });
    },
    () => { paint(GOLD, 215, crown, { tex: 0.4 }); paint(GOLD_D, 170, crownBand); },
    () => { [...arms, ...hands].forEach(p => wash(CREAM, p)); [...arms, ...hands].forEach(p => paint('#f2c49c', 205, p, { tex: 0.25 })); },
    () => { lotus.forEach(p => wash(CREAM, p)); lotus.forEach(p => paint('#e9578a', 215, p, { tex: 0.3, border: 0.6 })); },
    () => { ink(face, { close: true }); ink(f.M([[-15, -575], [-17, -548]]), { curv: 0 }); ink(f.M([[15, -575], [17, -548]]), { curv: 0 }); ink(veil, { close: true, w: 1.2 }); },
    () => { ink(blouse, { close: true, w: 1.2 }); ink(skirt, { close: true }); ink(pallu, { close: true, curv: 0, w: 1.1 }); },
    () => { [...arms, ...hands].forEach(p => ink(p, { close: true, w: 1.2 })); lotus.forEach(p => ink(p, { close: true, w: 1 })); feet.forEach(p => ink(p, { close: true, w: 1 })); },
    () => { ink(crown, { close: true, w: 1.2 }); ink(crownBand, { close: true, w: 1 }); dots(f.M([[-24, -665], [0, -665], [24, -665], [0, -700]]), '#1f9a5a', 4 * s); },
    () => {
      [-1, 1].forEach(sx => wash('#fffaf0', eye(sx)));
      [-1, 1].forEach(sx => wash(INK, f.E(-17 * sx, -627, 4.2, 5, 10)));
      [-1, 1].forEach(sx => { ink(f.M([[-32, -626], [-18, -635], [-4, -627]].map(([x, y]) => [x * sx, y])), { w: 1.5 });
        ink(f.M([[-31, -626], [-18, -620], [-5, -627]].map(([x, y]) => [x * sx, y])), { w: 0.8 });
        ink(f.M([[-33, -638], [-19, -646], [-6, -640]].map(([x, y]) => [x * sx, y])), { w: 1.3 }); });
    },
    () => {
      ink(f.M([[-2, -622], [-4, -601], [0, -597], [4, -600]]), { w: 1 });
      paint('#c2233a', 225, f.M([[-10, -584], [0, -588], [10, -584], [0, -577]]), { bleed: 0, tex: 0.1 });
      ink(f.M([[-10, -584], [0, -582], [10, -584]]), { w: 0.9 });
      wash('#d4142c', f.E(0, -649, 4.2, 4.2, 10));
      ink(f.E(-8, -597, 5, 5, 10), { close: true, col: GOLD_D, w: 1 });
      wash(GOLD, f.E(0, -664, 4, 6, 10));
    },
    () => {
      ink(f.M([[-30, -552], [0, -526], [30, -552]]), { col: GOLD_D, w: 2.2 });
      ink(f.M([[-42, -550], [0, -506], [42, -550]]), { col: GOLD_D, w: 2.2 });
      dots(catmull(f.M([[-42, -550], [0, -506], [42, -550]]), 5), GOLD, 3, 2);
      [-1, 1].forEach(sx => { wash(GOLD, f.E(42 * sx, -596, 7, 9, 12)); ink(f.E(42 * sx, -596, 7, 9, 12), { close: true, w: 0.9 }); });
      [[-34, -487, -28, -467], [-39, -485, -33, -465], [34, -487, 28, -467], [39, -485, 33, -465]].forEach(([a, b, c2, d]) => ink(f.M([[a, b], [c2, d]]), { col: GOLD_D, w: 2.6, curv: 0 }));
    },
    () => { [[-12, -420, -18, -36], [0, -420, 0, -30], [12, -420, 18, -36]].forEach(([a, b, c2, d]) => ink(f.M([[a, b], [(a + c2) / 2, (b + d) / 2], [c2, d]]), { col: '#6e0a16', w: 1 })); },
  ];
  spread(t0, t1, list);
}

// ── Hanuman, kneeling with folded hands ───────────────────────────────────────
function hanuman(X, s, t0, t1) {
  const f = F(X, s);
  const tailPath = [[-52, -280], [-96, -340], [-92, -440], [-70, -530], [-84, -596], [-114, -590], [-108, -556]];
  const tail = f.B(tailPath, 24, 9);
  const gadaPath = [[112, -8], [100, -250], [92, -452]];
  const gadaHandle = f.B(gadaPath, 15, 12);
  const gadaHead = f.E(92, -490, 40, 44, 30), gadaKnob = f.E(92, -540, 9, 10, 12);
  const head = f.E(0, -480, 44, 46, 30);
  const ears = [f.E(-46, -488, 11, 14, 14), f.E(46, -488, 11, 14, 14)];
  const crown = f.M([[-34, -512], [-30, -540], [-16, -560], [0, -580], [16, -560], [30, -540], [34, -512]]);
  const crownBand = f.M([[-36, -506], [36, -506], [36, -524], [-36, -524]]);
  const muzzle = f.E(0, -458, 30, 22, 24);
  const neck = f.M([[-16, -440], [16, -440], [18, -420], [-18, -420]]);
  const torso = f.M([[-80, -428], [-50, -438], [50, -438], [80, -428], [74, -330], [62, -235], [-62, -235], [-74, -330]]);
  const upL = [[-80, -428], [-96, -415], [-102, -340], [-80, -328], [-74, -395]];
  const foreL = [[-98, -350], [-82, -326], [-12, -340], [-14, -366]];
  const arms = [upL, foreL, mirror(upL), mirror(foreL)].map(p => f.M(p));
  const hands = f.M([[-13, -330], [-15, -372], [-7, -404], [0, -408], [7, -404], [15, -372], [13, -330]]);
  const dhoti = f.M([[-66, -238], [66, -238], [104, -165], [118, -45], [100, -6], [-100, -6], [-118, -45], [-104, -165]]);
  const belt = f.M([[-68, -246], [68, -246], [70, -222], [-70, -222]]);
  const feet = [f.E(-98, -6, 24, 10, 14), f.E(98, -6, 24, 10, 14)];
  const SK = '#e4702e';
  const list = [
    ...haloOps(f, -500, 92, t0 + 0.2),
    () => { wash(CREAM, tail, 0); paint(SK, 215, tail, { curv: 0, tex: 0.3 }); ink(tail, { close: true, curv: 0, w: 1.1 }); },
    () => { wash(CREAM, gadaHandle, 0); wash(CREAM, gadaHead); wash(CREAM, gadaKnob);
      paint('#9a5a1c', 225, gadaHandle, { curv: 0, bleed: 0 }); paint(GOLD, 220, gadaHead, { tex: 0.45, border: 0.7 }); paint(GOLD, 210, gadaKnob); },
    () => { ink(gadaHandle, { close: true, curv: 0, w: 1.1 }); ink(gadaHead, { close: true, w: 1.3 }); ink(gadaKnob, { close: true, w: 1 });
      [[[92, -534], [76, -490], [92, -446]], [[92, -534], [108, -490], [92, -446]], [[52, -490], [92, -484], [132, -490]]].forEach(p => ink(f.M(p), { col: GOLD_D, w: 1.4 }));
      [[100, -230], [96, -330], [94, -420]].forEach(([x, y]) => ink(f.M([[x - 8, y], [x + 8, y]]), { col: GOLD, w: 3, curv: 0 })); },
    () => { [...ears, head, crown, crownBand, neck, torso, dhoti, belt, ...feet].forEach(p => wash(CREAM, p)); },
    () => { [...ears, head, neck, torso, ...feet].forEach(p => paint(SK, 215, p, { tex: 0.3, border: 0.5 })); paint('#c9561c', 70, torso, { tex: 0.3, border: 0.3 }); },
    () => { paint('#c3242a', 225, dhoti, { tex: 0.4, border: 0.55 }); paint('#a3101f', 130, dhoti, { tex: 0.3, border: 0.3 }); paint('#f2bf2a', 220, belt); },
    () => { wash(CREAM, muzzle); paint('#f7cfa4', 210, muzzle, { tex: 0.2 }); paint(GOLD, 215, crown, { tex: 0.4 }); paint(GOLD_D, 170, crownBand); },
    () => { [...arms, hands].forEach(p => wash(CREAM, p)); [...arms, hands].forEach(p => paint(SK, 210, p, { tex: 0.25 })); },
    () => { ink(head, { close: true }); ears.forEach(p => ink(p, { close: true, w: 1.1 })); ink(muzzle, { close: true, w: 1 }); },
    () => { ink(torso, { close: true }); ink(dhoti, { close: true }); ink(belt, { close: true, w: 1 }); feet.forEach(p => ink(p, { close: true, w: 1 })); },
    () => { [...arms, hands].forEach(p => ink(p, { close: true, w: 1.2 })); ink(f.M([[0, -404], [0, -334]]), { w: 0.9, curv: 0 }); },
    () => { ink(crown, { close: true, w: 1.2 }); ink(crownBand, { close: true, w: 1 }); dots(f.M([[-20, -515], [0, -515], [20, -515]]), '#c8263a', 4); wash('#c8263a', f.M([[0, -560], [7, -546], [0, -532], [-7, -546]])); },
    () => { // face: eyes, brow ridge, nostrils, smile, tilak
      [-1, 1].forEach(sx => { wash('#fffaf0', f.E(16 * sx, -488, 8, 6.5, 12)); wash(INK, f.E(15 * sx, -488, 3.6, 4.2, 10)); ink(f.E(16 * sx, -488, 8, 6.5, 12), { close: true, w: 1 }); });
      ink(f.M([[-34, -496], [-18, -505], [0, -499], [18, -505], [34, -496]]), { w: 1.7 });
      wash(INK, f.E(-5, -465, 2.4, 2, 8)); wash(INK, f.E(5, -465, 2.4, 2, 8));
      ink(f.M([[-17, -451], [0, -444], [17, -451]]), { w: 1.3 });
      ink(f.M([[0, -508], [0, -496]]), { col: '#d4202c', w: 2.4, curv: 0 });
    },
    () => { ink(f.M([[-36, -432], [0, -414], [36, -432]]), { col: GOLD_D, w: 2.2 });
      ink(f.M([[-100, -385], [-76, -385]]), { col: GOLD_D, w: 3, curv: 0 }); ink(f.M([[76, -385], [100, -385]]), { col: GOLD_D, w: 3, curv: 0 });
      ink(f.M([[-104, -120], [-60, -150], [-12, -118]]), { col: '#6e0a16', w: 1.1 }); ink(f.M([[20, -60], [60, -82], [104, -60]]), { col: '#6e0a16', w: 1.1 });
      ink(f.M([[-118, -40], [0, -30], [118, -40]]), { col: GOLD_D, w: 3 }); },
  ];
  spread(t0, t1, list);
}

// ── sky, Ayodhya skyline, floor ───────────────────────────────────────────────
function backdrop() {
  const rect = (y0, y1) => [[-60, y0], [W + 60, y0], [W + 60, y1], [-60, y1]];
  const sky = [
    () => paint('#ec9a62', 205, rect(-60, 1195), { curv: 0, tex: 0.2, border: 0.1, bleed: 0.02, split: 0.1 }),
    () => paint('#c2507a', 170, rect(-60, 1030), { curv: 0, tex: 0.3, border: 0.2, bleed: 0.15 }),
    () => paint('#3a2f86', 215, rect(-60, 905), { curv: 0, tex: 0.4, border: 0.3, bleed: 0.2 }),
    () => paint('#232671', 225, rect(-60, 745), { curv: 0, tex: 0.4, border: 0.3, bleed: 0.2 }),
    () => paint('#1a1c5a', 228, rect(-60, 565), { curv: 0, tex: 0.4, border: 0.3, bleed: 0.2 }),
    () => paint('#121543', 230, rect(-60, 380), { curv: 0, tex: 0.4, border: 0.3, bleed: 0.2 }),
    () => paint('#0d0f30', 225, rect(-60, 190), { curv: 0, tex: 0.4, border: 0.3, bleed: 0.2 }),
  ];
  spread(T.sky[0], T.sky[1], sky);

  const PAL = '#2a1431';
  const bld = [
    [[-10, 1185], [-10, 930], [130, 930], [130, 1185]],
    [[130, 1185], [130, 1010], [282, 1010], [282, 1185]],
    [[282, 1185], [282, 880], [318, 880], [318, 1185]],
    [[318, 1185], [318, 1040], [455, 1040], [455, 1185]],
    [[625, 1185], [625, 1000], [762, 1000], [762, 1185]],
    [[762, 1185], [762, 860], [798, 860], [798, 1185]],
    [[800, 1185], [800, 905], [1090, 905], [1090, 1185]],
  ];
  const domes = [
    [[10, 932], [18, 885], [45, 858], [70, 848], [95, 858], [122, 885], [130, 932]],
    [[278, 882], [286, 856], [300, 846], [314, 856], [322, 882]],
    [[758, 862], [766, 836], [780, 826], [794, 836], [802, 862]],
    [[852, 906], [860, 860], [892, 815], [940, 792], [988, 815], [1020, 860], [1028, 906]],
  ];
  const shikhara = [[455, 1185], [462, 1010], [478, 940], [500, 880], [522, 835], [540, 806], [558, 835], [580, 880], [602, 940], [618, 1010], [625, 1185]];
  const finials = [[[66, 850], [74, 850], [70, 818]], [[936, 794], [944, 794], [940, 758]], [[296, 848], [304, 848], [300, 828]], [[776, 828], [784, 828], [780, 808]]];
  const windows = [];
  const win = (x0, x1, y0, y1, dx, dy) => { for (let x = x0; x <= x1; x += dx) for (let y = y0; y <= y1; y += dy) windows.push([x, y]); };
  win(20, 110, 960, 1060, 30, 50); win(150, 260, 1040, 1070, 36, 40); win(340, 440, 1065, 1070, 34, 40);
  win(645, 745, 1030, 1070, 32, 40); win(830, 1060, 940, 1060, 38, 48); win(300, 300, 900, 1000, 20, 50); win(780, 780, 880, 980, 20, 50);
  win(520, 560, 960, 1040, 40, 60);
  const winShape = ([x, y]) => [[x - 6, y + 12], [x - 6, y - 4], [x, y - 11], [x + 6, y - 4], [x + 6, y + 12]];
  const palace = [
    () => { bld.forEach(p => wash(PAL, p, 0)); domes.forEach(p => wash(PAL, p, 0.6)); },
    () => { wash(PAL, shikhara, 0.3); wash(PAL, ell(540, 802, 24, 10, 16)); finials.forEach(p => wash(PAL, p, 0));
      wash(PAL, [[532, 794], [548, 794], [545, 770], [535, 770]], 0); },
    () => { [...bld, shikhara].forEach(p => paint('#3d1a40', 110, p, { curv: 0, tex: 0.5, border: 0.3, bleed: 0.02 }));
      ink([[540, 772], [540, 690]], { col: '#c79a52', w: 1.4, curv: 0 }); },
    () => { wash('#ff8c1a', [[541, 690], [604, 707], [541, 726]], 0.2); paint('#ff6a00', 160, [[541, 690], [604, 707], [541, 726]], { curv: 0.2, bleed: 0 }); },
    () => { windows.forEach(w => wash('#ffc95a', winShape(w), 0)); },
    () => { domes.forEach(p => ink(p, { col: '#d8a24a', w: 1.2, curv: 0.6 })); ink(shikhara.slice(1, -1), { col: '#d8a24a', w: 1.2, curv: 0.3 }); },
  ];
  spread(T.palace[0], T.palace[1], palace);

  const floor = [
    () => wash('#3a1820', rect(1180, H + 20), 0),
    () => paint('#7a3226', 120, rect(1180, 1600), { curv: 0, tex: 0.5, border: 0.2, bleed: 0.15 }),
    () => { wash('#6a3022', rect(1176, 1192), 0); ink([[0, 1178], [W, 1178]], { col: '#d8a24a', w: 1.6, curv: 0 }); ink([[0, 1194], [W, 1194]], { col: '#1d0a0e', w: 1.2, curv: 0 }); },
  ];
  spread(T.floor[0], T.floor[1], floor);
}

// ── diyas and rangoli ─────────────────────────────────────────────────────────
const diyas = [];   // {x, y, sc, tLight} for the flame layer
function diyaShape(x, y, sc) {
  return [[-40, -4], [-22, -9], [22, -9], [40, -4], [54, -16], [50, -2], [36, 16], [0, 24], [-36, 16], [-46, 2]].map(([a, b]) => [x + a * sc, y + b * sc]);
}
function diyaOps(list) {
  return [
    () => list.forEach(d => wash(CREAM, diyaShape(d.x, d.y, d.sc), 0.4)),
    () => list.forEach(d => paint('#c45a2c', 230, diyaShape(d.x, d.y, d.sc), { curv: 0.4, tex: 0.4, border: 0.6, bleed: 0 })),
    () => list.forEach(d => { wash('#4a200c', ell(d.x, d.y - 5 * d.sc, 33 * d.sc, 5.5 * d.sc, 18)); }),
    () => list.forEach(d => { for (let i = 0; i < 7; i++) { const a = Math.PI * (0.12 + 0.76 * i / 6);
      wash(i % 2 ? '#fff1c8' : '#ffd23a', ell(d.x + Math.cos(a) * 30 * d.sc, d.y + 2 * d.sc + Math.sin(a) * 12 * d.sc, 3.2 * d.sc, 3.2 * d.sc, 8)); } }),
    () => list.forEach(d => { ink(diyaShape(d.x, d.y, d.sc), { close: true, curv: 0.4, w: 1.1 }); ink(ell(d.x, d.y - 5 * d.sc, 34 * d.sc, 6 * d.sc, 18), { close: true, col: GOLD_D, w: 1.2 }); }),
  ];
}
function floorArt() {
  const row = Array.from({ length: 9 }, (_, i) => ({ x: 75 + i * 116.25, y: 1545, sc: 1 }));
  spread(T.diyas[0], T.diyas[1], diyaOps(row));
  row.forEach((d, i) => { d.tLight = T.light[0] + i * 0.27; diyas.push(d); });

  const RC = [540, 1752], SY = 0.55;
  const rp = (r, a) => [RC[0] + r * Math.cos(a), RC[1] + r * Math.sin(a) * SY];
  const ring = (n, r0, r1, wA, off = 0) => Array.from({ length: n }, (_, i) => {
    const a = off + i / n * Math.PI * 2;
    return [rp(r0, a - wA * 0.75), rp((r0 + r1) / 2 + 8, a - wA), rp(r1, a), rp((r0 + r1) / 2 + 8, a + wA), rp(r0, a + wA * 0.75)];
  });
  const outer = ring(16, 150, 236, 0.17), mid = ring(8, 78, 150, 0.32), leaves = ring(8, 92, 146, 0.11, Math.PI / 8), inner = ring(8, 20, 72, 0.34, Math.PI / 8);
  const disk = r => Array.from({ length: 40 }, (_, i) => rp(r, i / 40 * Math.PI * 2));
  const center = { x: 540, y: 1750, sc: 1.3 };
  const rang = [
    () => wash(CREAM, disk(240), 0.5),
    () => outer.forEach((p, i) => paint(i % 2 ? '#f28c1b' : '#d81b6a', 220, p, { tex: 0.3, border: 0.6, bleed: 0.02 })),
    () => { mid.forEach(p => paint('#f5c21b', 220, p, { tex: 0.3, border: 0.6, bleed: 0.02 })); leaves.forEach(p => paint('#22955a', 220, p, { bleed: 0.02 })); },
    () => { paint('#1d8a8a', 215, disk(76), { tex: 0.35, bleed: 0.02 }); },
    () => { inner.forEach(p => wash(CREAM, p)); inner.forEach(p => paint('#e23b3b', 225, p, { bleed: 0.02 })); },
    () => { [...outer, ...mid].forEach(p => ink(p, { close: true, w: 0.9 })); ink(disk(238), { close: true, w: 1.2 }); },
    () => { Array.from({ length: 56 }, (_, i) => rp(250, i / 56 * Math.PI * 2)).forEach(p => wash('#fff3d6', ell(p[0], p[1], 4.2, 3, 8))); },
    ...diyaOps([center]),
  ];
  spread(T.rangoli[0], T.rangoli[1], rang);
  center.tLight = T.light[1]; diyas.push(center);
}

// ── build the painting timeline ───────────────────────────────────────────────
function build() {
  backdrop();
  prince(445, 1.0, { skin: '#3f72cf', skinShade: '#1d3f8a', dhoti: '#f2bf2a', dhotiShade: '#d8901a', dhotiInk: '#a8691a',
    sash: '#c8262f', stole: '#d8302a', hair: '#1d1622', arm: 'bless' }, T.ram[0], T.ram[1]);
  sita(690, 1.0, T.sita[0], T.sita[1]);
  prince(160, 0.92, { skin: '#efbf8a', skinShade: '#c98a4e', dhoti: '#e8742a', dhotiShade: '#b8471a', dhotiInk: '#8a3210',
    sash: '#2e8b57', stole: '#2e8b57', hair: '#1d1622', arm: 'down' }, T.lakshman[0], T.lakshman[1]);
  hanuman(915, 1.0, T.hanuman[0], T.hanuman[1]);
  floorArt();
  ops.sort((a, b) => a.t - b.t);
}

// ── light layer (2D) ──────────────────────────────────────────────────────────
let out, ctx, brushCanvas;
const R = rng(2026);
const stars = Array.from({ length: 75 }, () => ({ x: R() * W, y: 20 + R() * 520, r: 0.8 + R() * 2.2, ph: R() * 6.3, sp: 1 + R() * 3 }));
const FW = { gold: ['#ffd36b', '#ffb23a', '#fff1c0'], pink: ['#ff6fae', '#ff9ccf', '#ffe0f0'], cyan: ['#6fe8ff', '#b5f5ff', '#ffffff'],
  magenta: ['#ff4fd8', '#ffa0ec', '#ffffff'], green: ['#b6ff6f', '#e4ffb0', '#ffffff'], orange: ['#ff8a3a', '#ffc27a', '#fff2d0'], white: ['#fff6dc', '#ffe7a8', '#ffffff'] };
const BURSTS = [
  [13.4, 260, 520, 'gold'], [13.9, 820, 480, 'pink'], [14.5, 540, 530, 'cyan'], [15.2, 130, 300, 'gold'], [15.8, 950, 300, 'magenta'],
  [16.6, 300, 560, 'green'], [17.2, 790, 560, 'orange'], [17.9, 160, 120, 'white'], [18.5, 920, 130, 'pink'], [19.1, 420, 540, 'gold'],
  [19.7, 700, 520, 'cyan'], [20.3, 240, 330, 'magenta'], [20.6, 860, 400, 'gold'],
].map(([t, x, y, c], bi) => {
  const r = rng(77 + bi), n = 120, cols = FW[c];
  return { t, x, y, parts: Array.from({ length: n }, (_, i) => {
    const a = r() * Math.PI * 2, v = (i % 3 === 0 ? 200 : 340) + r() * 130;
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, col: cols[Math.floor(r() * cols.length)], w: 2.2 + r() * 2.4, life: 1.5 + r() * 0.7, ph: r() * 9 };
  }) };
});
window.BURSTS_T = BURSTS.map(b => b.t);

function flame(x, y, h, t, seed) {
  const f = 1 + 0.08 * Math.sin(t * 14 + seed * 3.1) + 0.05 * Math.sin(t * 31 + seed * 7.7);
  const hh = h * f, ww = h * 0.34, sway = Math.sin(t * 5 + seed) * h * 0.07;
  ctx.globalCompositeOperation = 'lighter';
  let g = ctx.createRadialGradient(x, y - hh * 0.4, 0, x, y - hh * 0.4, h * 3.2);
  g.addColorStop(0, 'rgba(255,170,60,0.55)'); g.addColorStop(0.3, 'rgba(255,120,30,0.16)'); g.addColorStop(1, 'rgba(255,90,20,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - hh * 0.4, h * 3.2, 0, 7); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  const tear = (s, dx) => { const p = new Path2D(); const tx = x + sway * s + dx, ty = y - hh * s;
    p.moveTo(tx, ty); p.bezierCurveTo(x + ww * s * 0.9, y - hh * s * 0.45, x + ww * s, y - hh * s * 0.02, x, y);
    p.bezierCurveTo(x - ww * s, y - hh * s * 0.02, x - ww * s * 0.9, y - hh * s * 0.45, tx, ty); return p; };
  g = ctx.createLinearGradient(x, y, x, y - hh); g.addColorStop(0, '#ff6a12'); g.addColorStop(0.4, '#ffc23a'); g.addColorStop(1, 'rgba(255,236,170,0.85)');
  ctx.fillStyle = g; ctx.fill(tear(1, 0));
  ctx.fillStyle = 'rgba(255,252,235,0.95)'; ctx.fill(tear(0.55, 0));
}

function drawLights(t) {
  // stars
  const sa = clamp01((t - 1.6) / 1.0);
  if (sa > 0) {
    ctx.globalCompositeOperation = 'lighter';
    for (const s of stars) {
      const a = sa * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph)));
      ctx.fillStyle = `rgba(255,244,220,${a * 0.9})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      if (s.r > 2.2) { ctx.strokeStyle = `rgba(255,236,200,${a * 0.5})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(s.x - s.r * 4, s.y); ctx.lineTo(s.x + s.r * 4, s.y); ctx.moveTo(s.x, s.y - s.r * 4); ctx.lineTo(s.x, s.y + s.r * 4); ctx.stroke(); }
    }
  }
  // halo light — a ring outside each halo, fading out below the halo centre
  for (const h of halos) {
    const a = clamp01((t - h.t0) / 0.8); if (a <= 0) continue;
    haloGlow(h, a * (0.85 + 0.15 * Math.sin(t * 2.2 + h.x * 0.01)));
  }
  // diya flames + warm floor light
  const lit = diyas.filter(d => t >= d.tLight);
  if (lit.length) {
    ctx.globalCompositeOperation = 'lighter';
    const k = lit.length / diyas.length;
    const g = ctx.createRadialGradient(540, 1600, 50, 540, 1600, 760);
    g.addColorStop(0, `rgba(255,130,40,${0.22 * k})`); g.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 1180, W, H - 1180);
  }
  for (const [i, d] of diyas.entries()) {
    const k = (t - d.tLight) / 0.3; if (k <= 0) continue;
    const grow = k >= 1 ? 1 : easeOutBack(k);
    flame(d.x + 50 * d.sc, d.y - 17 * d.sc, 34 * d.sc * grow, t, i + 1);
  }
  // fireworks
  ctx.globalCompositeOperation = 'lighter';
  for (const b of BURSTS) {
    const dt = t - b.t;
    if (dt > -0.55 && dt < 0) {            // rocket climbing
      const k = (dt + 0.55) / 0.55, y0 = Math.min(b.y + 300, 640), y = y0 + (b.y - y0) * easeOut(k);
      const g = ctx.createLinearGradient(b.x, y, b.x, y + 70); g.addColorStop(0, 'rgba(255,230,170,0.9)'); g.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + Math.sin(k * 9) * 3, y + 70); ctx.stroke();
      ctx.fillStyle = 'rgba(255,248,225,1)'; ctx.beginPath(); ctx.arc(b.x, y, 3.2, 0, 7); ctx.fill();
    }
    if (dt < 0 || dt > 2.3) continue;
    if (dt < 0.3) { const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 230);
      g.addColorStop(0, `rgba(255,240,210,${0.55 * (1 - dt / 0.3)})`); g.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, 230, 0, 7); ctx.fill(); }
    { const gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 260);   // coloured haze of the burst
      const ha = 0.2 * Math.max(0, 1 - dt / 1.6);
      gr.addColorStop(0, b.parts[0].col + Math.round(ha * 255).toString(16).padStart(2, '0')); gr.addColorStop(1, b.parts[0].col + '00');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(b.x, b.y, 260, 0, 7); ctx.fill(); }
    const pos = (p, tt) => { const d = (1 - Math.exp(-2.4 * tt)) / 2.4; return [b.x + p.vx * d, b.y + p.vy * d + 0.5 * 60 * tt * tt]; };
    for (const p of b.parts) {
      if (dt > p.life) continue;
      let a = Math.pow(1 - dt / p.life, 1.4);
      if (dt > 0.8) a *= 0.55 + 0.45 * Math.sin(dt * 40 + p.ph);
      const [x1, y1] = pos(p, dt), [x0, y0] = pos(p, Math.max(0, dt - 0.2));
      ctx.globalAlpha = Math.max(0, a); ctx.strokeStyle = p.col; ctx.lineWidth = p.w; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.arc(x1, y1, p.w * 0.9, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
}

let glowC = null, gctx = null;
function haloGlow(h, a) {
  const R = h.r * 1.9, S = Math.ceil(R * 2), c = S / 2, r0 = h.r / R;
  if (!glowC) { glowC = document.createElement('canvas'); gctx = glowC.getContext('2d'); }
  glowC.width = S; glowC.height = S;
  const g = gctx.createRadialGradient(c, c, 0, c, c, R);
  g.addColorStop(0, 'rgba(255,200,90,0)'); g.addColorStop(r0 * 0.99, 'rgba(255,200,90,0)');
  g.addColorStop(Math.min(1, r0 * 1.03), `rgba(255,205,105,${0.5 * a})`);
  g.addColorStop(r0 + (1 - r0) * 0.35, `rgba(255,160,60,${0.16 * a})`); g.addColorStop(1, 'rgba(255,140,40,0)');
  gctx.fillStyle = g; gctx.fillRect(0, 0, S, S);
  gctx.globalCompositeOperation = 'destination-in';
  const m = gctx.createLinearGradient(0, 0, 0, S);
  m.addColorStop(0, '#000'); m.addColorStop(0.5, '#000'); m.addColorStop(0.75, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  gctx.fillStyle = m; gctx.fillRect(0, 0, S, S);
  gctx.globalCompositeOperation = 'source-over';
  ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glowC, h.x - c, h.y - c);
  ctx.globalCompositeOperation = 'source-over';
}

function goldText(str, x, y, size) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.08; ctx.strokeStyle = 'rgba(38,10,4,0.92)'; ctx.strokeText(str, x, y);
  const g = ctx.createLinearGradient(0, y - size * 0.55, 0, y + size * 0.5);
  g.addColorStop(0, '#fff4c8'); g.addColorStop(0.45, '#ffc94a'); g.addColorStop(1, '#e8801a');
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(255,165,50,0.9)'; ctx.shadowBlur = size * 0.35; ctx.fillText(str, x, y);
  ctx.shadowBlur = 0; ctx.fillText(str, x, y);
}
let titleSize = 170;
function drawText(t) {
  const a1 = clamp01((t - T.text1) / 0.6);
  if (a1 > 0) {
    const e = easeOut(a1);
    ctx.save(); ctx.globalAlpha = e; ctx.translate(W / 2, 175 + (1 - e) * 26); ctx.scale(0.9 + 0.1 * e, 0.9 + 0.1 * e);
    ctx.font = '84px Yatra'; goldText('जय श्री राम', 0, 0, 84); ctx.restore();
  }
  const a2 = clamp01((t - T.text2) / 0.9);
  if (a2 > 0) {
    ctx.font = `${titleSize}px Yatra`;
    const tw = ctx.measureText('Happy Diwali').width, x0 = W / 2 - tw / 2 - 40, span = tw + 80, e = easeInOut(a2);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 180, span * e, 330); ctx.clip();
    goldText('Happy Diwali', W / 2, 345, titleSize); ctx.restore();
    if (a2 < 1) {                          // sparkle riding the reveal edge
      const sx = x0 + span * e, sy = 345 + Math.sin(a2 * 9) * 30;
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 60); g.addColorStop(0, 'rgba(255,250,220,0.95)'); g.addColorStop(1, 'rgba(255,200,90,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 60, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    }
  }
}

function vignette() {
  const g = ctx.createRadialGradient(W / 2, H * 0.47, W * 0.55, W / 2, H * 0.47, H * 0.68);
  g.addColorStop(0, 'rgba(8,3,10,0)'); g.addColorStop(1, 'rgba(8,3,10,0.5)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ── frame API (called by tools/render.cjs) ─────────────────────────────────────
let opIdx = 0;
window.setupScene = async () => {
  const faces = [
    new FontFace('Yatra', 'url(fonts/yatra-one-latin-400-normal.woff2)', { unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' }),
    new FontFace('Yatra', 'url(fonts/yatra-one-devanagari-400-normal.woff2)', { unicodeRange: 'U+0900-097F, U+1CD0-1CF9, U+200C-200D, U+20A8, U+20B9, U+25CC, U+A830-A839, U+A8E0-A8FF' }),
  ];
  for (const f of faces) { await f.load(); document.fonts.add(f); }
  brush.createCanvas(W, H, { parent: document.body, pixelDensity: 1 });
  brushCanvas = document.querySelector('canvas');
  brush.scaleBrushes(4.6); brush.angleMode(brush.DEGREES); brush.seed(11); brush.noiseSeed(11);
  brush.clear('#f3e7cf'); brush.render();
  out = document.createElement('canvas'); out.width = W; out.height = H; ctx = out.getContext('2d');
  ctx.font = `${titleSize}px Yatra`;
  const tw = ctx.measureText('Happy Diwali').width; if (tw > 960) titleSize = Math.floor(titleSize * 960 / tw);
  build();
  return { ops: ops.length, frames: Math.round(DUR * FPS), titleSize, bursts: window.BURSTS_T, diyas: diyas.map(d => d.tLight), opTimes: ops.map(o => +o.t.toFixed(3)) };
};
window.renderFrame = (fr, capture) => {
  const t = fr / FPS;
  let n = 0;
  brush.push(); brush.translate(-W / 2, -H / 2);
  while (opIdx < ops.length && ops[opIdx].t <= t + 1e-6) { ops[opIdx].fn(); opIdx++; n++; }
  brush.pop();
  if (n) brush.render();
  // slow push-in on the painting
  const z = 1 + 0.05 * easeInOut(clamp01(t / DUR)), cx = W / 2, cy = 960;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(z, 0, 0, z, cx * (1 - z), cy * (1 - z));
  ctx.drawImage(brushCanvas, 0, 0, W, H);
  drawLights(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  vignette();
  drawText(t);
  return capture ? out.toDataURL('image/jpeg', 0.93) : n;
};
