"""Recapture the reviewed UI postimages as byte-faithful Git output.

The old capture and its failed verdict are immutable evidence. This helper only
writes a fresh evidence directory; it never stages, applies or edits game files.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[2]
OLD = ROOT / "docs/development/ui-review-current"
OUT = ROOT / "docs/development/ui-review-v2"
PATTERNS = {
    "possible_secret": r'''(?i)(api_key|secret|password|token|passwd)\s*=\s*['\"][^'\"]{6,}['\"]''',
    "shell_injection": r"os\.system\(|subprocess.*shell=True",
    "eval_exec": r"\beval\(|\bexec\(",
    "unsafe_pickle": r"pickle\.loads?\(",
    "sql_interpolation": r'''execute\(f["']|\.format\(.*(?:SELECT|INSERT)''',
}


def git(*args: str, allowed: tuple[int, ...] = (0,)) -> subprocess.CompletedProcess[bytes]:
    result = subprocess.run(
        ["git", "-c", "color.ui=false", *args], cwd=ROOT, capture_output=True
    )
    if result.returncode not in allowed:
        raise RuntimeError(result.stderr.decode("utf-8", errors="replace"))
    return result


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def record(name: str, value: object) -> None:
    (OUT / name).write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    original = json.loads((OLD / "ui.manifest.json").read_text(encoding="utf-8"))
    files = original["files"]
    assert len(files) == len(set(files)) == len(original["sha256"])
    for name in files:
        path = Path(name)
        assert not path.is_absolute() and ".." not in path.parts
        assert (ROOT / path).resolve().is_relative_to(ROOT)
        assert name.startswith(("apps/web/src/", "tests/gameplay/"))
    before = {name: digest(ROOT / name) for name in files}
    assert before == original["sha256"], "UI postimages changed; do not relabel the old review."
    head = git("rev-parse", "HEAD").stdout.decode("ascii").strip()
    assert head == original["head"], "Review baseline changed."
    old_digest = digest(OLD / "ui.diff")
    old_parse = git("apply", "--numstat", str(OLD / "ui.diff"), allowed=(0, 128))
    assert old_parse.returncode == 128, "Expected the retained corrupt-capture failure."
    assert b"corrupt patch" in old_parse.stderr

    # Fail rather than overwrite a prior capture or independent verdict.
    OUT.mkdir(exist_ok=False)
    record("old-capture-red.json", {
        "path": str((OLD / "ui.diff").relative_to(ROOT)),
        "sha256": old_digest,
        "exitCode": old_parse.returncode,
        "stderr": old_parse.stderr.decode("utf-8"),
    })
    untracked = [name.decode("utf-8") for name in git(
        "ls-files", "--others", "--exclude-standard", "-z", "--", *files
    ).stdout.split(b"\0") if name]
    chunks = [git(
        "diff", "--binary", "--no-ext-diff", "--no-textconv", "--no-renames",
        "HEAD", "--", *files
    ).stdout]
    for name in untracked:
        chunks.append(git(
            "diff", "--no-index", "--binary", "--no-ext-diff", "--no-textconv",
            "--", "/dev/null", name, allowed=(1,)
        ).stdout)
    assert all(not chunk or chunk.endswith(b"\n") for chunk in chunks)
    # Never strip, normalize or reconstruct hunk lines from displayed tool output.
    patch_bytes = b"".join(chunks)
    patch_path = OUT / "ui.diff"
    patch_path.write_bytes(patch_bytes)
    parsed = git("apply", "--numstat", str(patch_path))
    numstat = parsed.stdout.decode("utf-8").splitlines()
    parsed_files = [line.split("\t", 2)[2] for line in numstat]
    assert sorted(parsed_files) == sorted(files), "Missing or duplicate file sections."
    reverse = git("apply", "--reverse", "--check", str(patch_path))
    after = {name: digest(ROOT / name) for name in files}
    assert after == before and digest(OLD / "ui.diff") == old_digest
    added = [line[1:] for line in patch_bytes.decode("utf-8").splitlines()
             if line.startswith("+") and not line.startswith("+++")]
    matches = {
        category: [{"addedLine": index + 1, "text": line}
                   for index, line in enumerate(added) if re.search(pattern, line)]
        for category, pattern in PATTERNS.items()
    }
    manifest = {
        "scope": original["scope"], "head": head, "files": files,
        "diffBytes": len(patch_bytes), "diffSha256": digest(patch_path),
        "sha256": after, "heuristicMatches": matches,
        "previousManifest": str((OLD / "ui.manifest.json").relative_to(ROOT)),
        "limits": "Byte-faithful review recapture only; no game edits, AI/contact probes or release approval.",
    }
    verification = {
        "oldCaptureParseExitCode": old_parse.returncode,
        "newCaptureParseExitCode": parsed.returncode,
        "reverseCheckExitCode": reverse.returncode,
        "reverseCheckStderr": reverse.stderr.decode("utf-8"),
        "parsedFileCount": len(parsed_files), "parsedFiles": parsed_files,
        "allOriginalPostimagesMatch": True, "sourceChangesDuringCapture": [],
        "oldCaptureUnchanged": True, "heuristicMatchCounts": {k: len(v) for k, v in matches.items()},
        "numstat": numstat,
    }
    record("ui.manifest.json", manifest)
    record("verification.json", verification)
    print(json.dumps({"diffBytes": len(patch_bytes), **verification}, indent=2))


if __name__ == "__main__":
    main()
