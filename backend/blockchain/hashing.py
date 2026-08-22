import json
import hashlib

def sha256_bytes(data: bytes) -> str:
    """Returns hexadecimal SHA-256 hash of bytes, prefixed with 0x."""
    return "0x" + hashlib.sha256(data).hexdigest()

def canonical_json(data: dict) -> bytes:
    """Recursively sorts dictionary keys and serializes without whitespace to ensure deterministic JSON."""
    return json.dumps(data, sort_keys=True, separators=(',', ':')).encode('utf-8')

def sha256_json(data: dict) -> str:
    """Returns SHA-256 of canonical JSON."""
    return sha256_bytes(canonical_json(data))

def sha256_file(filepath: str) -> str:
    """Reads file and returns SHA-256. Returns empty hash if file not found."""
    try:
        with open(filepath, 'rb') as f:
            return sha256_bytes(f.read())
    except FileNotFoundError:
        return "0x" + "0" * 64

def sha256_text_file(filepath: str) -> str:
    """Reads text file (stripping carriage returns for cross-platform deterministic hashes) and returns SHA-256."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read().replace('\r\n', '\n')
            return sha256_bytes(content.encode('utf-8'))
    except FileNotFoundError:
        return "0x" + "0" * 64

def parse_json_file(filepath: str) -> dict:
    """Reads and parses a JSON file. Returns empty dict if not found."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def hash_artifact_json(filepath: str) -> str:
    """Parses JSON file and hashes its canonical representation. If missing, returns zero-hash."""
    data = parse_json_file(filepath)
    if not data:
        return "0x" + "0" * 64
    return sha256_json(data)
