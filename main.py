from docxtpl import DocxTemplate, InlineImage
from docx2pdf import convert
from docx.shared import Inches
from exif import Image
from datetime import datetime
from fractions import Fraction
from pathlib import Path
from PIL import Image as PILImage
import shutil
from itertools import islice
from docxcompose.composer import Composer

# ---------- Constants ----------
TEMPLATES = {
    'landscape_3x1': {'file_path': Path("templates/16by9-3x1.docx"), 'image_width': Inches(5), 'image_height': Inches(2.78), 'count': 3*1, 'aspect_ratio': 16/9},
    'portrait_3x3': {'file_path': Path("templates/4by5-3x3.docx"), 'image_width': Inches(2.21), 'image_height': Inches(2.78), 'count': 3*3, 'aspect_ratio': 4/5},
    'portrait_2x3': {'file_path': Path("templates/5by4-2x3.docx"), 'image_width': Inches(3.36), 'image_height': Inches(2.71), 'count': 2*3, 'aspect_ratio': 5/4},
}

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

# ---------- Utility Functions ----------
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
    """Yield successive chunks from iterable of given size."""
    it = iter(iterable)
    while True:
        chunk = list(islice(it, size))
        if not chunk:
            break
        yield chunk

def correct_orientation(image_path: Path, orientation: int) -> Path:
    """Rotate image based on EXIF orientation and save to temp folder."""
    pil_img = PILImage.open(image_path)
    operations = {
        2: lambda img: img.transpose(PILImage.FLIP_LEFT_RIGHT),
        3: lambda img: img.rotate(180, expand=True),
        4: lambda img: img.transpose(PILImage.FLIP_TOP_BOTTOM),
        5: lambda img: img.transpose(PILImage.FLIP_LEFT_RIGHT).rotate(90, expand=True),
        6: lambda img: img.rotate(270, expand=True),
        7: lambda img: img.transpose(PILImage.FLIP_LEFT_RIGHT).rotate(270, expand=True),
        8: lambda img: img.rotate(90, expand=True)
    }
    pil_img = operations.get(orientation, lambda img: img)(pil_img)
    
    corrected_path = TEMP_DIR / image_path.name
    pil_img.save(corrected_path)
    return corrected_path

def generate_context(doc: DocxTemplate, template_info: dict, images: list[Path]) -> dict:
    context = {}
    for i, image_path in enumerate(images, start=1):
        if i > template_info['count']:
            break

        metadata = get_metadata(image_path)
        orientation = metadata.get('orientation')
        final_image_path = correct_orientation(image_path, orientation) if orientation else image_path

        # Determine whether to use width or height based on image orientation
        with PILImage.open(final_image_path) as img:
            if img.width >= img.height:
                context[f"image{i}"] = InlineImage(doc, str(final_image_path), width=template_info['image_width'])
            else:
                context[f"image{i}"] = InlineImage(doc, str(final_image_path), height=template_info['image_height'])

        # Add date if available
        dt_value = metadata.get('datetime') or metadata.get('datetime_original')
        if dt_value:
            context[f"date{i}"] = format_datetime(dt_value)

        # Add camera info if available
        iso = metadata.get('photographic_sensitivity')
        f_number = metadata.get('f_number') or metadata.get('aperture_value')
        exposure = metadata.get('exposure_time')
        if iso and f_number and exposure:
            context[f"camera{i}"] = f"ISO {iso}, f{f_number}, {format_exposure(exposure)}"

    return context

# ---------- Main ----------
def main():
    template_key = 'landscape_3x1'
    images_folder = Path("images")
    output_docx = Path("output/story.docx")
    output_pdf = Path("output/story.pdf")

    template_info = TEMPLATES[template_key]
    images = sorted(images_folder.glob("*.JPG")) + sorted(images_folder.glob("*.PNG"))

    # Split images into pages
    pages = list(chunked(images, template_info['count']))

    if not pages:
        print("No images found.")
        return

    # --- First page ---
    first_doc = DocxTemplate(template_info['file_path'])
    context = generate_context(first_doc, template_info, pages[0])
    first_doc.render(context)
    first_doc.save(output_docx)
    composer = Composer(first_doc)

    # --- Additional pages ---
    for chunk in pages[1:]:
        new_doc = DocxTemplate(template_info['file_path'])
        context = generate_context(new_doc, template_info, chunk)
        new_doc.render(context)
        temp_page = TEMP_DIR / f"page_{pages.index(chunk)+1}.docx"
        new_doc.save(temp_page)
        composer.append(new_doc)

    composer.save(output_docx)

    # Convert to PDF
    convert(output_docx, output_pdf)

    
    # ---------- Cleanup ----------
    Path(output_docx).unlink()
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
        print(f"Cleaned up temporary folder: {TEMP_DIR}")

if __name__ == "__main__":
    main()
