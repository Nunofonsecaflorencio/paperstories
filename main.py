from docxtpl import DocxTemplate, InlineImage
from docx2pdf import convert
from docx.shared import Inches
from exif import Image
from datetime import datetime
from fractions import Fraction


def get_metadata(path):
    with open(path, 'rb') as img_file:
        img = Image(img_file)
    return img

def format_datetime(date_str: str) -> str:
    # Parse the input string to a datetime object
    dt = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
    # Format to desired output: "Friday, 11/02/2024 20:07"
    return dt.strftime("%A, %d/%m/%Y %H:%M")

TEMPLATES = {
    '3x1': {
        'file_path': "templates\\16by9-3x1.docx",
        'image_width': Inches(5),
        'count': 3 * 1,
        'aspect-ratio': 16/9
    },
    '3x3': {
        'file_path': "templates\\4by5-3x3.docx",
        'image_width': Inches(2.21),
        'count': 3 * 3,
        'aspect-ratio': 4/5
    },
    '2x3': {
        'file_path': "templates\\5by4-2x3.docx",
        'image_width': Inches(3.36),
        'count': 2 * 3,
        'aspect-ratio': 5/4
    },
}
selected_template = TEMPLATES['2x3']
doc = DocxTemplate(selected_template['file_path'])
context = {}

for i in range(1, selected_template['count'] + 1):
    context[f"image{i}"] = InlineImage(doc, "images/IMG_2834.JPG", width=selected_template['image_width'])
    
    metadata = get_metadata("images/IMG_2834.JPG")
    
    if metadata.get('orientation'):
        # rotate accordly
        print(metadata.get('orientation'))
        
    if metadata.get('datetime'):
        context[f"date{i}"] = format_datetime(metadata.get('datetime')) # "Sunday, 11/02/2024 20:07"
    
    iso = metadata.get('photographic_sensitivity')
    f_number = metadata.get('f_number') or metadata.get('aperture_value')
    exposure = metadata.get('exposure_time')
    
    if isinstance(exposure, float):
        # Convert to nearest 1/denominator fraction
        frac = Fraction(exposure).limit_denominator(1000)
        exposure = f"{frac.numerator}/{frac.denominator}"
    if iso and f_number and exposure:
        context[f"camera{i}"] = f"ISO {iso}, f{f_number}, {exposure}"
    
doc.render(context)
doc.save("output/story.docx")
convert("output/story.docx", "output/story.pdf")
