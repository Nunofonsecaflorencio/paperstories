from exif import Image
from PIL import Image as PILImage
from datetime import datetime
from fractions import Fraction
from itertools import islice
from pathlib import Path
from .constants import TEMP_DIR

def get_metadata(image_path: Path) -> Image:
    with open(image_path, 'rb') as f:
        return Image(f)

def format_datetime(date_str: str) -> str:
    dt = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
    return dt.strftime("%A, %d/%m/%Y %H:%M")

def format_exposure(exposure) -> str:
    if isinstance(exposure, float):
        frac = Fraction(exposure).limit_denominator(1000)
        return f"{frac.numerator}/{frac.denominator}"
    return str(exposure)

def chunked(iterable, size):
    it = iter(iterable)
    while True:
        chunk = list(islice(it, size))
        if not chunk:
            break
        yield chunk

def correct_orientation(image_path: Path, orientation: int) -> Path:
    operations = {
        2: lambda img: img.transpose(PILImage.FLIP_LEFT_RIGHT),
        3: lambda img: img.rotate(180, expand=True),
        4: lambda img: img.transpose(PILImage.FLIP_TOP_BOTTOM),
        5: lambda img: img.transpose(PILImage.FLIP_LEFT_RIGHT).rotate(90, expand=True),
        6: lambda img: img.rotate(270, expand=True),
        7: lambda img: img.transpose(PILImage.FLIP_LEFT_RIGHT).rotate(270, expand=True),
        8: lambda img: img.rotate(90, expand=True),
    }

    with PILImage.open(image_path) as img:
        rotated = operations.get(orientation, lambda x: x)(img)
        corrected_path = TEMP_DIR / image_path.name
        rotated.save(corrected_path)
    return corrected_path
