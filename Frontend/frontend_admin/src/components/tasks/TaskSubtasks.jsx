const TaskSubtasks = ({
    subtasks,
    totalSubtasks,
    completedSubtasks,
    canCrud,
    showSubtaskInput,
    setShowSubtaskInput,
    toggleSubtask,
    deleteSubtask,
    newSubtaskTitle,
    setNewSubtaskTitle,
    addSubtask
}) => {
    return (
        <div className="modern-subtasks-panel">
            <div className="modern-subtasks-header">
                <div className="modern-subtasks-title-area">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span className="modern-subtasks-title">Subtasks</span>
                    {totalSubtasks > 0 && (
                        <span className="modern-subtasks-count">
                            {completedSubtasks}/{totalSubtasks}
                        </span>
                    )}
                </div>

                {canCrud && (
                    <button
                        type="button"
                        onClick={() => setShowSubtaskInput(true)}
                        className="modern-subtasks-add-btn"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Subtask
                    </button>
                )}
            </div>

            {totalSubtasks > 0 && (
                <div className="modern-subtask-progress-container">
                    <div
                        className={`modern-subtask-progress-bar ${completedSubtasks === totalSubtasks ? 'completed' : ''}`}
                        style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                    ></div>
                </div>
            )}

            <div className="modern-subtask-list">
                {subtasks.map((sub) => (
                    <div key={sub.id} className="modern-subtask-item">
                        <div
                            className={`modern-subtask-checkbox-custom ${sub.is_completed ? 'checked' : ''}`}
                            onClick={() => toggleSubtask(sub.id, sub.is_completed)}
                        >
                            {sub.is_completed && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </div>
                        <span
                            className={`modern-subtask-title-text ${sub.is_completed ? 'completed' : ''}`}
                            onClick={() => toggleSubtask(sub.id, sub.is_completed)}
                            style={{ cursor: 'pointer' }}
                        >
                            {sub.title}
                        </span>
                        {canCrud && (
                            <button
                                type="button"
                                onClick={() => deleteSubtask(sub.id)}
                                className="modern-subtask-delete-btn"
                                title="Delete subtask"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {showSubtaskInput && (
                <div className="modern-subtask-input-row">
                    <input
                        type="text"
                        className="modern-subtask-input"
                        placeholder="Subtask title..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                        autoFocus
                    />
                    <button type="button" onClick={addSubtask} className="modern-subtask-btn-add">Add</button>
                    <button
                        type="button"
                        onClick={() => { setShowSubtaskInput(false); setNewSubtaskTitle(''); }}
                        className="modern-subtask-btn-cancel"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {subtasks.length === 0 && !showSubtaskInput && (
                <p className="ext-tasks-206">No subtasks yet</p>
            )}
        </div>
    );
};

export default TaskSubtasks;
