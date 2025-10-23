import streamlit as st
from pathlib import Path
from src.constants import TEMPLATES
from src.generator import generate_story
from src.cleanup import cleanup_files, delayed_cleanup

import pythoncom
pythoncom.CoInitialize()

# ---------------- Streamlit UI ----------------
st.set_page_config(page_title="Paperstories", page_icon="📄", layout="centered")
st.title("📸 Memories Generator")


template_key = st.selectbox("Choose a template", list(TEMPLATES.keys()))

# --- File upload ---
uploaded_files = st.file_uploader(
    "Upload your images", 
    type=["jpg", "jpeg", "png"], 
    accept_multiple_files=True
)

# --- Output directory ---
output_dir = Path("output")
output_dir.mkdir(exist_ok=True)

# --- Generate Button ---
if st.button("Generate Story PDF"):
    if not uploaded_files:
        st.warning("Please upload at least one image.")
    else:
        with st.spinner("Generating PDF..."):
            # Save uploaded images temporarily
            image_paths = []
            temp_dir = Path("temp_uploads")
            temp_dir.mkdir(exist_ok=True)
            
            for uploaded in uploaded_files:
                img_path = temp_dir / uploaded.name
                with open(img_path, "wb") as f:
                    f.write(uploaded.getbuffer())
                image_paths.append(img_path)
            
            # Generate story
            template_info = TEMPLATES[template_key]
            pdf_path = generate_story(template_info, image_paths, output_dir)
            
            # Schedule cleanup asynchronously
            delayed_cleanup(output_dir / "story.docx", temp_dir)
        
        st.success(f"✅ PDF generated successfully!")
        st.download_button(
            label="📥 Download PDF",
            data=open(pdf_path, "rb").read(),
            file_name=pdf_path.name,
            mime="application/pdf"
        )
