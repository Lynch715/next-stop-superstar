#!/usr/bin/env python3
"""Check release integrity and GitHub project-subdirectory compatibility."""
from pathlib import Path
import hashlib,json,re,struct,zipfile
ROOT=Path(__file__).resolve().parents[1];d=ROOT/'dist';m=json.loads((d/'release-manifest.json').read_text());assert m['version']=='0.21'
actual={str(f.relative_to(d)) for f in d.rglob('*') if f.is_file()};assert actual==set(m['files'])|{'release-manifest.json'}
for f,info in m['files'].items():
    content=(d/f).read_bytes();assert len(content)==info['bytes'] and hashlib.sha256(content).hexdigest()==info['sha256'],f
    assert not any(x in f for x in ['qa/','test-','.DS_Store','.git/','.env']),f
catalog=json.loads((d/'assets/teams/manifest.json').read_text());assert len(catalog['teams'])==60
for team in catalog['teams']:
    f=team['logo'];assert (d/f).is_file() and hashlib.sha256((d/f).read_bytes()).hexdigest()==team['sha256'],f
for name in ['index.html','team-data.js','app.js']:
    text=(d/name).read_text();assert not re.search(r'(?:src|href)=["\']/(?!/)',text),name
assert 'lynchrrr' in (d/'app.js').read_text()
app=json.loads((d/'manifest.webmanifest').read_text())
assert app['name']==app['short_name']=='下一站巨星'
assert app['start_url']==app['scope']==app['id']=='./'
assert app['display']=='standalone' and app['orientation']=='portrait-primary'
for entry in app['icons']:
    raw=(d/entry['src']).read_bytes();size=int(entry['sizes'].split('x')[0])
    assert raw[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',raw[16:24])==(size,size)
assert 'maskable' in {e['purpose'] for e in app['icons']}
raw=(d/'assets/app/apple-touch-icon.png').read_bytes()
assert struct.unpack('>II',raw[16:24])==(180,180)
assert 'name="apple-mobile-web-app-title" content="下一站巨星"' in (d/'index.html').read_text()
assert '<title>下一站巨星</title>' in (d/'index.html').read_text()
for z in (ROOT/'release').glob('*.zip'):
    with zipfile.ZipFile(z) as archive:
        assert archive.testzip() is None
        assert not any(n.startswith(('qa/','dist/','.git/')) or n.endswith('.json') and 'teams/manifest' not in n and n!='release-manifest.json' for n in archive.namelist())
print(f'PASS · {len(m["files"])} release hashes · 60 team marks · app icons/name/scope · relative URLs · no saves or QA payloads · archive integrity')
