from pathlib import Path
from src.constants import TEMPLATES
from src.generator import generate_story
from src.cleanup import cleanup_files

def main():
    template_key = 'landscape_3x1'
    images_folder = Path("images")
    output_dir = Path("output")

    template_info = TEMPLATES[template_key]
    images = sorted(images_folder.glob("*.JPG")) + sorted(images_folder.glob("*.PNG"))

    pdf_path = generate_story(template_info, images, output_dir)
    cleanup_files(output_dir / "story.docx")

    print(f"✅ PDF generated at: {pdf_path}")

if __name__ == "__main__":
    main()
