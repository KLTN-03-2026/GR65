const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export { API_URL };

const request = async (method, endpoint, body = null) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Nếu token hết hạn (401), tự động redirect về login
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    throw { response: { data, status: response.status } }; // Mimic AXIOS error
  }

  return { data, status: response.status }; // Mimic AXIOS response
};

/**
 * Upload file (FormData) — dùng cho upload CV, avatar, etc.
 * Không set Content-Type header → browser tự thêm boundary cho multipart/form-data
 */
const upload = async (endpoint, formData) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData, // FormData — browser tự set Content-Type: multipart/form-data
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }
    throw { response: { data, status: response.status } };
  }

  return { data, status: response.status };
};

const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  patch: (url, body) => request('PATCH', url, body),
  delete: (url) => request('DELETE', url),
  upload: (url, formData) => upload(url, formData),
};

export default api;
