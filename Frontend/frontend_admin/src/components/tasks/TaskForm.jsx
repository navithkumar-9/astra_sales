const TaskForm = ({
    form,
    setForm,
    canEditOrDelete,
    COLUMNS_BASE,
    PRIORITIES,
    editTask,
    todayStr,
    isOverdue
}) => {
    return (
        <>
            <div className="modern-form-group">
                <label className="modern-form-label">Task Name</label>
                <input
                    className="modern-form-input"
                    placeholder="Task title"
                    value={form.task_name || ''}
                    onChange={(e) => setForm({ ...form, task_name: e.target.value })}
                    required
                    disabled={!canEditOrDelete}
                    style={{ fontSize: '1rem', fontWeight: 600, background: '#ffffff', borderColor: '#cbd5e1' }}
                />
            </div>

            <div className="ext-tasks-202">
                <div className="modern-form-group">
                    <label className="modern-form-label">Project</label>
                    <input
                        className="modern-form-input"
                        placeholder="Project name"
                        value={form.project_name || ''}
                        onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                        required
                        disabled={!canEditOrDelete}
                    />
                </div>

                <div className="modern-form-group">
                    <label className="modern-form-label">Status</label>
                    <select
                        className="modern-form-input"
                        value={form.status || ''}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        disabled={!canEditOrDelete}
                        style={{
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            backgroundSize: '16px',
                        }}
                    >
                        {COLUMNS_BASE.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                    </select>
                </div>

                <div className="modern-form-group">
                    <label className="modern-form-label">Priority</label>
                    <select
                        className="modern-form-input"
                        value={form.priority || ''}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        disabled={!canEditOrDelete}
                        style={{
                            appearance: 'none',
                            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 10px center',
                            backgroundSize: '16px',
                        }}
                    >
                        {PRIORITIES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>

                <div className="modern-form-group">
                    <label className="modern-form-label">Due Date</label>
                    <input
                        type="date"
                        className="modern-form-input"
                        value={form.due_date || ''}
                        min={editTask ? undefined : todayStr}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        required
                        disabled={!canEditOrDelete || (editTask && editTask.revised_due_date)}
                    />
                </div>

                {editTask && (
                    <div className="modern-form-group">
                        <label className="modern-form-label">Created At</label>
                        <input
                            type="text"
                            className="modern-form-input ext-tasks-204"
                            value={editTask.created_at ? new Date(editTask.created_at).toLocaleString() : '—'}
                            disabled
                        />
                    </div>
                )}
            </div>

            {editTask && canEditOrDelete && (
                <div className="modern-form-group">
                    <label className="modern-form-label ext-announcements-16">
                        Revised Due Date
                        {isOverdue(editTask) && <span className="ext-tasks-205">Overdue</span>}
                    </label>
                    <input
                        type="date"
                        className="modern-form-input"
                        value={form.revised_due_date || ''}
                        min={todayStr}
                        onChange={(e) => setForm({ ...form, revised_due_date: e.target.value })}
                    />
                </div>
            )}

            <div className="modern-form-group">
                <label className="modern-form-label">Description</label>
                <textarea
                    className="modern-form-input modern-form-textarea"
                    placeholder="Add description..."
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={!canEditOrDelete}
                />
            </div>
        </>
    );
};

export default TaskForm;
