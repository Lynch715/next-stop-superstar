#!/usr/bin/env python3
"""Build the static website from an explicit runtime allowlist; never ship saves or QA files."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib,json,shutil,tempfile,zipfile
ROOT=Path(__file__).resolve().parents[1]
class References(HTMLParser):
    def __init__(self): super().__init__();self.files=set()
    def handle_starttag(self,tag,attrs):
        a=dict(attrs);value=a.get('src') if tag=='script' else a.get('href') if tag=='link' else None
        if value and not value.startswith(('http:','https:','data:','#')):self.files.add(value.split('?')[0])
p=References();p.feed((ROOT/'index.html').read_text())
files={'index.html',*p.files}
files.update(str(f.relative_to(ROOT)) for f in (ROOT/'assets').rglob('*') if f.is_file() and f.name!='.DS_Store')
for f in files:
    if not (ROOT/f).is_file() or (ROOT/f).is_symlink():raise SystemExit('Invalid release file: '+f)
staging=Path(tempfile.mkdtemp(prefix='next-star-release-'))
for f in sorted(files):
    target=staging/f;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/f,target)
(staging/'.nojekyll').write_text('');files.add('.nojekyll')
manifest={'version':'0.21','files':{f:{'bytes':(staging/f).stat().st_size,'sha256':hashlib.sha256((staging/f).read_bytes()).hexdigest()} for f in sorted(files)}}
(staging/'release-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
destination=ROOT/'dist'
if destination.exists():
    if not (destination/'release-manifest.json').is_file():raise SystemExit('Existing dist is not a generated release; leave it untouched.')
    shutil.rmtree(destination)
shutil.copytree(staging,destination);shutil.rmtree(staging)
output=ROOT/'release';output.mkdir(exist_ok=True)
with zipfile.ZipFile(output/'下一站巨星-v0.21-网站.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in sorted(destination.rglob('*')):
        if f.is_file():z.write(f,f.relative_to(destination))
source={*files,'README.md','发布说明.md','.gitignore','.github/workflows/pages.yml','test-mobile.cjs','test-highlights.cjs','tools/build_release.py','tools/check_release.py','tools/make_app_icons.py'}- {'.nojekyll'}
with zipfile.ZipFile(output/'下一站巨星-v0.21-源码.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in sorted(source):z.write(ROOT/f,f)
print(f'PASS · static release {len(manifest["files"])} files · {sum(x["bytes"] for x in manifest["files"].values()):,} bytes · website and source archives')
