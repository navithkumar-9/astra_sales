import { getAvatarStyle } from '../../utils/avatar';

const AssigneeSelector = ({ teamMembers, user, form, canEditOrDelete, toggleAssignee }) => {
    return (
        <div className="modern-form-group ext-tasks-207">
            <label className="modern-form-label">
                Assign To ({form.assignee_ids?.length || 0} selected)
            </label>

            <div className="modern-assignee-grid">
                {teamMembers.length === 0 ? (
                    <div className="ext-tasks-208">No team members available</div>
                ) : (
                    teamMembers
                        .filter((m) => m.id !== user?.id)
                        .map((m) => {
                            const isSelected = form.assignee_ids?.includes(m.id);
                            const avStyle = getAvatarStyle(m.username);

                            return (
                                <div
                                    key={m.id}
                                    className={`modern-assignee-item ${isSelected ? 'selected' : ''} ${!canEditOrDelete ? 'disabled' : ''}`}
                                    onClick={() => {
                                        if (canEditOrDelete) {
                                            toggleAssignee(m.id);
                                        }
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected || false}
                                        readOnly
                                        className="modern-assignee-checkbox"
                                    />

                                    {m.profile_picture ? (
                                        <img
                                            src={m.profile_picture}
                                            alt="Avatar"
                                            className="modern-assignee-avatar ext-tasks-209"
                                        />
                                    ) : (
                                        <div
                                            className="modern-assignee-avatar"
                                            style={{
                                                background: avStyle.bg,
                                                color: avStyle.text,
                                            }}
                                        >
                                            {m.username?.charAt(0).toUpperCase()}
                                        </div>
                                    )}

                                    <span className="modern-assignee-name">{m.username}</span>
                                </div>
                            );
                        })
                )}
            </div>
        </div>
    );
};

export default AssigneeSelector;
