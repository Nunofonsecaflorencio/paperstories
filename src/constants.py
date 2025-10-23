from docx.shared import Inches
from pathlib import Path

TEMPLATES = {
    'landscape_3x1': {
        'file_path': Path("templates/16by9-3x1.docx"),
        'image_width': Inches(5),
        'image_height': Inches(2.78),
        'count': 3 * 1,
        'aspect_ratio': 16/9
    },
    'portrait_3x3': {
        'file_path': Path("templates/4by5-3x3.docx"),
        'image_width': Inches(2.21),
        'image_height': Inches(2.78),
        'count': 3 * 3,
        'aspect_ratio': 4/5
    },
    'portrait_2x3': {
        'file_path': Path("templates/5by4-2x3.docx"),
        'image_width': Inches(3.36),
        'image_height': Inches(2.71),
        'count': 2 * 3,
        'aspect_ratio': 5/4
    },
}

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)
