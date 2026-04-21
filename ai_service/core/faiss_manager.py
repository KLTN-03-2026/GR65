import os
import faiss
import sqlite3
import numpy as np
import logging
from sentence_transformers import SentenceTransformer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorDBManager:
    def __init__(self):
        self.index_path = "faiss_vectors.index"
        self.db_path = "mapping.sqlite"
        
        logger.info("Đang tải model Embedding (lần đầu sẽ hơi lâu)...")
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.vector_dim = self.model.get_sentence_embedding_dimension()
        
        if os.path.exists(self.index_path):
            self.index = faiss.read_index(self.index_path)
            logger.info(f"Đã load FAISS với {self.index.ntotal} vectors.")
        else:
            base_index = faiss.IndexFlatL2(self.vector_dim)
            self.index = faiss.IndexIDMap(base_index)
            logger.info("Tạo mới cơ sở dữ liệu FAISS.")
            
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.cursor = self.conn.cursor()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS cv_mapping (
                faiss_id INTEGER PRIMARY KEY,
                cv_uuid TEXT UNIQUE
            )
        ''')
        self.conn.commit()
        
        self.cursor.execute("SELECT MAX(faiss_id) FROM cv_mapping")
        row = self.cursor.fetchone()
        self.next_id = (row[0] + 1) if row and row[0] is not None else 0

    def add_cv_vector(self, cv_uuid: str, text: str):
        try:
            # Sinh ma trận đa chiều (Embedding)
            vector = self.model.encode([text], convert_to_numpy=True)
            faiss_id = self.next_id
            
            # Thêm vào CSDL SQLite để map ID
            self.cursor.execute(
                "INSERT OR REPLACE INTO cv_mapping (faiss_id, cv_uuid) VALUES (?, ?)", 
                (faiss_id, cv_uuid)
            )
            self.conn.commit()
            
            # Lưu CSDL Không gian FAISS
            self.index.add_with_ids(vector, np.array([faiss_id], dtype=np.int64))
            faiss.write_index(self.index, self.index_path)
            
            self.next_id += 1
            logger.info(f"✅ Đã tạo nhúng & lưu Vector cho CV: {cv_uuid} (FAISS ID: {faiss_id})")
            return faiss_id
        except Exception as e:
            logger.error(f"Lỗi khi thêm FAISS: {e}")
            raise e

    def calculate_semantic_match(self, jd_text: str, cv_uuids: list, fallback_cvs: list = None):
        if not cv_uuids and not fallback_cvs:
            return {}
        
        # Encode JD
        jd_vector = self.model.encode([jd_text], convert_to_numpy=True)[0]
        jd_norm = np.linalg.norm(jd_vector)
        if jd_norm == 0: jd_norm = 1e-10

        scores = {}
        
        if cv_uuids:
            cv_uuids_lower = [str(x).lower() for x in cv_uuids]
            placeholders = ','.join(['?'] * len(cv_uuids_lower))
            self.cursor.execute(f"SELECT cv_uuid, faiss_id FROM cv_mapping WHERE LOWER(cv_uuid) IN ({placeholders})", cv_uuids_lower)
            mapping = self.cursor.fetchall()
            
            uuid_lower_map = {str(uid).lower(): uid for uid in cv_uuids}
            
            for db_uuid, faiss_id in mapping:
                original_uuid = uuid_lower_map.get(str(db_uuid).lower(), db_uuid)
                try:
                    cv_vector = self.index.reconstruct(int(faiss_id))
                    cv_norm = np.linalg.norm(cv_vector)
                    if cv_norm == 0: cv_norm = 1e-10
                    
                    cosine = np.dot(jd_vector, cv_vector) / (jd_norm * cv_norm)
                    percent = max(0, min(100, int(cosine * 100)))
                    scores[original_uuid] = min(100, percent + 5)
                except Exception as e:
                    logger.error(f"Lỗi reconstruct faiss_id {faiss_id} cho {original_uuid}: {e}")
                    scores[original_uuid] = 0
            
            for cv_uuid in cv_uuids:
                if cv_uuid not in scores:
                    scores[cv_uuid] = 0
                    
        if fallback_cvs:
            for cv in fallback_cvs:
                cv_id = cv.get('id')
                cv_text = cv.get('text', '')
                if cv_text.strip():
                    try:
                        cv_vector = self.model.encode([cv_text], convert_to_numpy=True)[0]
                        cv_norm = np.linalg.norm(cv_vector)
                        if cv_norm == 0: cv_norm = 1e-10
                        cosine = np.dot(jd_vector, cv_vector) / (jd_norm * cv_norm)
                        percent = max(0, min(100, int(cosine * 100)))
                        scores[cv_id] = min(100, percent + 5)
                    except Exception as e:
                        logger.error(f"Lỗi encode fallback {cv_id}: {e}")
                        scores[cv_id] = 0
                else:
                    scores[cv_id] = 0

        try:
            with open("match_debug.log", "a", encoding="utf-8") as f:
                f.write(f"\n--- MATCH ---\ncv_uuids: {cv_uuids}\nfallback_cvs: {len(fallback_cvs) if fallback_cvs else 0}\nscores: {scores}\n")
        except:
            pass
            
        return scores

vector_db = VectorDBManager()
