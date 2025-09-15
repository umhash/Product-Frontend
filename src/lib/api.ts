import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // You can add redirect logic here
      }
    }
    return Promise.reject(error);
  }
);

// Universities API
export const universitiesApi = {
  getUniversityDetails: async (universityId: number) => {
    const response = await api.get(`/universities/${universityId}`);
    return response.data;
  },
  
  downloadDocument: async (documentId: number) => {
    const response = await api.get(`/universities/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response;
  },
};

// Applications API
export const applicationsApi = {
  createApplication: async (programId: number) => {
    const response = await api.post('/applications/', {
      program_id: programId,
      personal_statement: null,
      additional_notes: null
    });
    return response.data;
  },
  
  getMyApplications: async (page = 1, perPage = 10) => {
    const response = await api.get(`/applications/?page=${page}&per_page=${perPage}`);
    return response.data;
  },
  
  getApplication: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}`);
    return response.data;
  },
  
  getRequiredDocuments: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}/required-documents`);
    return response.data;
  },
  
  uploadDocument: async (applicationId: number, documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    const response = await api.post(`/applications/${applicationId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  downloadDocument: async (applicationId: number, documentId: number) => {
    const response = await api.get(`/applications/${applicationId}/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response;
  },
  
  deleteDocument: async (applicationId: number, documentId: number) => {
    const response = await api.delete(`/applications/${applicationId}/documents/${documentId}`);
    return response.data;
  },
  
  submitApplication: async (applicationId: number, personalStatement?: string, additionalNotes?: string) => {
    const response = await api.post(`/applications/${applicationId}/submit`, {
      personal_statement: personalStatement,
      additional_notes: additionalNotes
    });
    return response.data;
  },

  downloadOfferLetter: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}/offer-letter/download`, {
      responseType: 'blob',
    });
    return response;
  },

  getInterviewDocuments: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}/interview-documents`);
    return response.data;
  },

  uploadInterviewDocument: async (applicationId: number, documentTypeId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type_id', documentTypeId.toString());
    
    const response = await api.post(`/applications/${applicationId}/upload-interview-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  requestInterview: async (applicationId: number) => {
    const response = await api.post(`/applications/${applicationId}/request-interview`);
    return response.data;
  },

  applyCAS: async (applicationId: number) => {
    const response = await api.post(`/applications/${applicationId}/apply-cas`);
    return response.data;
  },

  downloadCAS: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}/cas/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // CAS Document Management
  getCASDocuments: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}/cas-documents`);
    return response.data;
  },

  uploadCASDocument: async (applicationId: number, documentTypeId: number, file: File) => {
    const formData = new FormData();
    formData.append('document_type_id', documentTypeId.toString());
    formData.append('file', file);
    
    const response = await api.post(`/applications/${applicationId}/upload-cas-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  submitCASDocuments: async (applicationId: number) => {
    const response = await api.post(`/applications/${applicationId}/submit-cas-documents`);
    return response.data;
  },

  // Visa Document Management
  getVisaDocuments: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}/visa-documents`);
    return response.data;
  },

  uploadVisaDocument: async (applicationId: number, documentTypeId: number, file: File) => {
    const formData = new FormData();
    formData.append('document_type_id', documentTypeId.toString());
    formData.append('file', file);
    
    const response = await api.post(`/applications/${applicationId}/upload-visa-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  submitVisaDocuments: async (applicationId: number) => {
    const response = await api.post(`/applications/${applicationId}/submit-visa-documents`);
    return response.data;
  },

  applyVisa: async (applicationId: number) => {
    const response = await api.post(`/applications/${applicationId}/apply-visa`);
    return response.data;
  },

  downloadVisa: async (applicationId: number) => {
    const response = await api.get(`/applications/${applicationId}/visa/download`, {
      responseType: 'blob',
    });
    return response;
  },
};

// Documents API
export const documentsApi = {
  getMyDocuments: async () => {
    const response = await api.get('/documents/');
    return response.data;
  },
  
  getDocumentStats: async () => {
    const response = await api.get('/documents/stats');
    return response.data;
  },
  
  downloadDocument: async (documentId: number) => {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response;
  },
};

export default api;
