from docxtpl import DocxTemplate, InlineImage
from docxcompose.composer import Composer
from docx2pdf import convert
from pathlib import Path
import shutil

from .utils import get_metadata, format_datetime, format_exposure, correct_orientation, chunked, convert_to_jpeg_if_needed
from .constants import TEMP_DIR

def generate_context(doc: DocxTemplate, template_info: dict, images: list[Path]) -> dict:
    from PIL import Image as PILImage

    context = {}
    for i, image_path in enumerate(images, start=1):
        if i > template_info['count']:
            break
        
        converted_path = convert_to_jpeg_if_needed(image_path, TEMP_DIR)
        metadata = get_metadata(image_path)
        
        orientation = metadata.get('orientation')
        final_image_path = correct_orientation(image_path, orientation) if orientation else image_path

        with PILImage.open(final_image_path) as img:
            if img.width >= img.height:
                context[f"image{i}"] = InlineImage(doc, str(final_image_path), width=template_info['image_width'])
            else:
                context[f"image{i}"] = InlineImage(doc, str(final_image_path), height=template_info['image_height'])

        dt_value = metadata.get('datetime') or metadata.get('datetime_original')
        if dt_value:
            context[f"date{i}"] = format_datetime(dt_value)

        iso = metadata.get('photographic_sensitivity')
        f_number = metadata.get('f_number') or metadata.get('aperture_value')
        exposure = metadata.get('exposure_time')
        if iso and f_number and exposure:
            context[f"camera{i}"] = f"ISO {iso}, f{f_number}, {format_exposure(exposure)}"

    return context


def generate_story(template_info: dict, images: list[Path], output_dir: Path) -> Path:
    """Generate multi-page DOCX and PDF with auto-cleanup."""
    output_dir.mkdir(exist_ok=True)
    output_docx = output_dir / "story.docx"
    output_pdf = output_dir / "story.pdf"

    pages = list(chunked(images, template_info['count']))
    if not pages:
        raise ValueError("No images found.")

    first_doc = DocxTemplate(template_info['file_path'])
    context = generate_context(first_doc, template_info, pages[0])
    first_doc.render(context)
    first_doc.save(output_docx)
    composer = Composer(first_doc)

    for idx, chunk in enumerate(pages[1:], start=2):
        new_doc = DocxTemplate(template_info['file_path'])
        context = generate_context(new_doc, template_info, chunk)
        new_doc.render(context)
        temp_page = TEMP_DIR / f"page_{idx}.docx"
        new_doc.save(temp_page)
        composer.append(new_doc)

    composer.save(output_docx)
    convert(output_docx, output_pdf)
    return output_pdf
