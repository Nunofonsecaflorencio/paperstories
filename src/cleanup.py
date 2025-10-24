import shutil
from pathlib import Path


def cleanup_files(dir: Path):
    """Delete temporary and intermediate files safely."""
    try:
        if dir.exists():
            shutil.rmtree(dir)
        print(f"✅ Cleanup done: {dir}")
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")
