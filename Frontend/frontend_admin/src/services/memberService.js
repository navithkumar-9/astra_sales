import API from '../api/axios';

/**
 * Member/Team API service.
 */
export const memberService = {
    searchMembers: (query) => API.get('/members/search/', { params: { q: query } }),
    getMembers: () => API.get('/members/'),
    getMember: (id) => API.get(`/members/${id}/`),
};
