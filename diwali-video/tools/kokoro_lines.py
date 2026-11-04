"""Render each line in voice/lines.json to its own WAV with Kokoro (kokoro-onnx).

Hindi names are fixed by swapping Kokoro's guessed phonemes for hand-written ones.
Usage: python -I tools/kokoro_lines.py <project_dir> [--voice af_heart] [--speed 1.0]
"""
import argparse, json, pathlib
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

FIX = {  # Kokoro's guess -> how it is said in Hindi
    "ˈaɪədɪə": "əjˈoʊdjɑː",      # Ayodhya  (a-YOHD-yaa)
    "ʃɹˈaɪ": "ʃɹˈiː",            # Shri     (shree)
    "ɹˈæm": "ɹˈɑːm",             # Ram      (raam)
    "sˈiːɾə": "sˈiːtɑː",          # Sita     (SEE-taa)
    "lˈækʃmən": "lˈʌkʃmən",      # Lakshman (LUCK-shmun)
    "hˈænuːmən": "hˈʌnʊmɑːn",    # Hanuman  (HUN-oo-maan)
    "dˈɪjəz": "dˈiːjɑːz",        # diyas    (DEE-yaaz)
}

ap = argparse.ArgumentParser()
ap.add_argument("project"); ap.add_argument("--voice", default=None)
ap.add_argument("--speed", type=float, default=1.0)
a = ap.parse_args()
root = pathlib.Path(a.project)
cfg = json.loads((root / "voice/lines.json").read_text())
voice = a.voice or cfg.get("voice", "af_heart")
k = Kokoro("/root/kokoro/kokoro-v1.0.onnx", "/root/kokoro/voices-v1.0.bin")
out = root / "voice/wav"; out.mkdir(parents=True, exist_ok=True)
report = []
for ln in cfg["lines"]:
    ph = ln.get("phonemes") or k.tokenizer.phonemize(ln["text"], lang="en-us")
    for bad, good in FIX.items():
        ph = ph.replace(bad, good)
    audio, sr = k.create(ph, voice=voice, speed=ln.get("speed", a.speed), is_phonemes=True)
    audio = np.asarray(audio, dtype=np.float32)
    # trim leading/trailing silence (−45 dB), keep 30 ms pad
    thr = 10 ** (-45 / 20) * np.max(np.abs(audio))
    idx = np.where(np.abs(audio) > thr)[0]
    pad = int(0.03 * sr)
    audio = audio[max(0, idx[0] - pad): min(len(audio), idx[-1] + pad)]
    sf.write(out / f"{ln['id']}.wav", audio, sr)
    report.append({"id": ln["id"], "start": ln["start"], "dur": round(len(audio) / sr, 2), "phonemes": ph})
for r in report:
    print(f"{r['id']}  start {r['start']:5.2f}  dur {r['dur']:4.2f}  end {r['start']+r['dur']:5.2f}  | {r['phonemes']}")
(root / "voice/durations.json").write_text(json.dumps(report, indent=1, ensure_ascii=False))
