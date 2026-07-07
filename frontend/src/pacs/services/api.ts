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

export const pacsService = {
    async getStudies(skip: number = 0, limit: number = 100): Promise<IStudy[]> {
        const response = await api.get<IStudy[]>('/pacs/studies', {
            params: { skip, limit }
        });
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
    }
};

export default api;
