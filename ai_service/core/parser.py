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

prompt_template = """Bạn là một chuyên gia đánh giá CV nhân sự.
Dưới đây là nội dung văn bản của một CV ứng viên. Bạn hãy phân tích và đọc hiểu, sau đó trả về ĐÚNG MỘT khối JSON chứa các thông tin sau (chỉ trả về JSON thuần túy, tuyệt đối KHÔNG có markdown, KHÔNG có chữ nào khác ngoài JSON):
{
  "skills": ["kỹ năng 1", "kỹ năng 2"],
  "experience": "tóm tắt kinh nghiệm 1-2 câu",
  "education": "thông tin học vấn",
  "languages": ["ngôn ngữ 1"],
  "aiScore": 85,
  "summary": "tóm tắt năng lực trong 1 câu"
}
Lưu ý: aiScore đánh giá từ 0-100 dựa trên sự chuyên nghiệp. Nếu thông tin nào không có, hãy để trống hoặc null.

Text CV để bạn phân tích:
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
        "stream": False
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
    final_prompt = prompt_template + extracted_text[:4000] # Qwen ngữ cảnh giới hạn nên lấy max 4000 ký tự đầu
    
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
