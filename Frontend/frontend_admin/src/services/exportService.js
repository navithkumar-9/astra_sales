import API from '../api/axios';

export const exportService = {
    startExport: async (format = 'csv', filters = {}) => {
        const res = await API.post('/exports/', { format, filters });
        return res.data;
    },

    getJobStatus: async (jobId) => {
        const res = await API.get(`/exports/${jobId}/`);
        return res.data;
    },

    downloadExportUrl: (jobId) => {
        // Return absolute URL for downloading using current axios defaults
        const baseURL = API.defaults.baseURL || '/api';
        return `${baseURL}/exports/${jobId}/download/`;
    },

    deleteJob: async (jobId) => {
        const res = await API.delete(`/exports/${jobId}/`);
        return res.data;
    }
};
