import shutil
from pathlib import Path
from .constants import TEMP_DIR

def cleanup_files(output_docx: Path):
    """Delete temporary and intermediate files safely."""
    try:
        if output_docx.exists():
            output_docx.unlink()
        if TEMP_DIR.exists():
            shutil.rmtree(TEMP_DIR)
        print(f"✅ Cleanup done: {TEMP_DIR}")
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")
