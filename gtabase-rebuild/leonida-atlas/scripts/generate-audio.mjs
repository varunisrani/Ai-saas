#!/usr/bin/env node
// Generates the radio player's own short audio clips (section 19.3, R-1622, DIVERGENCE D-009) into public/audio/.
// Reads the clip recipes (`audioClips`) from src/data (transpiled on the fly with the TypeScript compiler) and
// renders each one deterministically: a looped melody of semitone steps over a root note, one note per beat,
// with a soft attack/release envelope, 16-bit mono PCM WAV. Usage: node scripts/generate-audio.mjs
import { createRequire } from "node:module";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));
const ts = require("typescript");

function loadData() {
  const srcDir = join(root, "src", "data");
  const out = mkdtempSync(join(tmpdir(), "atlas-data-"));
  for (const f of readdirSync(srcDir)) {
    if (!f.endsWith(".ts") || f.endsWith(".test.ts")) continue;
    const code = readFileSync(join(srcDir, f), "utf8");
    const js = ts.transpileModule(code, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
      fileName: f,
    }).outputText;
    writeFileSync(join(out, f.replace(/\.ts$/, ".js")), js);
  }
  try {
    return createRequire(join(out, "index.js"))("./index.js");
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

function wave(kind, phase) {
  const x = phase - Math.floor(phase);
  switch (kind) {
    case "square":
      return x < 0.5 ? 0.6 : -0.6;
    case "sawtooth":
      return (2 * x - 1) * 0.7;
    case "triangle":
      return 1 - 4 * Math.abs(x - 0.5);
    default:
      return Math.sin(2 * Math.PI * x);
  }
}

function render(clip) {
  const rate = clip.sampleRate;
  const total = Math.round(clip.seconds * rate);
  const beat = 60 / clip.bpm;
  const samples = new Int16Array(total);
  let phase = 0;
  let bassPhase = 0;
  for (let i = 0; i < total; i++) {
    const t = i / rate;
    const n = Math.floor(t / beat);
    const inBeat = t - n * beat;
    const step = clip.steps[n % clip.steps.length];
    const freq = clip.baseHz * 2 ** (step / 12);
    phase += freq / rate;
    bassPhase += clip.baseHz / 2 / rate;
    const attack = Math.min(1, inBeat / 0.02);
    const release = Math.max(0, 1 - inBeat / beat) ** 1.5;
    const fadeIn = Math.min(1, t / 0.3);
    const fadeOut = Math.min(1, (clip.seconds - t) / 0.5);
    const env = attack * release * fadeIn * fadeOut;
    const v = 0.28 * env * wave(clip.waveform, phase) + 0.12 * fadeIn * fadeOut * Math.sin(2 * Math.PI * bassPhase);
    samples[i] = Math.max(-1, Math.min(1, v)) * 32767;
  }
  const data = Buffer.from(samples.buffer);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const { audioClips } = loadData();
const outDir = join(root, "public", "audio");
mkdirSync(outDir, { recursive: true });
for (const clip of audioClips) {
  const file = join(root, "public", clip.file.replace(/^\//, ""));
  writeFileSync(file, render(clip));
  console.log(`${clip.file}  ${clip.seconds}s  ${clip.waveform} @ ${clip.baseHz} Hz`);
}
