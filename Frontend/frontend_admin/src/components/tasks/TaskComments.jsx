import { getAvatarStyle } from '../../utils/avatar';
import { timeAgo } from '../../utils/timeAgo';

const TaskComments = ({
    comments,
    loadingComments,
    commentText,
    setCommentText,
    postComment,
    postingComment,
    commentsEndRef,
    user
}) => {
    return (
        <div className="modern-modal-right">
            <div className="modern-activity-header">
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-secondary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="modern-activity-header-title">Activity & Comments</span>
                {comments.length > 0 && (
                    <span className="modern-activity-header-count">{comments.length}</span>
                )}
            </div>

            <div className="modern-activity-feed">
                {loadingComments ? (
                    <div className="modern-comments-loading-state">
                        <div className="modern-comment-spinner"></div>
                        <div className="ext-tasks-210">Loading activity...</div>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const avStyle = getAvatarStyle(comment.user?.username || '');
                        return (
                            <div key={comment.id} className="modern-comment-card">
                                {comment.user?.profile_picture ? (
                                    <img
                                        src={comment.user.profile_picture}
                                        alt="Avatar"
                                        className="modern-comment-avatar ext-tasks-209"
                                    />
                                ) : (
                                    <div
                                        className="modern-comment-avatar"
                                        style={{ background: avStyle.bg, color: avStyle.text }}
                                    >
                                        {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                )}
                                <div className="modern-comment-content-area">
                                    <div className="modern-comment-header">
                                        <span className="modern-comment-username">
                                            {comment.user?.username || 'Unknown'}
                                        </span>
                                        <span className="modern-comment-time">
                                            {timeAgo(comment.created_at)}
                                        </span>
                                    </div>
                                    <div className="modern-comment-bubble">{comment.content}</div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={commentsEndRef} />
            </div>

            <div className="modern-comment-input-panel">
                <div className="modern-comment-input-row">
                    {(() => {
                        const avStyle = getAvatarStyle(user?.username || 'U');
                        return user?.profile_picture ? (
                            <img
                                src={user.profile_picture}
                                alt="Avatar"
                                className="modern-comment-input-avatar ext-tasks-209"
                            />
                        ) : (
                            <div
                                className="modern-comment-input-avatar"
                                style={{ background: avStyle.bg, color: avStyle.text }}
                            >
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        );
                    })()}
                    <textarea
                        className="modern-comment-textarea"
                        placeholder="Add comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                postComment();
                            }
                        }}
                        rows={1}
                    />
                    <button
                        onClick={postComment}
                        className="modern-comment-submit-btn"
                        disabled={!commentText.trim() || postingComment}
                    >
                        {postingComment ? (
                            <div className="modern-btn-spinner"></div>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskComments;
