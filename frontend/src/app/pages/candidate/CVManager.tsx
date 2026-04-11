import { useState, useRef } from "react";
import axios from "axios";
import {
  Upload, FileText, Brain, Trash2, Star, Eye, Download,
  CheckCircle, AlertCircle, Clock, File, ImageIcon, RefreshCw, Plus
} from "lucide-react";
import { mockCVs } from "../../data/mockData";
import { toast } from "sonner";

export function CVManager() {
  const [cvs, setCvs] = useState(mockCVs);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState<string | null>(null);
  const [selectedCV, setSelectedCV] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('cv', file);

    const newCVId = `cv_${Date.now()}`;
    const newCV = {
      id: newCVId,
      name: file.name,
      candidateId: "user-id", // lấy theo token
      uploadDate: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      format: file.name.split('.').pop()?.toUpperCase() || "UNK",
      isDefault: false,
      aiParsed: false,
      aiScore: 0,
      skills: [],
      extractedInfo: { experience: "", education: "", languages: [] },
    };
    setCvs(prev => [...prev, newCV]);
    setParsing(newCVId);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/cv/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success(res.data.message);
      // Giả lập AI update sau khi load thành công
      setCvs(prev => prev.map(cv => cv.id === newCVId
        ? { ...cv, aiParsed: true, aiScore: 87, skills: ["React", "AI", "Node.js"] }
        : cv
      ));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi tải lên CV (không có token)");
      setCvs(prev => prev.filter(cv => cv.id !== newCVId));
    } finally {
      setParsing(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); 
    setDragOver(false); 
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleDelete = (id: string) => {
    setCvs(prev => prev.filter(cv => cv.id !== id));
    if (selectedCV === id) setSelectedCV(null);
    toast.success("Đã xóa CV");
  };

  const handleSetDefault = (id: string) => {
    setCvs(prev => prev.map(cv => ({ ...cv, isDefault: cv.id === id })));
    toast.success("Đã đặt làm CV mặc định");
  };

  const selectedCVData = cvs.find(cv => cv.id === selectedCV);

  const formatIcons: Record<string, React.ElementType> = {
    PDF: FileText,
    "Word (.docx)": File,
    Image: ImageIcon,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">Quản lý CV</h1>
          <p className="text-sm text-gray-500 mt-1">Lưu và quản lý nhiều bản CV cho từng vị trí ứng tuyển</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> Thêm CV mới
        </button>
      </div>

      {/* AI Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white text-sm mb-1">AI CV Parser đang hoạt động</h3>
          <p className="text-violet-100 text-xs">Hỗ trợ PDF, Word (.docx), và ảnh chụp CV (OCR). AI tự động trích xuất kỹ năng, kinh nghiệm, học vấn.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-white">Active</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* CV List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Upload zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}
          >
            <input type="file" className="hidden" ref={fileInputRef} onChange={onFileChange} accept=".pdf,.doc,.docx,.jpg,.png" />
            <Upload className={`w-8 h-8 mx-auto mb-3 ${dragOver ? "text-indigo-500" : "text-gray-300"}`} />
            <p className="text-sm text-gray-600 mb-1" style={{ fontWeight: 500 }}>Kéo & thả file vào đây</p>
            <p className="text-xs text-gray-400">Hỗ trợ PDF, DOCX, JPG, PNG — Tối đa 10MB</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              {["PDF", "DOCX", "JPG", "PNG"].map(f => (
                <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{f}</span>
              ))}
            </div>
          </div>

          {/* CV Cards */}
          {cvs.map(cv => {
            const Icon = formatIcons[cv.format] || FileText;
            return (
              <div
                key={cv.id}
                onClick={() => setSelectedCV(cv.id === selectedCV ? null : cv.id)}
                className={`bg-white rounded-2xl border-2 transition-all cursor-pointer ${selectedCV === cv.id ? "border-indigo-400 shadow-md" : "border-gray-100 hover:border-gray-200 shadow-sm"}`}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${cv.isDefault ? "bg-indigo-100" : "bg-gray-100"}`}>
                      {parsing === cv.id ? (
                        <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                      ) : (
                        <Icon className={`w-5 h-5 ${cv.isDefault ? "text-indigo-600" : "text-gray-400"}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm text-gray-900 truncate" style={{ fontWeight: 600 }}>{cv.name}</h4>
                        {cv.isDefault && (
                          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full flex-shrink-0">Mặc định</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span>{cv.size}</span>
                        <span>•</span>
                        <span>{cv.format}</span>
                        <span>•</span>
                        <span>Cập nhật: {cv.lastModified}</span>
                      </div>

                      {parsing === cv.id ? (
                        <div className="flex items-center gap-2 text-xs text-indigo-600">
                          <div className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                          AI đang phân tích CV...
                        </div>
                      ) : cv.aiParsed ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${cv.aiScore}%` }}></div>
                            </div>
                            <span className="text-xs text-indigo-600 flex-shrink-0" style={{ fontWeight: 600 }}>AI: {cv.aiScore}%</span>
                          </div>
                          {cv.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {cv.skills.slice(0, 4).map(s => (
                                <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3 h-3" /> Chưa được AI phân tích
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedCV(cv.id); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                      <Eye className="w-3.5 h-3.5" /> Xem
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">
                      <Download className="w-3.5 h-3.5" /> Tải về
                    </button>
                    {!cv.isDefault && (
                      <button onClick={(e) => { e.stopPropagation(); handleSetDefault(cv.id); }} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-amber-600 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                        <Star className="w-3.5 h-3.5" /> Đặt mặc định
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(cv.id); }} className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CV Detail Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedCVData ? (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm text-gray-900 mb-4" style={{ fontWeight: 600 }}>Kết quả AI Parsing</h3>
                {selectedCVData.aiParsed ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-500">AI Score</span>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl text-indigo-600" style={{ fontWeight: 800 }}>{selectedCVData.aiScore}%</div>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${selectedCVData.aiScore}%` }}></div>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-400 mb-1">Kinh nghiệm</div>
                        <div className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{selectedCVData.extractedInfo.experience}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-400 mb-1">Học vấn</div>
                        <div className="text-sm text-gray-700" style={{ fontWeight: 500 }}>{selectedCVData.extractedInfo.education}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-400 mb-2">Ngôn ngữ</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCVData.extractedInfo.languages.map(l => (
                            <span key={l} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{l}</span>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <div className="text-xs text-gray-400 mb-2">Kỹ năng được trích xuất</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCVData.skills.map(s => (
                            <span key={s} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">CV chưa được AI phân tích</p>
                    <button className="mt-3 text-xs text-indigo-600 hover:underline">Phân tích ngay</button>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 p-5">
                <h3 className="text-sm text-gray-900 mb-3">Mẹo cải thiện CV</h3>
                <div className="space-y-2">
                  {["Thêm portfolio/GitHub link", "Mô tả thành tích cụ thể hơn", "Cập nhật kỹ năng mới nhất"].map(tip => (
                    <div key={tip} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span className="text-xs text-gray-600">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chọn một CV để xem kết quả phân tích AI</p>
            </div>
          )}

          {/* Format support */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm text-gray-900 mb-3">Định dạng hỗ trợ</h3>
            <div className="space-y-2">
              {[
                { format: "PDF", desc: "Hỗ trợ đầy đủ", icon: FileText, color: "text-red-500", status: "full" },
                { format: "Word (.docx)", desc: "Hỗ trợ đầy đủ", icon: File, color: "text-blue-500", status: "full" },
                { format: "Ảnh (OCR)", desc: "Trích xuất chữ từ ảnh", icon: ImageIcon, color: "text-amber-500", status: "ocr" },
              ].map(item => (
                <div key={item.format} className="flex items-center gap-3 p-2 rounded-lg">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <div className="flex-1">
                    <div className="text-xs text-gray-700" style={{ fontWeight: 500 }}>{item.format}</div>
                    <div className="text-xs text-gray-400">{item.desc}</div>
                  </div>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
