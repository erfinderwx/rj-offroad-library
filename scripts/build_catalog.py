#!/usr/bin/env python3
"""Build the public download catalog from category folders and reviewed metadata."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
ALLOWED = {'.pdf','.zip','.step','.stp','.stl','.3mf','.urdf','.xacro','.yaml','.json','.csv','.xlsx','.docx','.pptx','.mp4','.webm','.vtt','.srt','.txt','.png','.jpg','.jpeg'}

def build():
    config = json.loads((ROOT / 'data/library.json').read_text(encoding='utf-8'))
    categories = {c['id']: c for c in config['categories']}
    metadata = config.get('files', {})
    records = []
    seen_paths = set()
    for path in sorted((SITE / 'files').rglob('*')):
        if not path.is_file() or path.name in {'README.md', '.gitkeep', '.DS_Store'}:
            continue
        if path.suffix.lower() not in ALLOWED:
            raise ValueError(f'Unsupported download format: {path.relative_to(SITE)}')
        relative = path.relative_to(SITE).as_posix()
        category = path.relative_to(SITE / 'files').parts[0].split('-')[0]
        if category not in categories:
            raise ValueError(f'Unknown category: {relative}')
        meta = metadata.get(relative, {})
        size = path.stat().st_size
        if size > 50 * 1024 * 1024:
            raise ValueError(f'Use a release asset for files over 50 MiB: {relative}')
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        record = {
            'id': meta.get('id', 'file-' + hashlib.sha256(relative.encode()).hexdigest()[:12]),
            'category': category,
            'title': meta.get('title', {lang: path.stem for lang in ('zh','en','de')}),
            'description': meta.get('description', {'zh':'原始资料文件。请按文件中的型号和说明使用。','en':'Original resource. Refer to the model and instructions in the file.','de':'Originaldatei. Beachten Sie das Modell und die Hinweise in der Datei.'}),
            'product': meta.get('product', ''),
            'language': meta.get('language', ''),
            'version': meta.get('version', ''),
            'file': relative, 'url': None, 'bytes': size, 'sha256': digest, 'kind': 'file'
        }
        records.append(record)
        seen_paths.add(relative)
    missing = sorted(set(metadata) - seen_paths)
    if missing:
        raise ValueError('Metadata points to missing files: ' + ', '.join(missing))
    records.sort(key=lambda r: (r['category'], metadata.get(r['file'], {}).get('sort_priority', 1), r['file']))
    records.extend(config.get('resources', []))
    updated = config['updated']
    try:
        changed = subprocess.check_output(['git', '-C', str(ROOT), 'log', '-1', '--format=%cs', '--', 'site/files', 'data/library.json'], text=True, stderr=subprocess.DEVNULL).strip()
        if changed:
            updated = max(updated, changed)
    except (OSError, subprocess.CalledProcessError):
        pass
    result = {'updated': updated, 'categories': config['categories'], 'documents': records}
    (SITE / 'catalog.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Catalog built: {len(records)} resources / {len(seen_paths)} local files')
    return result

if __name__ == '__main__':
    build()
