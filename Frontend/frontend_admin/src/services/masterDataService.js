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

const makeCacheKey = (key, params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([paramKey, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(paramKey, value);
        }
    });
    const queryString = queryParams.toString();
    return queryString ? `${key}?${queryString}` : key;
};

const fetchWithCache = async (key, fetchFn, params) => {
    const cacheKey = makeCacheKey(key, params);
    const now = Date.now();
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp < CACHE_DURATION)) {
        return cache[cacheKey].data;
    }
    const data = await fetchFn(params);
    cache[cacheKey] = {
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
            Object.keys(cache)
                .filter((cacheKey) => cacheKey === key || cacheKey.startsWith(`${key}?`))
                .forEach((cacheKey) => delete cache[cacheKey]);
            return;
        }
        Object.keys(cache).forEach((cacheKey) => delete cache[cacheKey]);
    },
};
