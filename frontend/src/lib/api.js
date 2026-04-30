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
    throw { response: { data, status: response.status } }; // Mimic AXIOS error
  }

  return { data, status: response.status }; // Mimic AXIOS response
};

const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  patch: (url, body) => request('PATCH', url, body),
  delete: (url) => request('DELETE', url)
};

export default api;
