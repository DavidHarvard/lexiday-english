"""Create a Cloudflare Direct Upload archive containing only deployable static files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib, json, sys
root=Path(__file__).resolve().parent.parent
out=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/lexiday-cloudflare-pages-vocabulary.zip')
files=sorted(p for p in (root/'dist').rglob('*') if p.is_file() and not p.name.startswith('.'))
assert (root/'dist/index.html') in files
assert all(p.suffix in {'.html','.js','.css','.mp3','.txt','.json','.webp','.png'} or p.name in {'_headers','_routes.json'} for p in files)
with ZipFile(out,'w',ZIP_DEFLATED) as archive:
    for p in files: archive.write(p,p.relative_to(root/'dist'))
manifest={str(p.relative_to(root/'dist')):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
out.with_suffix('.manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps({'archive':str(out),'files':len(files),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2))
