const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001'

async function request(method, path, { body, token, formData } = {}) {
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: formData ? formData : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || 'Request failed')
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const api = {
  get: (path, token) => request('GET', path, { token }),
  post: (path, body, token) => request('POST', path, { body, token }),
  postForm: (path, formData, token) => request('POST', path, { formData, token }),
  patch: (path, body, token) => request('PATCH', path, { body, token }),
  delete: (path, token) => request('DELETE', path, { token }),
}
