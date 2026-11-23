# merge batch run files into one run file in case-file order; later batches win unless they errored and an
# earlier one did not. usage: python3 merge.py cases.json out.json batch1.json batch2.json ...
import json, sys
cases = [c['id'] for c in json.load(open(sys.argv[1]))]
out = sys.argv[2]
best = {}
meta = None
for f in sys.argv[3:]:
    r = json.load(open(f))
    meta = meta or {k: v for k, v in r.items() if k != 'cases'}
    for c in r['cases']:
        prev = best.get(c['id'])
        if prev is None or not c.get('error') or prev.get('error'):
            best[c['id']] = dict(c, batch=f.split('/')[-1])
missing = [i for i in cases if i not in best]
res = dict(meta, captured_batches=[f.split('/')[-1] for f in sys.argv[3:]], cases=[best[i] for i in cases if i in best])
json.dump(res, open(out, 'w'), indent=1)
print('merged', len(res['cases']), 'missing', missing, 'errors', [c['id'] for c in res['cases'] if c.get('error')])
