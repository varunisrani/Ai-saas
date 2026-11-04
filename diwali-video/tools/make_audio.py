"""Build the whole soundtrack in code and mix the Kokoro voice over it.

Music bed: tanpura-style drone (C#: Pa-Sa-Sa-low Sa) + soft santoor pattern in raag Bhupali.
SFX:       temple bells, a rising chime per diya as it lights, firework whistle/boom/crackle
           (panned to where each burst is on screen), soft paper-brush swishes while painting,
           and a light tabla-like groove under the fireworks.
Voice:     voice/wav/*.wav placed at their start times (voice/lines.json).
Mix:       voice −16 LUFS, bed ducked under the voice, total −14 LUFS, peaks ≤ −1 dBFS.

Usage: python -I tools/make_audio.py <project_dir>
"""
import json, pathlib, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve

root = pathlib.Path(sys.argv[1])
SR, DUR = 48000, 21.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
info = json.loads((root / "out/scene_info.json").read_text())
lines = json.loads((root / "voice/lines.json").read_text())["lines"]

def tt(d): return np.arange(int(d * SR)) / SR
def bp(x, lo, hi, order=4): return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)
def lp(x, f, order=4): return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)
def hp(x, f, order=4): return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)

music = np.zeros((2, N)); sfx = np.zeros((2, N))
def add(bus, sig, t, pan=0.0, gain=1.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0: return
    s = sig * gain
    if i < 0: s, i = s[-i:], 0
    j = min(N, i + len(s)); s = s[: j - i]
    a = (pan + 1) * np.pi / 4
    bus[0, i:j] += s * np.cos(a) * 1.414; bus[1, i:j] += s * np.sin(a) * 1.414

# ── instruments ───────────────────────────────────────────────────────────────
def tanpura(f, dur=4.2):
    t = tt(dur); out = np.zeros_like(t)
    for k in range(1, 45):
        fk = f * k
        if fk > 8000: break
        bloom = 1 - np.exp(-t / (0.04 + 0.025 * k))               # jawari: upper partials bloom
        amp = k ** -0.85 * np.exp(-t * (0.55 + 0.035 * k)) * (0.55 + 0.45 * bloom * (k > 3))
        out += amp * np.sin(2 * np.pi * fk * t * (1 + 0.0005 * np.sin(2 * np.pi * 0.37 * t)) + rng.uniform(0, 6.28))
    return out * np.minimum(1, t / 0.008) / 3.0

def santoor(f, dur=1.9):
    t = tt(dur); out = np.zeros_like(t)
    for i, (r, a) in enumerate([(1, 1), (2.004, 0.45), (3.012, 0.22), (4.03, 0.1), (5.05, 0.05)]):
        d = 2.0 + 1.4 * i
        out += a * np.exp(-t * d) * (np.sin(2 * np.pi * f * r * t) + 0.7 * np.sin(2 * np.pi * (f * r + 1.3) * t))
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.25
    return (out * np.minimum(1, t / 0.002) + click) / 2.2

def bell(f0, dur=7.0):
    t = tt(dur); out = np.zeros_like(t)
    parts = [(0.5, .45, .22), (1.0, 1, .32), (1.19, .55, .5), (1.56, .45, .6), (2.0, .38, .8), (2.51, .28, 1.0),
             (2.66, .22, 1.1), (3.01, .18, 1.3), (4.1, .1, 1.9), (5.2, .07, 2.6)]
    for r, a, d in parts:
        out += a * np.exp(-t * d) * (np.sin(2 * np.pi * f0 * r * t) + 0.6 * np.sin(2 * np.pi * (f0 * r + 0.9) * t + 1))
    strike = bp(rng.standard_normal(len(t)), 1800, 7000) * np.exp(-t / 0.012) * 0.6
    return (out * np.minimum(1, t / 0.001) + strike) / 3.5

def whistle(dur=0.55):
    t = tt(dur); f = 1300 + 1700 * (t / dur) ** 0.8 + 40 * np.sin(2 * np.pi * 23 * t)
    ph = np.cumsum(2 * np.pi * f / SR)
    env = np.sin(np.pi * np.minimum(1, t / dur)) ** 0.6
    return (0.5 * np.sin(ph) + 0.5 * bp(rng.standard_normal(len(t)), 1500, 5000)) * env

def boom():
    t = tt(1.6)
    body = lp(rng.standard_normal(len(t)), 700) * np.exp(-t / 0.32) * 2.2
    thump = np.sin(2 * np.pi * (58 - 18 * t) * t) * np.exp(-t / 0.22) * 0.9
    crack = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.018) * 0.7
    return body + thump + crack

def crackle(dur=1.5):
    out = np.zeros(int(dur * SR)); t = 0.0
    while t < dur:
        t += rng.exponential(0.006 + 0.05 * (t / dur) ** 1.5)
        i = int(t * SR); g = int(0.0025 * SR)
        if i + g >= len(out): break
        out[i:i + g] += rng.standard_normal(g) * np.exp(-np.arange(g) / (0.0006 * SR)) * rng.uniform(0.2, 1)
    return hp(out, 2200) * 0.9

def swish(dur=0.24):
    t = tt(dur); env = np.sin(np.pi * t / dur) ** 2
    return bp(rng.standard_normal(len(t)), 1400, 5500, 2) * env

def fwoomp():
    t = tt(0.35); return lp(rng.standard_normal(len(t)), 420) * np.sin(np.pi * np.minimum(1, t / 0.35)) ** 1.5 * 1.6

def drum(kind):
    t = tt(0.6)
    if kind == "bass":   # dha/ge-ish low membrane with pitch drop
        return np.sin(2 * np.pi * (95 * np.exp(-t * 3) + 62) * t) * np.exp(-t / 0.28) + lp(rng.standard_normal(len(t)), 300) * np.exp(-t / 0.02) * 0.3
    if kind == "ring":   # na/tin ringing stroke
        return (np.sin(2 * np.pi * 420 * t) + 0.5 * np.sin(2 * np.pi * 846 * t) + 0.25 * np.sin(2 * np.pi * 1290 * t)) * np.exp(-t / 0.13) * 0.55 \
            + bp(rng.standard_normal(len(t)), 2000, 6000) * np.exp(-t / 0.008) * 0.3
    return bp(rng.standard_normal(len(t)), 2500, 8000) * np.exp(-t / 0.015) * 0.5   # ti/ka tick

# ── music bed ─────────────────────────────────────────────────────────────────
SA = 138.59  # C#3
plucks = [tanpura(SA * 1.5 / 2), tanpura(SA), tanpura(SA), tanpura(SA / 2)]   # Pa(low) Sa Sa Sa(low)
t, k = 0.15, 0
while t < DUR:
    add(music, plucks[k % 4], t, pan=[-0.3, 0.2, 0.25, -0.1][k % 4], gain=0.55)
    t += 0.8; k += 1

bhupali = [277.18, 311.13, 349.23, 415.30, 466.16, 554.37, 622.25, 698.46, 830.61, 932.33, 1108.73, 1244.51, 1396.91, 1661.22]
motif = [5, 7, 8, 9, 10, 9, 8, 7, 5, 7, 8, 7, 5, 4, 3, 4]
t, k = 1.2, 0
while t < DUR - 0.5:
    n = motif[k % len(motif)]
    add(music, santoor(bhupali[n]), t, pan=0.35 * np.sin(k * 0.7), gain=0.16 + 0.05 * (k % 4 == 0))
    t += 0.4; k += 1

# celebration groove under the fireworks (keherwa-like: dha ge na ti | na ka dhi na)
pattern = [("bass", "ring"), ("bass",), ("ring",), ("tick",), ("ring",), ("tick",), ("bass", "ring"), ("ring",)]
t, k = info["bursts"][0], 0
while t < DUR - 0.4:
    fade = min(1, k / 8)
    for kind in pattern[k % 8]:
        add(music, drum(kind), t, pan=0.0 if kind == "bass" else 0.15, gain=0.32 * fade)
    t += 0.3; k += 1

# ── sfx ───────────────────────────────────────────────────────────────────────
add(sfx, bell(554.37), 0.12, pan=0.0, gain=0.55)                  # opening temple bell
add(sfx, bell(554.37), 16.38, pan=0.0, gain=0.6)                  # "Happy Diwali"
for i, n in enumerate([5, 6, 7, 8, 9, 10, 11, 12, 13]):           # sparkle run on the title reveal
    add(sfx, santoor(bhupali[n]), 16.4 + i * 0.08, pan=-0.6 + i * 0.15, gain=0.32)

diyaX = [75 + i * 116.25 for i in range(9)] + [540]
for i, td in enumerate(info["diyas"]):
    pan = (diyaX[i] / 540 - 1) * 0.7
    add(sfx, fwoomp(), td, pan=pan, gain=0.25)
    if i < 9: add(sfx, santoor(bhupali[5 + i]), td + 0.02, pan=pan, gain=0.42)
    else: add(sfx, bell(1108.73, 4.0), td, pan=0.0, gain=0.35)

BX = [260, 820, 540, 130, 950, 300, 790, 160, 920, 420, 700, 240, 860]
for tb, x in zip(info["bursts"], BX):
    pan = (x / 540 - 1) * 0.8
    add(sfx, whistle(), tb - 0.55, pan=pan * 0.6, gain=0.07)
    add(sfx, boom(), tb, pan=pan, gain=0.42)
    add(sfx, crackle(), tb + 0.7, pan=pan, gain=0.28)

last = -1.0
for to in info.get("opTimes", []):
    if to > 11.5 or to - last < 0.13: continue
    add(sfx, swish(), to - 0.04, pan=rng.uniform(-0.4, 0.4), gain=0.05); last = to

# ── reverb ────────────────────────────────────────────────────────────────────
def ir(sec, decay):
    t = tt(sec); env = np.exp(-t * decay)
    l, r = (lp(rng.standard_normal(len(t)), 6000) * env for _ in range(2))
    return l / np.sqrt(np.sum(l ** 2)), r / np.sqrt(np.sum(r ** 2))
irL, irR = ir(2.6, 2.6)
def verb(bus, wet):
    return np.stack([bus[0] + wet * fftconvolve(bus[0], irL)[:N], bus[1] + wet * fftconvolve(bus[1], irR)[:N]])
bed = verb(music, 0.35) + verb(sfx, 0.22)
fade = np.ones(N); fi, fo = int(0.05 * SR), int(0.9 * SR)
fade[:fi] = np.linspace(0, 1, fi); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
bed *= fade

# ── voice ─────────────────────────────────────────────────────────────────────
voice = np.zeros(N)
for ln in lines:
    v, vsr = sf.read(root / f"voice/wav/{ln['id']}.wav", dtype="float64")
    if v.ndim > 1: v = v.mean(axis=1)
    v = resample_poly(v, SR, vsr)
    i = int(ln["start"] * SR); j = min(N, i + len(v)); voice[i:j] += v[: j - i]
voice = hp(voice, 80, 2)
meter = pyln.Meter(SR)
voice = pyln.normalize.loudness(voice, meter.integrated_loudness(voice), -16.0)
vst = np.stack([voice, voice]) * 0.7071 * 1.414
vst = vst + 0.06 * np.stack([fftconvolve(voice, irL)[:N], fftconvolve(voice, irR)[:N]])
vst = pyln.normalize.loudness(vst.T, meter.integrated_loudness(vst.T), -16.0).T   # stereo voice at −16 LUFS

# bed level, then duck it under the voice
bed = pyln.normalize.loudness(bed.T, meter.integrated_loudness(bed.T), -19.0).T
env = np.sqrt(np.convolve(voice ** 2, np.ones(int(0.05 * SR)) / int(0.05 * SR), mode="same"))
thr = np.percentile(env[env > 1e-4], 50) if np.any(env > 1e-4) else 1
target = 1 - 0.55 * np.clip(env / thr, 0, 1)                      # up to ~ −7 dB
duck = np.empty(N); g = 1.0
a_att, a_rel = np.exp(-1 / (0.03 * SR)), np.exp(-1 / (0.35 * SR))
for n in range(N):
    x = target[n]; a = a_att if x < g else a_rel; g = a * g + (1 - a) * x; duck[n] = g
mix = bed * duck + vst

# master: −14 LUFS, then a look-ahead peak limiter at −1 dBFS
mix = pyln.normalize.loudness(mix.T, meter.integrated_loudness(mix.T), -14.0).T
ceil = 10 ** (-1 / 20)
peak = np.max(np.abs(mix), axis=0)
need = np.minimum(1, ceil / np.maximum(peak, 1e-9))
look = int(0.005 * SR)
from scipy.ndimage import minimum_filter1d, uniform_filter1d
gmin = minimum_filter1d(need, size=2 * look + 1)
gsm = np.minimum(gmin, uniform_filter1d(gmin, size=look))
mix = mix * gsm
mix = np.clip(mix, -ceil, ceil)

(root / "audio").mkdir(exist_ok=True)
sf.write(root / "audio/bed.wav", bed.T, SR, subtype="PCM_24")
sf.write(root / "audio/voice_track.wav", vst.T, SR, subtype="PCM_24")
sf.write(root / "audio/final_mix.wav", mix.T, SR, subtype="PCM_24")
print("voice LUFS", round(meter.integrated_loudness(vst.T), 1),
      "| mix LUFS", round(meter.integrated_loudness(mix.T), 1),
      "| peak dBFS", round(20 * np.log10(np.max(np.abs(mix))), 2),
      "| max duck dB", round(20 * np.log10(duck.min()), 1))
