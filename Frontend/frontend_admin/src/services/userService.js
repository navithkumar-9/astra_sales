import API from '../api/axios';

export const userService = {
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = queryParams ? `/users/?${queryParams}` : '/users/';
        const res = await API.get(url);
        return res.data.success ? res.data.data : res.data;
    },
    
    getSalesReps: async () => {
        const res = await API.get('/users/?role=SALES_REP&page_size=100');
        return res.data.success ? res.data.data : res.data;
    }
};
