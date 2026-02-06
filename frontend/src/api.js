// API wrapper for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Handle file uploads
  if (config.body instanceof FormData) {
    delete config.headers['Content-Type']; // Let browser set multipart boundary
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error or server unavailable', 0);
  }
};

// API methods
export const api = {
  // Health check
  health: () => apiRequest('/health'),

  // Business operations
  createBusiness: (data) => apiRequest('/business', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // File upload
  uploadFile: (businessId, file) => {
    const formData = new FormData();
    formData.append('business_id', businessId);
    formData.append('file', file);
    
    return apiRequest('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  // Analysis
  analyzeBusiness: (businessId) => apiRequest(`/analyze/${businessId}`, {
    method: 'POST',
  }),

  // Dashboard
  getDashboard: (businessId) => apiRequest(`/dashboard/${businessId}`),

  // Insights
  generateInsights: (businessId, language = 'en') => 
    apiRequest(`/insights/${businessId}?lang=${language}`, {
      method: 'POST',
    }),

  getInsights: (businessId) => apiRequest(`/dashboard/${businessId}/insights`),
};

export default api;
