import shutil
from pathlib import Path
from .constants import TEMP_DIR
import threading, time

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

def delayed_cleanup(output_docx_path: Path, temp_dir: Path):
    """Run cleanup 1 minute later in a background thread."""
    def _cleanup():
        time.sleep(60)
        cleanup_files(output_docx_path)
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
        print("🧹 Cleanup completed after delay.")
    threading.Thread(target=_cleanup, daemon=True).start()