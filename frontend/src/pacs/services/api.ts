import axios from 'axios';
import type { IStudy, IPatient, ISeries, IInstance } from '../types';

// Configure the base API URL (could be from env vars in production)
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const pacsService = {
    async getStudies(filters?: { patient_name?: string; patient_id?: string; study_date?: string }, skip: number = 0, limit: number = 100): Promise<IStudy[]> {
        const response = await api.get<IStudy[]>('/pacs/studies', {
            params: { skip, limit, ...filters }
        });
        return response.data;
    },

    async getStudy(studyId: string): Promise<IStudy> {
        const response = await api.get<IStudy>(`/pacs/studies/${studyId}`);
        return response.data;
    },

    async getPatients(skip: number = 0, limit: number = 100): Promise<IPatient[]> {
        const response = await api.get<IPatient[]>('/pacs/patients', {
            params: { skip, limit }
        });
        return response.data;
    },

    async getSeries(studyId: string): Promise<ISeries[]> {
        const response = await api.get<ISeries[]>(`/pacs/studies/${studyId}/series`);
        return response.data;
    },

    async getInstances(seriesId: string): Promise<IInstance[]> {
        const response = await api.get<IInstance[]>(`/pacs/series/${seriesId}/instances`);
        return response.data;
    },

    async saveAnnotations(seriesId: string, data: any): Promise<any> {
        const response = await api.post(`/pacs/series/${seriesId}/annotations`, { data });
        return response.data;
    },

    async getAnnotations(seriesId: string): Promise<any> {
        const response = await api.get(`/pacs/series/${seriesId}/annotations`);
        return response.data;
    },

    async saveReport(studyId: string, content: string, status: string = "DRAFT"): Promise<any> {
        const response = await api.post(`/pacs/studies/${studyId}/report`, { content, status });
        return response.data;
    },

    async getReport(studyId: string): Promise<any> {
        const response = await api.get(`/pacs/studies/${studyId}/report`);
        return response.data;
    },

    async uploadDicom(files: FileList): Promise<any> {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        const response = await api.post('/pacs/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async generateAiDraft(studyId: string): Promise<any> {
        const response = await api.post(`/pacs/studies/${studyId}/ai-draft`);
        return response.data;
    },

    async login(username: string, password: string): Promise<any> {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await api.post('/core/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    },

    async uploadSeriesVideo(seriesId: string, videoBlob: Blob): Promise<any> {
        const formData = new FormData();
        formData.append('file', videoBlob, `cine_${seriesId}.webm`);
        
        const response = await api.post(`/pacs/series/${seriesId}/video`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async getSeriesVideo(seriesId: string): Promise<Blob> {
        const response = await api.get(`/pacs/series/${seriesId}/video`, {
            responseType: 'blob'
        });
        return response.data;
    },

    async deleteSeriesVideo(seriesId: string): Promise<any> {
        const response = await api.delete(`/pacs/series/${seriesId}/video`);
        return response.data;
    },

    async getSeriesWithVideos(): Promise<any[]> {
        const response = await api.get<any[]>('/pacs/videos');
        return response.data;
    },

    async getReports(): Promise<any[]> {
        const response = await api.get<any[]>('/pacs/reports');
        return response.data;
    }
};

export default api;
