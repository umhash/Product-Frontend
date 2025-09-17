import axios from 'axios';

// Create axios instance for admin API
const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 30000, // 30 seconds for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
adminApi.interceptors.request.use(
  (config) => {
    // Add admin auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
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
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear admin token and redirect to admin login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Admin Authentication API
export const adminAuth = {
  login: async (username: string, password: string) => {
    const response = await adminApi.post('/admin/auth/login', { username, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await adminApi.get('/admin/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await adminApi.post('/admin/auth/logout');
    return response.data;
  },
};

// Programs API
export const programsApi = {
  getPrograms: async (params: {
    page?: number;
    per_page?: number;
    search?: string;
    level?: string;
    city?: string;
    is_active?: boolean;
  } = {}) => {
    const response = await adminApi.get('/admin/api/programs/', { params });
    return response.data;
  },
  
  createProgram: async (programData: any) => {
    const response = await adminApi.post('/admin/api/programs/', programData);
    return response.data;
  },
  
  getProgram: async (id: number) => {
    const response = await adminApi.get(`/admin/api/programs/${id}`);
    return response.data;
  },
  
  updateProgram: async (id: number, programData: any) => {
    const response = await adminApi.put(`/admin/api/programs/${id}`, programData);
    return response.data;
  },
  
  deleteProgram: async (id: number) => {
    const response = await adminApi.delete(`/admin/api/programs/${id}`);
    return response.data;
  },
  
  uploadDocuments: async (programId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await adminApi.post(
      `/admin/api/programs/${programId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  downloadProgramsTemplate: async () => {
    const response = await adminApi.get('/admin/api/programs/csv-template', {
      responseType: 'blob',
    });
    return response;
  },

  bulkUploadPrograms: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await adminApi.post('/admin/api/programs/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data as { inserted: number; skipped_duplicates: number; errors: { row: number; error: string }[] };
  },
};

// Documents API
export const documentsApi = {
  getProgramDocuments: async (programId: number) => {
    const response = await adminApi.get(`/admin/api/documents/program/${programId}`);
    return response.data;
  },
  
  downloadDocument: async (documentId: number) => {
    const response = await adminApi.get(`/admin/api/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response;
  },
  
  deleteDocument: async (documentId: number) => {
    const response = await adminApi.delete(`/admin/api/documents/${documentId}`);
    return response.data;
  },
  
  getDocumentInfo: async (documentId: number) => {
    const response = await adminApi.get(`/admin/api/documents/${documentId}`);
    return response.data;
  },
  
  getAllDocuments: async () => {
    const response = await adminApi.get('/admin/api/documents/');
    return response.data;
  },
};

// Document Types API
export const documentTypesApi = {
  getDocumentTypes: async () => {
    const response = await adminApi.get('/admin/api/document-types/');
    return response.data;
  },
  
  createDocumentType: async (data: { name: string; description?: string; is_common: boolean }) => {
    const response = await adminApi.post('/admin/api/document-types/', data);
    return response.data;
  },
  
  updateDocumentType: async (id: number, data: any) => {
    const response = await adminApi.put(`/admin/api/document-types/${id}`, data);
    return response.data;
  },
  
  deleteDocumentType: async (id: number) => {
    const response = await adminApi.delete(`/admin/api/document-types/${id}`);
    return response.data;
  },
  
  getProgramRequirements: async (programId: number) => {
    const response = await adminApi.get(`/admin/api/document-types/program/${programId}`);
    return response.data;
  },
  
  updateProgramRequirements: async (programId: number, documentTypeIds: number[]) => {
    const response = await adminApi.post(`/admin/api/document-types/program/${programId}/requirements`, {
      program_id: programId,
      document_type_ids: documentTypeIds
    });
    return response.data;
  },
  
  seedDocumentTypes: async () => {
    const response = await adminApi.post('/admin/api/document-types/seed');
    return response.data;
  },
};

// Applications API
export const adminApplicationsApi = {
  requestOfferLetter: async (applicationId: number, generateEmail: boolean = true) => {
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/request-offer-letter`, null, {
      params: { generate_email: generateEmail }
    });
    return response.data;
  },

  downloadOfferLetter: async (applicationId: number) => {
    const response = await adminApi.get(`/admin/api/applications/${applicationId}/offer-letter/download`, {
      responseType: 'blob',
    });
    return response;
  },

  configureInterviewDocuments: async (applicationId: number, documentTypeIds: number[], notes?: string) => {
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/configure-interview-documents`, {
      document_type_ids: documentTypeIds,
      notes
    });
    return response.data;
  },

  getInterviewDocuments: async (applicationId: number) => {
    const response = await adminApi.get(`/admin/api/applications/${applicationId}/interview-documents`);
    return response.data;
  },

  getInterviewRequests: async (page = 1, perPage = 10) => {
    const response = await adminApi.get(`/admin/api/applications/interview-requests?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  scheduleInterview: async (applicationId: number, scheduleData: {
    interview_date: string;
    interview_location?: string;
    interview_meeting_link?: string;
    interview_notes?: string;
  }) => {
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/schedule-interview`, scheduleData);
    return response.data;
  },

  markInterviewResult: async (applicationId: number, result: 'pass' | 'fail', resultNotes?: string) => {
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/interview-result`, {
      result,
      result_notes: resultNotes
    });
    return response.data;
  },

  uploadCAS: async (applicationId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/upload-cas`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadCAS: async (applicationId: number) => {
    const response = await adminApi.get(`/admin/api/applications/${applicationId}/cas/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // CAS Document Management
  configureCASDocuments: async (applicationId: number, documentTypeIds: number[], notes?: string) => {
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/configure-cas-documents`, {
      document_type_ids: documentTypeIds,
      notes: notes
    });
    return response.data;
  },

  getCASDocuments: async (applicationId: number) => {
    const response = await adminApi.get(`/admin/api/applications/${applicationId}/cas-documents`);
    return response.data;
  },

  // Visa Document Management
  configureVisaDocuments: async (applicationId: number, documentTypeIds: number[], notes?: string) => {
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/configure-visa-documents`, {
      document_type_ids: documentTypeIds,
      notes: notes
    });
    return response.data;
  },

  getVisaDocuments: async (applicationId: number) => {
    const response = await adminApi.get(`/admin/api/applications/${applicationId}/visa-documents`);
    return response.data;
  },

  uploadVisa: async (applicationId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/upload-visa`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  downloadVisa: async (applicationId: number) => {
    const response = await adminApi.get(`/admin/api/applications/${applicationId}/visa/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // Offer Letter Email Management
  generateOfferLetterEmail: async (applicationId: number) => {
    const response = await adminApi.post(`/admin/api/applications/${applicationId}/generate-offer-letter-email`);
    return response.data;
  },

  getOfferLetterEmailDraft: async (applicationId: number) => {
    const response = await adminApi.get(`/admin/api/applications/${applicationId}/offer-letter-email-draft`);
    return response.data;
  },

  updateOfferLetterEmailDraft: async (applicationId: number, emailContent: string) => {
    const response = await adminApi.put(`/admin/api/applications/${applicationId}/offer-letter-email-draft`, {
      email_content: emailContent
    });
    return response.data;
  },
};

export default adminApi;
