"""Losslessly archive only audit-owned JSONL files and verify exact bytes."""
from pathlib import Path
import gzip, hashlib, json
BASE=Path(__file__).resolve().parent
manifest=[]
for p in sorted((BASE/'runs').rglob('*.jsonl')):
    data=p.read_bytes(); target=Path(str(p)+'.gz')
    target.write_bytes(gzip.compress(data,compresslevel=6,mtime=0))
    assert gzip.decompress(target.read_bytes())==data
    manifest.append({'path':str(target.relative_to(BASE)),'uncompressedBytes':len(data),'compressedBytes':target.stat().st_size,'uncompressedSha256':hashlib.sha256(data).hexdigest(),'compressedSha256':hashlib.sha256(target.read_bytes()).hexdigest()})
    p.unlink()  # only the now byte-verified redundant plaintext, not evidence
(BASE/'compression-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'files':len(manifest),'rawBytes':sum(r['uncompressedBytes'] for r in manifest),'gzipBytes':sum(r['compressedBytes'] for r in manifest),'exactByteVerification':True},indent=2))
