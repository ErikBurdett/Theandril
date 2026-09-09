"""Read-only validation of the two authorized factory doc changes.

Run with an existing Python environment containing PyYAML. No installs, renders,
provider calls or runtime publication. Output is a JSON evidence report on stdout.
"""
from __future__ import annotations

import hashlib
import html
import json
from pathlib import Path
import re
import subprocess
import urllib.parse

import yaml

ROOTS = (
    Path('/home/telephoneheater/Projects/BlenderArtFactory'),
    Path('/home/telephoneheater/Projects/pixel-art-factory'),
)


def git(root: Path, *args: str) -> str:
    return subprocess.run(['git', *args], cwd=root, check=True, text=True, capture_output=True).stdout


def anchors(text: str) -> set[str]:
    counts: dict[str, int] = {}
    result: set[str] = set()
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', text, re.M):
        heading = html.unescape(re.sub(r'<[^>]+>', '', heading)).lower()
        slug = re.sub(r'[^\w\s-]', '', heading).replace(' ', '-')
        count = counts.get(slug, 0)
        counts[slug] = count + 1
        result.add(slug + (f'-{count}' if count else ''))
    result.update(re.findall(r'(?:id|name)=[\"\']([^\"\']+)[\"\']', text))
    return result


def verify(root: Path) -> dict:
    files = sorted(set(git(root, 'diff', '--name-only', 'HEAD').splitlines()
                       + git(root, 'ls-files', '--others', '--exclude-standard').splitlines()))
    git(root, 'diff', '--check')
    markdown = [name for name in files if name.endswith('.md')]
    errors: list[dict] = []
    skills: list[dict] = []
    links = 0
    for name in markdown:
        path = root / name
        text = path.read_text()
        if path.name == 'SKILL.md':
            parts = text.split('---', 2)
            try:
                assert text.startswith('---\n') and len(parts) == 3
                fm = yaml.safe_load(parts[1])
                assert isinstance(fm, dict)
                assert isinstance(fm.get('name'), str) and re.fullmatch(r'[a-z0-9_-]{1,64}', fm['name'])
                assert isinstance(fm.get('description'), str) and 0 < len(fm['description']) <= 1024
                assert parts[2].strip()
                skills.append({'path': name, 'name': fm['name'], 'descriptionLength': len(fm['description'])})
            except (AssertionError, yaml.YAMLError):
                errors.append({'file': name, 'error': 'invalid skill frontmatter or body'})
        prose = re.sub(r'```.*?```', '', text, flags=re.S)
        for destination in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)', prose):
            destination = destination.split(' "', 1)[0].strip('<>')
            if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', destination):
                continue
            path_part, _, fragment = destination.partition('#')
            target = (path.parent / urllib.parse.unquote(path_part)).resolve() if path_part else path
            links += 1
            if not target.exists():
                errors.append({'file': name, 'link': destination, 'error': 'missing target'})
            elif fragment and target.suffix == '.md' and urllib.parse.unquote(fragment) not in anchors(target.read_text()):
                errors.append({'file': name, 'link': destination, 'error': 'missing heading/anchor'})
    return {
        'root': str(root), 'changedFiles': files, 'markdownCount': len(markdown),
        'localLinksChecked': links, 'skills': skills, 'errors': errors, 'diffCheck': True,
        'nonDocumentationChanges': [name for name in files if not name.endswith('.md')],
        'markdownSha256': {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in markdown},
    }


reports = [verify(root) for root in ROOTS]
passed = all(not report['errors'] and not report['nonDocumentationChanges'] for report in reports)
print(json.dumps({
    'scope': 'Parent authorized documentation-only final recheck: changed Markdown links/headings, skill YAML, changed-path scope and diff hygiene. Not CLI smoke, artwork generation, visual approval, engine acceptance or publication.',
    'repositories': reports, 'passed': passed,
}, indent=2))
raise SystemExit(0 if passed else 1)
