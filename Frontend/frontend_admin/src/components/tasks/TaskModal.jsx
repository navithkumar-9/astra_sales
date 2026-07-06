import TaskForm from './TaskForm';
import TaskSubtasks from './TaskSubtasks';
import AssigneeSelector from './AssigneeSelector';
import TaskComments from './TaskComments';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const TaskModal = ({
    showModal,
    setShowModal,
    editTask,
    COLUMNS_BASE,
    canEditOrDelete,
    deleteTask,
    handleSubmit,
    error,
    form,
    setForm,
    todayStr,
    isOverdue,
    subtasks,
    totalSubtasks,
    completedSubtasks,
    setShowSubtaskInput,
    showSubtaskInput,
    toggleSubtask,
    deleteSubtask,
    newSubtaskTitle,
    setNewSubtaskTitle,
    addSubtask,
    teamMembers,
    user,
    toggleAssignee,
    loadingComments,
    comments,
    commentText,
    setCommentText,
    postComment,
    postingComment,
    commentsEndRef,
    canCrud,
}) => {
    if (!showModal) return null;

    return (
        <div className="modern-modal-overlay" onClick={() => setShowModal(false)}>
            <div
                className={`modern-modal-card ${editTask ? 'expanded' : 'simple'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="ext-tasks-195">
                    <div className="ext-announcements-14">
                        <h2 className="ext-tasks-196">
                            {editTask ? 'Edit Task' : 'New Task'}
                        </h2>
                        {editTask && (
                            <span className="ext-tasks-197">
                                {COLUMNS_BASE.find((c) => c.id === editTask.status)?.label}
                            </span>
                        )}
                    </div>
                    <div className="ext-completed-tasks-127">
                        {editTask && canEditOrDelete && (
                            <button
                                onClick={deleteTask}
                                className="ext-tasks-198"
                                onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                            >
                                Delete
                            </button>
                        )}
                        <button
                            onClick={() => setShowModal(false)}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#fff',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                lineHeight: 1,
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="modern-modal-body">
                    <div className="modern-modal-left">
                        <form onSubmit={handleSubmit} id="task-form">
                            {error && (
                                <div className="alert-error ext-tasks-200">
                                    {error}
                                </div>
                            )}

                            <TaskForm 
                                form={form}
                                setForm={setForm}
                                canEditOrDelete={canEditOrDelete}
                                COLUMNS_BASE={COLUMNS_BASE}
                                PRIORITIES={PRIORITIES}
                                editTask={editTask}
                                todayStr={todayStr}
                                isOverdue={isOverdue}
                            />

                            {editTask && (
                                <TaskSubtasks 
                                    subtasks={subtasks}
                                    totalSubtasks={totalSubtasks}
                                    completedSubtasks={completedSubtasks}
                                    canCrud={canCrud}
                                    showSubtaskInput={showSubtaskInput}
                                    setShowSubtaskInput={setShowSubtaskInput}
                                    toggleSubtask={toggleSubtask}
                                    deleteSubtask={deleteSubtask}
                                    newSubtaskTitle={newSubtaskTitle}
                                    setNewSubtaskTitle={setNewSubtaskTitle}
                                    addSubtask={addSubtask}
                                />
                            )}

                            {canCrud && (
                                <AssigneeSelector 
                                    teamMembers={teamMembers}
                                    user={user}
                                    form={form}
                                    canEditOrDelete={canEditOrDelete}
                                    toggleAssignee={toggleAssignee}
                                />
                            )}

                            {canEditOrDelete && (
                                <div className="modern-modal-footer">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="modern-btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="modern-btn-primary">
                                        {editTask ? 'Update Task' : 'Create Task'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {editTask && (
                        <TaskComments 
                            comments={comments}
                            loadingComments={loadingComments}
                            commentText={commentText}
                            setCommentText={setCommentText}
                            postComment={postComment}
                            postingComment={postingComment}
                            commentsEndRef={commentsEndRef}
                            user={user}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskModal;
