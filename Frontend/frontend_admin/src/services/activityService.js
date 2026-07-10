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
    }
};
