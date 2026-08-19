// Base API abstraction layer
// This module provides a mock API client that simulates network behavior.
// When the real backend (Supabase + Express) is ready, replace the mock
// implementations here — the service modules depend on this interface.

const MOCK_DELAY = 300

const mockRequest = (data, shouldFail = false) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Request failed'))
      } else {
        resolve(data)
      }
    }, MOCK_DELAY)
  })
}

export const api = {
  get: (endpoint) => {
    return mockRequest({ endpoint, method: 'GET' })
  },
  post: (endpoint, body) => {
    return mockRequest({ endpoint, method: 'POST', body })
  },
  put: (endpoint, body) => {
    return mockRequest({ endpoint, method: 'PUT', body })
  },
  delete: (endpoint) => {
    return mockRequest({ endpoint, method: 'DELETE' })
  },
}

export default api
