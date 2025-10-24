from flask import Flask, render_template, request, send_file, redirect, url_for, flash
from pathlib import Path
from src.constants import TEMPLATES
from src.generator import generate_story
from src.cleanup import cleanup_files
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "your-secret-key"  # Needed for flash messages

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "output"
TEMP_DIR = BASE_DIR / "temp_uploads"
OUTPUT_DIR.mkdir(exist_ok=True)
TEMP_DIR.mkdir(exist_ok=True)


# --- Routes ---
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        template_key = request.form.get("template")
        uploaded_files = request.files.getlist("images")

        if not uploaded_files or uploaded_files[0].filename == "":
            flash("Please upload at least one image.", "warning")
            return redirect(url_for("index"))

        # Save uploaded images
        image_paths = []
        for file in uploaded_files:
            filename = secure_filename(file.filename)
            file_path = TEMP_DIR / filename
            file.save(file_path)
            image_paths.append(file_path)

        # Generate story
        cleanup_files(OUTPUT_DIR)

        try:
            template_info = TEMPLATES[template_key]
            pdf_path = generate_story(template_info, image_paths, OUTPUT_DIR)

            # Schedule cleanup
            # delayed_cleanup(OUTPUT_DIR / "story.docx", TEMP_DIR)
            cleanup_files(TEMP_DIR)
            return send_file(
                pdf_path,
                as_attachment=True,
                download_name=pdf_path.name,
                mimetype="application/pdf",
            )

        except Exception as e:
            flash(f"Error: {e}", "danger")
            return redirect(url_for("index"))

    # GET request
    return render_template("index.html", templates=TEMPLATES)


if __name__ == "__main__":
    app.run(debug=True)
