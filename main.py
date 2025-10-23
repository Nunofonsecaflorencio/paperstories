from docxtpl import DocxTemplate, InlineImage
from docx2pdf import convert
from docx.shared import Inches
from exif import Image
from datetime import datetime
from fractions import Fraction
from pathlib import Path
from PIL import Image as PILImage
import shutil


# ---------- Constants ----------
TEMPLATES = {
    '3x1': {
        'file_path': Path("templates/16by9-3x1.docx"),
        'image_width': Inches(5),
        'image_height': Inches(2.78),
        'count': 3 * 1,
        'aspect_ratio': 16/9
    },
    '3x3': {
        'file_path': Path("templates/4by5-3x3.docx"),
        'image_width': Inches(2.21),
        'image_height': Inches(2.78),
        'count': 3 * 3,
        'aspect_ratio': 4/5
    },
    '2x3': {
        'file_path': Path("templates/5by4-2x3.docx"),
        'image_width': Inches(3.36),
        'image_height': Inches(2.71),
        'count': 2 * 3,
        'aspect_ratio': 5/4
    },
}

TEMP_DIR = Path("temp")
if TEMP_DIR.exists():
    shutil.rmtree(TEMP_DIR)
TEMP_DIR.mkdir(exist_ok=True)

# ---------- Utility Functions ----------
def get_metadata(image_path: Path) -> Image:
    """Load image metadata using EXIF."""
    with open(image_path, 'rb') as f:
        return Image(f)

def format_datetime(date_str: str) -> str:
    """Convert EXIF datetime string to a readable format."""
    dt = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
    return dt.strftime("%A, %d/%m/%Y %H:%M")

def format_exposure(exposure) -> str:
    """Format exposure time as a fraction if float."""
    if isinstance(exposure, float):
        frac = Fraction(exposure).limit_denominator(1000)
        return f"{frac.numerator}/{frac.denominator}"
    return str(exposure)

def correct_orientation(image_path: Path, orientation: int) -> Path:
    """Rotate image based on EXIF orientation and save to temp folder."""
    pil_img = PILImage.open(image_path)
    
    if orientation == 2:
        pil_img = pil_img.transpose(PILImage.FLIP_LEFT_RIGHT)
    elif orientation == 3:
        pil_img = pil_img.rotate(180, expand=True)
    elif orientation == 4:
        pil_img = pil_img.transpose(PILImage.FLIP_TOP_BOTTOM)
    elif orientation == 5:
        pil_img = pil_img.transpose(PILImage.FLIP_LEFT_RIGHT).rotate(90, expand=True)
    elif orientation == 6:
        pil_img = pil_img.rotate(270, expand=True)
    elif orientation == 7:
        pil_img = pil_img.transpose(PILImage.FLIP_LEFT_RIGHT).rotate(270, expand=True)
    elif orientation == 8:
        pil_img = pil_img.rotate(90, expand=True)
    
    corrected_path = TEMP_DIR / image_path.name
    pil_img.save(corrected_path)
    return corrected_path

def generate_context(doc: DocxTemplate, template_info: dict, images: list[Path]) -> dict:
    """Generate context dictionary for docx template rendering."""
    context = {}
    for i, image_path in enumerate(images, start=1):
        if i > template_info['count']:
            break  # stop if we exceed template slots
        
        metadata = get_metadata(image_path)
        
          # Correct orientation if needed
        orientation = metadata.get('orientation')
        final_image_path = correct_orientation(image_path, orientation) if orientation else image_path
        
        
        # Open image to check dimensions
        with PILImage.open(final_image_path) as img:
            img_width, img_height = img.size

        # Use width for landscape, height for portrait
        if img_width >= img_height:
            context[f"image{i}"] = InlineImage(doc, str(final_image_path), width=template_info['image_width'])
        else:
            context[f"image{i}"] = InlineImage(doc, str(final_image_path), height=template_info['image_height'])
        
        # Date
        dt_value = metadata.get('datetime') or metadata.get('datetime_original')
        if dt_value:
            context[f"date{i}"] = format_datetime(dt_value)

        # Camera info
        iso = metadata.get('photographic_sensitivity')
        f_number = metadata.get('f_number') or metadata.get('aperture_value')
        exposure = metadata.get('exposure_time')
        exposure_str = format_exposure(exposure) if exposure else None

        if iso and f_number and exposure_str:
            context[f"camera{i}"] = f"ISO {iso}, f{f_number}, {exposure_str}"

    return context

# ---------- Main ----------
def main():
    template_key = '2x3'
    images_folder = Path("images")
    output_docx = Path("output/story.docx")
    output_pdf = Path("output/story.pdf")

    template_info = TEMPLATES[template_key]
    doc = DocxTemplate(template_info['file_path'])

    # Gather all images in folder (jpg/png)
    images = sorted(images_folder.glob("*.JPG")) + sorted(images_folder.glob("*.PNG"))

    context = generate_context(doc, template_info, images)
    doc.render(context)

    doc.save(output_docx)
    convert(output_docx, output_pdf)
    print(f"Generated DOCX: {output_docx} and PDF: {output_pdf}")

if __name__ == "__main__":
    main()
