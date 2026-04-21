from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

app = FastAPI(title="AI Recruitment Service", version="1.0.0")

class ParseRequest(BaseModel):
    cv_id: str
    file_path: str
    format: str

from typing import List

class CandidateFallback(BaseModel):
    id: str
    text: str

class MatchRequest(BaseModel):
    jd_text: str
    cv_ids: List[str] = []
    fallback_cvs: List[CandidateFallback] = []

# Cấu hình CORS để cho phép kết nối chéo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Nodejs hoặc NextJS đều có thể gọi vào
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "AI Service FastAPI is up and running!"}

@app.post("/api/ai/parse-cv")
async def parse_cv(req: ParseRequest):
    """
    Nhận Local File Path từ Node.js, lấy Text, phân tích JSON,
    sinh Embeddings và ghi vào FAISS.
    """
    try:
        from core.parser import parse_cv_ai
        from core.faiss_manager import vector_db
        
        if not os.path.exists(req.file_path):
            raise Exception("File không tồn tại trên Server gốc")

        # 1. Đọc nội dung & Bóc tách LLM JSON
        text, ai_json = parse_cv_ai(req.file_path, req.format)
        
        if not ai_json:
            raise Exception("AI không thể trích xuất JSON hợp lệ.")
            
        # 2. Sinh Embeddings + Lưu DB (nếu có text)
        if text:
            vector_db.add_cv_vector(cv_uuid=req.cv_id, text=text)

        # 3. Trả về kết quả
        return {
            "success": True,
            "cv_id": req.cv_id,
            "aiScore": ai_json.get("aiScore", 0),
            "extractedInfo": ai_json
        }
    except Exception as e:
        import traceback
        err_msg = traceback.format_exc()
        with open("error.log", "w", encoding="utf-8") as f:
            f.write(err_msg)
        print(err_msg)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/match-jd")
async def match_jd(req: MatchRequest):
    """
    Tính Cosine Similarity giữa Job Description và danh sách CV (từ FAISS hoặc bằng Text Fallback).
    """
    try:
        from core.faiss_manager import vector_db
        fallback_data = [{"id": f.id, "text": f.text} for f in req.fallback_cvs] if req.fallback_cvs else None
        scores = vector_db.calculate_semantic_match(req.jd_text, req.cv_ids, fallback_data)
        return {"success": True, "scores": scores}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
