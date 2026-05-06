import os
import re
import json
import logging
import requests
from typing import Dict, Any
from PIL import Image
import pytesseract
import pdfplumber
import docx

logger = logging.getLogger(__name__)

# Cấu hình Tesseract path từ thư mục F:\OCR của sếp
pytesseract.pytesseract.tesseract_cmd = r'F:\OCR\tesseract.exe'

# Tên Model Ollama đang chạy
OLLAMA_MODEL = "qwen2:1.5b"
OLLAMA_URL = "http://127.0.0.1:11434/api/generate"

prompt_template = """Dưới đây là nội dung CV của ứng viên. Hãy phân tích và trích xuất thông tin thành ĐÚNG MỘT khối JSON hợp lệ. KHÔNG giải thích thêm.
Cấu trúc JSON BẮT BUỘC phải theo mẫu sau, NHƯNG BẠN PHẢI ĐIỀN THÔNG TIN THỰC TẾ LẤY TỪ CV VÀO (Không được chép lại chữ trong mẫu):
{
  "skills": ["<danh sách kỹ năng có trong CV>"],
  "experience": "<tóm tắt ngắn gọn kinh nghiệm làm việc>",
  "education": "<tóm tắt trường học, bằng cấp>",
  "languages": ["<các ngôn ngữ ứng viên biết>"],
  "aiScore": <chấm điểm CV từ 0 đến 100>,
  "summary": "<viết 1 câu tóm tắt năng lực>"
}

Nội dung CV thực tế:
"""

def extract_text(file_path: str, ext: str, fmt: str) -> str:
    text = ""
    try:
        # Nếu là hình ảnh, dùng đôi mắt Tesseract OCR để soi
        if fmt == 'Image' or ext in ['.jpg', '.jpeg', '.png']:
            img = Image.open(file_path)
            # Tesseract OCR tiếng việt có thể cần gói vie (.traineddata), nhưng mặc định english cũng đọc được sơ bộ.
            text = pytesseract.image_to_string(img, lang='eng+vie')
        
        # Nếu là PDF
        elif ext == '.pdf':
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    # Rút chữ trắng
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            # Nếu pdf trắng trơn (loại pdf scan ảnh), ta có thể ép nó về ảnh, nhưng rủi ro chậm máy nên ưu tiên bỏ qua.
            if len(text.strip()) < 20: 
                 logger.warning("PDF này giống PDF scan hình ảnh, text quá ngắn.")
        
        # Nếu là Word
        elif ext in ['.doc', '.docx']:
            doc = docx.Document(file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
            
    except Exception as e:
        logger.error(f"Lỗi extract_text: {e}")
        
    return text.strip()


def call_ollama(prompt_text: str) -> str:
    """Gọi bộ não Ollama Local qua REST API nội bộ"""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt_text,
        "stream": False,
        "options": {
            "num_predict": 800,  # Nới lỏng số token để AI có thể liệt kê đủ skill/kinh nghiệm
            "temperature": 0.3,  # Tăng một chút độ sáng tạo để AI không copy y hệt prompt
            "num_ctx": 3072
        }
    }
    
    try:
        # Tăng timeout lên phút phòng khi AI ngốn quá nhiều thời gian suy nghĩ
        # Timeout 120 giây
        response = requests.post(OLLAMA_URL, json=payload, timeout=120)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "")
    except Exception as e:
        logger.error(f"Lỗi Ollama Offline: {e}")
        raise Exception(f"Máy chủ AI Offline Ollama lỗi: {e}")


def parse_cv_ai(file_path: str, fmt: str):
    ext = os.path.splitext(file_path)[1].lower()
    
    # 1. Trích xuất Text (cả text thường, file pdf, dập luôn cả hình ảnh qua Tesseract)
    extracted_text = extract_text(file_path, ext, fmt)
        
    if not extracted_text:
        raise ValueError("AI không thể đọc được một chữ nào trong file này (có thể ảnh mờ hoặc lỗi).")
            
    # 2. Ráp thông tin vào Prompt gửi cho não Ollama
    final_prompt = prompt_template + extracted_text[:3000] # Giảm xuống 3000 ký tự đầu để tăng tốc độ đọc của AI
    
    # Kêu gọi Ollama suy nghĩ
    logger.info(f"Đang gửi {len(extracted_text)} ký tự CV sang bộ não Ollama Qwen2...")
    llm_response_text = call_ollama(final_prompt)
    logger.info(f"Ollama trả lời: {llm_response_text}")

    # 3. Ép kiểu JSON Đầu RRa (Bắt lỗi Markdown nếu có)
    cleaned = re.sub(r'```json|```', '', llm_response_text).strip()
    match = re.search(r'\{[\s\S]*\}', cleaned)
    
    generated_json = None
    if match:
        try:
            generated_json = json.loads(match.group(0))
        except json.JSONDecodeError as js_err:
             logger.error(f"Ollama nhả JSON bị lỗi ngữ pháp: {js_err}")
    
    if not generated_json:
         raise Exception("AI Offline đã phân tích nhưng không trích xuất được định dạng cấu trúc JSON hợp lệ.")

    return extracted_text, generated_json
