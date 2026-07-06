import API from '../api/axios';

/**
 * Task API service - centralizes all task-related API calls.
 * Follows Single Responsibility: only handles task data operations.
 */
export const taskService = {
    getTasks: (status) => API.get('/tasks/', { params: status ? { status } : {} }),
    getTask: (id) => API.get(`/tasks/${id}/`),
    createTask: (data) => API.post('/tasks/', data),
    updateTask: (id, data) => API.patch(`/tasks/${id}/`, data),
    deleteTask: (id) => API.delete(`/tasks/${id}/`),
    moveTask: (id, status) => API.patch(`/tasks/${id}/`, { status }),
    
    // Subtasks
    addSubtask: (taskId, data) => API.post(`/tasks/${taskId}/subtasks/`, data),
    updateSubtask: (taskId, subtaskId, data) => API.patch(`/tasks/${taskId}/subtasks/${subtaskId}/`, data),
    deleteSubtask: (taskId, subtaskId) => API.delete(`/tasks/${taskId}/subtasks/${subtaskId}/`),
    
    // Comments
    getComments: (taskId) => API.get(`/tasks/${taskId}/comments/`),
    addComment: (taskId, text) => API.post(`/tasks/${taskId}/comments/`, { text }),
    
    // Attachments
    addAttachment: (taskId, formData) => API.post(`/tasks/${taskId}/attachments/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};
