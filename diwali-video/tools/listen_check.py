"""Machine listen-check: run Whisper on the final mix and compare with the script.

Reports, per scripted line, the words Whisper heard around that line's start time,
how many script words it matched, and the timing offset of the first matched word.
Usage: python -I tools/listen_check.py <project_dir> [audio_file]
"""
import json, pathlib, re, sys
from difflib import SequenceMatcher
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from faster_whisper import WhisperModel

root = pathlib.Path(sys.argv[1])
audio = sys.argv[2] if len(sys.argv) > 2 else str(root / "audio/final_mix.wav")
lines = json.loads((root / "voice/lines.json").read_text())["lines"]
model = WhisperModel("small.en", device="cpu", compute_type="int8")
x, sr = sf.read(audio, dtype='float32')
x = x.mean(axis=1) if x.ndim > 1 else x
x = resample_poly(x, 16000, sr).astype(np.float32)   # Whisper wants 16 kHz mono
segs, _ = model.transcribe(x, word_timestamps=True, beam_size=5, vad_filter=False,
                           initial_prompt="Diwali, Ayodhya, Shri Ram, Sita, Lakshman, Hanuman, diyas, Jai Shri Ram.")
words = [(w.start, w.end, w.word.strip()) for s in segs for w in s.words]
norm = lambda x: re.sub(r"[^a-z]", "", x.lower())
print("Whisper heard:", " ".join(w for _, _, w in words), "\n")
ok_all = True
for i, ln in enumerate(lines):
    t0 = ln["start"] - 0.3
    t1 = lines[i + 1]["start"] - 0.1 if i + 1 < len(lines) else 99
    heard = [(s, w) for s, e, w in words if t0 <= s < t1]
    script = [norm(w) for w in ln["text"].split()]
    got = [norm(w) for _, w in heard]
    m = SequenceMatcher(None, script, got)
    matched = sum(b.size for b in m.get_matching_blocks())
    off = (heard[0][0] - ln["start"]) if heard else None
    ok = matched >= len(script) - 1
    ok_all &= ok
    print(f"{ln['id']} {'OK ' if ok else 'CHECK'} {matched}/{len(script)} words | starts {off:+.2f}s | "
          f"script: {ln['text']} | heard: {' '.join(w for _, w in heard)}" if heard else f"{ln['id']} MISSING | {ln['text']}")
print("\nALL LINES OK" if ok_all else "\nSOME LINES NEED A LOOK")
