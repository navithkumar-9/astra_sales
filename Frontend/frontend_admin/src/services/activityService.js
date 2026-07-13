import API from '../api/axios';

export const activityService = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = queryParams ? `/activities/?${queryParams}` : '/activities/';
        const res = await API.get(url);
        return res.data;
    },

    create: async (payload) => {
        const res = await API.post('/activities/', payload);
        return res.data;
    },

    update: async (id, payload) => {
        const res = await API.patch(`/activities/${id}/`, payload);
        return res.data;
    },

    delete: async (id) => {
        const res = await API.delete(`/activities/${id}/`);
        return res.data;
    }
};
