import API from '../api/axios';

const createMasterDataService = (endpoint) => ({
    getAll: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
        const res = await API.get(url);
        return res.data.success ? res.data.data : res.data;
    },
    create: async (payload) => {
        const res = await API.post(endpoint, payload);
        return res.data;
    },
    update: async (id, payload) => {
        const res = await API.put(`${endpoint}${id}/`, payload);
        return res.data;
    },
    delete: async (id) => {
        const res = await API.delete(`${endpoint}${id}/`);
        return res.data;
    }
});

export const customerService = createMasterDataService('/customers/');
export const sbuService = createMasterDataService('/sbus/');
export const divisionService = createMasterDataService('/divisions/');
export const rfqService = createMasterDataService('/rfqs/');
export const fgService = createMasterDataService('/fgs/');

// Caching layer for Master Data
const cache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchWithCache = async (key, fetchFn, params) => {
    const now = Date.now();
    if (cache[key] && (now - cache[key].timestamp < CACHE_DURATION)) {
        return cache[key].data;
    }
    const data = await fetchFn(params);
    cache[key] = {
        data,
        timestamp: now
    };
    return data;
};

export const masterDataService = {
    getCustomers: (params) => fetchWithCache('customers', customerService.getAll, params),
    getSBUs: (params) => fetchWithCache('sbus', sbuService.getAll, params),
    getDivisions: (params) => fetchWithCache('divisions', divisionService.getAll, params),
    getRFQs: (params) => fetchWithCache('rfqs', rfqService.getAll, params),
    getFGs: (params) => fetchWithCache('fgs', fgService.getAll, params),
    invalidate: (key) => {
        if (key) {
            delete cache[key];
            return;
        }
        Object.keys(cache).forEach((cacheKey) => delete cache[cacheKey]);
    },
};
