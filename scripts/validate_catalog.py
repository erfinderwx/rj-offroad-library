#!/usr/bin/env python3
"""Check actual file hashes, paths, translations, and public-catalog integrity."""
import hashlib
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
j = json.loads((SITE / 'catalog.json').read_text(encoding='utf-8'))
ids = set()
categories = {c['id'] for c in j['categories']}
errors = []

def check(value, message):
    if not value:
        errors.append(message)

for c in j['categories']:
    check(all(c.get('title',{}).get(lang) for lang in ['zh','en','de']), 'Category needs three language labels: '+c['id'])
for r in j['documents']:
    check(r['id'] not in ids, 'Duplicate id: '+r['id']); ids.add(r['id'])
    check(r['category'] in categories, 'Unknown category: '+r['id'])
    check(r['kind'] in {'file','link'}, 'Unknown kind: '+r['id'])
    for key in ['title','description']:
        check(all(r.get(key,{}).get(lang) for lang in ['zh','en','de']), 'Missing translation: '+r['id']+'/'+key)
    if r.get('file'):
        p = (SITE / r['file']).resolve()
        check(p.is_relative_to(SITE.resolve() / 'files'), 'Download outside files directory: '+r['id'])
        check(p.is_file(), 'Missing file: '+r['id'])
        if p.is_file():
            check(p.stat().st_size == r['bytes'], 'File size mismatch: '+r['id'])
            check(hashlib.sha256(p.read_bytes()).hexdigest() == r['sha256'], 'Checksum mismatch: '+r['id'])
    else:
        check(urlparse(r.get('url') or '').scheme == 'https', 'Missing HTTPS resource: '+r['id'])
        if r['kind'] == 'file':
            check(r.get('bytes',0)>0 and len(r.get('sha256',''))==64, 'Release download needs size and hash: '+r['id'])
serialized = json.dumps(j, ensure_ascii=False)
for forbidden in ['/Users/', '/var/folders/', 'mail.google.com', 'chatgpt.com/c/', 'drive.google.com', 'Commercial-in-Confidence']:
    check(forbidden not in serialized, 'Internal source leaked into public catalog: '+forbidden)
# This public library intentionally excludes internal R&D and bid documents.
blocked_name = re.compile(r'(?i)(specs[ _-]*for[ _-]*vetting|steerai.*proposal|proposal.*steerai|mutual[ _-]*nda|sensor[ _-]*architecture|TAR-UGV|内部战略|投标|会议纪要|感知系统方案)')
for f in SITE.rglob('*'):
    check(not blocked_name.search(f.name), 'Internal R&D or bid filename in public site: '+f.name)
    if f.is_file() and f.suffix.lower() == '.zip':
        with zipfile.ZipFile(f) as archive:
            for name in archive.namelist():
                check(not blocked_name.search(name), 'Internal R&D or bid member in archive: '+name)
    check(f.name not in {'.DS_Store', '.env'}, 'Unwanted site file: '+str(f))
if errors:
    raise SystemExit('\n'.join(errors))
print(f'Validated {len(j["documents"])} resources; paths, checksums and translations OK')
