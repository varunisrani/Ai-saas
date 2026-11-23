// Renders an ArtDescriptor to an own SVG placeholder (section 20, D-UI-6): a two-colour palette gradient,
// a simple motif chosen by kind and a small caption label.
import { artPalette, type ArtDescriptor } from "@/data";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function motif(d: ArtDescriptor, w: number, h: number, ink: string, accent: string): string {
  const v = d.variant;
  switch (d.motif) {
    case "silhouette": {
      const y = h * 0.62;
      const bw = w * (0.5 + v * 0.03);
      const x = (w - bw) / 2;
      return `<g opacity="0.85"><rect x="${x}" y="${y - h * 0.16}" width="${bw}" height="${h * 0.16}" rx="${h * 0.05}" fill="${ink}"/>
<path d="M${x + bw * 0.18} ${y - h * 0.15} L${x + bw * 0.32} ${y - h * 0.3} L${x + bw * 0.66} ${y - h * 0.3} L${x + bw * 0.82} ${y - h * 0.15} Z" fill="${ink}"/>
<circle cx="${x + bw * 0.22}" cy="${y}" r="${h * 0.07}" fill="${accent}"/><circle cx="${x + bw * 0.78}" cy="${y}" r="${h * 0.07}" fill="${accent}"/></g>`;
    }
    case "bars": {
      let out = "";
      for (let i = 0; i < 4; i++) {
        const bw = w * (0.35 + ((v + i * 3) % 5) * 0.08);
        out += `<rect x="${w * 0.12}" y="${h * (0.25 + i * 0.13)}" width="${bw}" height="${h * 0.07}" rx="${h * 0.03}" fill="${i % 2 ? accent : ink}" opacity="0.85"/>`;
      }
      return out;
    }
    case "leaf":
      return `<path d="M${w * 0.3} ${h * 0.78} C ${w * 0.25} ${h * 0.35}, ${w * 0.55} ${h * 0.18}, ${w * 0.78} ${h * 0.22} C ${w * 0.74} ${h * 0.5}, ${w * 0.55} ${h * 0.78}, ${w * 0.3} ${h * 0.78} Z" fill="${ink}" opacity="0.8"/>
<path d="M${w * 0.3} ${h * 0.78} Q ${w * 0.52} ${h * 0.5} ${w * 0.78} ${h * 0.22}" stroke="${accent}" stroke-width="${Math.max(2, w * 0.008)}" fill="none"/>`;
    case "wave": {
      let out = "";
      for (let i = 0; i < 3; i++) {
        const y = h * (0.45 + i * 0.12);
        out += `<path d="M0 ${y} C ${w * 0.25} ${y - h * 0.08}, ${w * 0.5} ${y + h * 0.08}, ${w * 0.75} ${y} S ${w} ${y - h * 0.06}, ${w} ${y}" stroke="${i === 1 ? accent : ink}" stroke-width="${Math.max(3, h * 0.025)}" fill="none" opacity="0.85"/>`;
      }
      return out;
    }
    case "bust":
      return `<circle cx="${w / 2}" cy="${h * 0.38}" r="${Math.min(w, h) * 0.16}" fill="${ink}" opacity="0.85"/>
<path d="M${w * 0.22} ${h * 0.92} C ${w * 0.25} ${h * 0.6}, ${w * 0.75} ${h * 0.6}, ${w * 0.78} ${h * 0.92} Z" fill="${ink}" opacity="0.85"/>
<path d="M${w * 0.3} ${h * 0.92} C ${w * 0.35} ${h * 0.7}, ${w * 0.65} ${h * 0.7}, ${w * 0.7} ${h * 0.92}" stroke="${accent}" stroke-width="${Math.max(2, w * 0.01)}" fill="none"/>`;
    case "horizon": {
      let out = `<circle cx="${w * (0.25 + v * 0.07)}" cy="${h * 0.35}" r="${Math.min(w, h) * 0.12}" fill="${accent}" opacity="0.9"/>`;
      for (let i = 0; i < 3; i++) {
        out += `<rect x="0" y="${h * (0.58 + i * 0.1)}" width="${w}" height="${Math.max(2, h * 0.015)}" fill="${ink}" opacity="${0.8 - i * 0.2}"/>`;
      }
      return out;
    }
    case "dunes":
      return `<circle cx="${w * (0.62 + (v % 4) * 0.06)}" cy="${h * 0.32}" r="${Math.min(w, h) * 0.13}" fill="${accent}" opacity="0.95"/>
<path d="M0 ${h * 0.7} C ${w * 0.2} ${h * 0.55}, ${w * 0.4} ${h * 0.75}, ${w * 0.62} ${h * 0.62} S ${w * 0.9} ${h * 0.58}, ${w} ${h * 0.66} L ${w} ${h} L 0 ${h} Z" fill="${ink}" opacity="0.55"/>
<path d="M0 ${h * 0.82} C ${w * 0.25} ${h * 0.72}, ${w * 0.5} ${h * 0.9}, ${w * 0.75} ${h * 0.78} S ${w} ${h * 0.8}, ${w} ${h * 0.82} L ${w} ${h} L 0 ${h} Z" fill="${ink}" opacity="0.8"/>`;
    case "monogram":
      return `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.42}" fill="${ink}" opacity="0.9"/>
<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.36}" fill="none" stroke="${accent}" stroke-width="${Math.max(2, w * 0.02)}"/>`;
    case "island":
      return `<path d="M${w * 0.2} ${h * 0.6} C ${w * 0.15} ${h * 0.3}, ${w * 0.45} ${h * 0.15}, ${w * 0.62} ${h * 0.25} C ${w * 0.85} ${h * 0.3}, ${w * 0.86} ${h * 0.65}, ${w * 0.6} ${h * 0.8} C ${w * 0.4} ${h * 0.9}, ${w * 0.25} ${h * 0.8}, ${w * 0.2} ${h * 0.6} Z" fill="#F6EEDF" opacity="0.92"/>
<circle cx="${w * (0.4 + v * 0.03)}" cy="${h * 0.5}" r="${Math.min(w, h) * 0.04}" fill="${accent}"/>`;
    case "play":
      return `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.16}" fill="${ink}" opacity="0.85"/>
<path d="M${w / 2 - Math.min(w, h) * 0.05} ${h / 2 - Math.min(w, h) * 0.08} L ${w / 2 + Math.min(w, h) * 0.08} ${h / 2} L ${w / 2 - Math.min(w, h) * 0.05} ${h / 2 + Math.min(w, h) * 0.08} Z" fill="${accent}"/>`;
  }
  return "";
}

export function renderArtSvg(d: ArtDescriptor): string {
  const w = d.width;
  const h = d.height;
  const from = artPalette[d.palette[0]] ?? "#0E4D4F";
  const to = artPalette[d.palette[1]] ?? "#1F8A8A";
  const dark = (luminance(from) + luminance(to)) / 2 < 0.35;
  const ink = dark ? "#F6EEDF" : "#14161B";
  const accent = from === "#FF6A4D" || to === "#FF6A4D" ? (dark ? "#F6EEDF" : "#0E4D4F") : "#FF6A4D";
  const isLogo = d.kind === "logo";
  const label = esc(d.label);
  const fontSize = isLogo ? Math.round(Math.min(w, h) * 0.34) : Math.max(12, Math.round(Math.min(w, h) * 0.065));
  const text = isLogo
    ? `<text x="${w / 2}" y="${h / 2 + fontSize * 0.35}" text-anchor="middle" font-family="Space Grotesk, Arial, sans-serif" font-weight="700" font-size="${fontSize}" fill="#F6EEDF">${label}</text>`
    : `<rect x="${w * 0.04}" y="${h - fontSize * 2.4}" rx="${fontSize * 0.5}" width="${Math.min(w * 0.92, label.length * fontSize * 0.62 + fontSize * 1.4)}" height="${fontSize * 1.7}" fill="#14161B" opacity="0.62"/>
<text x="${w * 0.04 + fontSize * 0.7}" y="${h - fontSize * 1.18}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="${fontSize}" fill="#FFFFFF">${label}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g)"/>
${motif(d, w, h, ink, accent)}
${text}
</svg>`;
}
