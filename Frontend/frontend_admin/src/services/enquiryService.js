import API from '../api/axios';

export const enquiryService = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                queryParams.append(key, value);
            }
        });
        const qs = queryParams.toString();
        const url = qs ? `/enquiries/?${qs}` : '/enquiries/';
        const res = await API.get(url);
        return res.data.success ? res.data.data : res.data;
    },

    getById: async (id) => {
        const res = await API.get(`/enquiries/${id}/`);
        return res.data.success ? res.data.data : res.data;
    },

    create: async (payload) => {
        const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const res = await API.post('/enquiries/', payload, config);
        return res.data;
    },

    update: async (id, payload) => {
        const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const res = await API.put(`/enquiries/${id}/`, payload, config);
        return res.data;
    },

    patch: async (id, payload) => {
        const config = payload instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
        const res = await API.patch(`/enquiries/${id}/`, payload, config);
        return res.data;
    },

    delete: async (id) => {
        const res = await API.delete(`/enquiries/${id}/`);
        return res.data;
    }
};
