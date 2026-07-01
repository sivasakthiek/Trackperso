import React, { useState, useEffect, useRef } from 'react';

function Goal({ onUpdate }) {
    // Migrate old single-goal format to new multi-goal format
    const migrateOldData = () => {
        const saved = localStorage.getItem('dashboard_goal');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Old format: { title, progress, targetDate }
                if (parsed && parsed.title && !Array.isArray(parsed)) {
                    const migrated = [{
                        id: Date.now().toString(),
                        title: parsed.title,
                        targetDate: parsed.targetDate || '',
                        tasks: [],
                        createdAt: new Date().toISOString()
                    }];
                    return migrated;
                }
                // New format: array of goals
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            } catch (e) {
                // fallback
            }
        }
        return [
            {
                id: '1',
                title: 'Become AI Engineer',
                targetDate: '2026-12-31',
                tasks: [
                    { id: 't1', text: 'Complete ML fundamentals course', completed: true },
                    { id: 't2', text: 'Build 3 portfolio projects', completed: false },
                    { id: 't3', text: 'Learn LangChain & RAG patterns', completed: false },
                    { id: 't4', text: 'Contribute to open-source AI repo', completed: false }
                ],
                createdAt: new Date().toISOString()
            }
        ];
    };

    const [goals, setGoals] = useState(migrateOldData);
    const [expandedGoalId, setExpandedGoalId] = useState(null);
    const [isAddingGoal, setIsAddingGoal] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState(null);

    // New goal form state
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalDate, setNewGoalDate] = useState('');

    // Edit goal form state
    const [editTitle, setEditTitle] = useState('');
    const [editDate, setEditDate] = useState('');

    // Add task form state per goal
    const [addingTaskGoalId, setAddingTaskGoalId] = useState(null);
    const [newTaskText, setNewTaskText] = useState('');

    const taskInputRef = useRef(null);
    const prevGoalsRef = useRef(null);

    // Persist goals to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_goal', JSON.stringify(goals));
    }, [goals]);

    // Notify parent when goals change (separate effect to avoid loops)
    useEffect(() => {
        const goalsStr = JSON.stringify(goals);
        if (prevGoalsRef.current !== null && prevGoalsRef.current !== goalsStr) {
            if (onUpdate) onUpdate();
        }
        prevGoalsRef.current = goalsStr;
    }, [goals]); // intentionally excluding onUpdate

    // Auto-focus task input
    useEffect(() => {
        if (addingTaskGoalId && taskInputRef.current) {
            taskInputRef.current.focus();
        }
    }, [addingTaskGoalId]);

    // Calculate progress for a goal based on its tasks
    const getGoalProgress = (goal) => {
        if (!goal.tasks || goal.tasks.length === 0) return 0;
        const completed = goal.tasks.filter(t => t.completed).length;
        return Math.round((completed / goal.tasks.length) * 100);
    };

    // Get progress color class
    const getProgressColor = (progress) => {
        if (progress >= 71) return 'progress-green';
        if (progress >= 31) return 'progress-amber';
        return 'progress-red';
    };

    // Calculate days remaining
    const getDaysRemaining = (targetDate) => {
        if (!targetDate) return null;
        const target = new Date(targetDate);
        const today = new Date();
        target.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (isNaN(diffDays)) return null;
        if (diffDays < 0) return { text: 'Overdue', overdue: true };
        if (diffDays === 0) return { text: 'Due today!', overdue: false };
        return { text: `${diffDays}d left`, overdue: false };
    };

    // --- Goal CRUD ---
    const handleAddGoal = (e) => {
        e.preventDefault();
        if (newGoalTitle.trim()) {
            const newGoal = {
                id: Date.now().toString(),
                title: newGoalTitle.trim(),
                targetDate: newGoalDate,
                tasks: [],
                createdAt: new Date().toISOString()
            };
            setGoals(prev => [newGoal, ...prev]);
            setNewGoalTitle('');
            setNewGoalDate('');
            setIsAddingGoal(false);
            setExpandedGoalId(newGoal.id);
        }
    };

    const handleDeleteGoal = (goalId) => {
        setGoals(prev => prev.filter(g => g.id !== goalId));
        if (expandedGoalId === goalId) setExpandedGoalId(null);
    };

    const handleEditGoal = (goal) => {
        setEditingGoalId(goal.id);
        setEditTitle(goal.title);
        setEditDate(goal.targetDate || '');
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        if (editTitle.trim()) {
            setGoals(prev => prev.map(g => {
                if (g.id === editingGoalId) {
                    return { ...g, title: editTitle.trim(), targetDate: editDate };
                }
                return g;
            }));
            setEditingGoalId(null);
        }
    };

    // --- Task CRUD ---
    const handleAddTask = (goalId, e) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            const newTask = {
                id: `t${Date.now()}`,
                text: newTaskText.trim(),
                completed: false
            };
            setGoals(prev => prev.map(g => {
                if (g.id === goalId) {
                    return { ...g, tasks: [...g.tasks, newTask] };
                }
                return g;
            }));
            setNewTaskText('');
            // Keep focus on the task input for rapid entry
            if (taskInputRef.current) {
                taskInputRef.current.focus();
            }
        }
    };

    const handleToggleTask = (goalId, taskId) => {
        setGoals(prev => prev.map(g => {
            if (g.id === goalId) {
                return {
                    ...g,
                    tasks: g.tasks.map(t => {
                        if (t.id === taskId) {
                            return { ...t, completed: !t.completed };
                        }
                        return t;
                    })
                };
            }
            return g;
        }));
    };

    const handleDeleteTask = (goalId, taskId) => {
        setGoals(prev => prev.map(g => {
            if (g.id === goalId) {
                return { ...g, tasks: g.tasks.filter(t => t.id !== taskId) };
            }
            return g;
        }));
    };

    const toggleExpand = (goalId) => {
        setExpandedGoalId(prev => prev === goalId ? null : goalId);
        setAddingTaskGoalId(null);
        setNewTaskText('');
    };

    return (
        <div className="widget" id="goal-widget">
            <div className="widget-header">
                <div className="widget-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="6"/>
                        <circle cx="12" cy="12" r="2"/>
                    </svg>
                    <span>Goals</span>
                    {goals.length > 0 && (
                        <span className="goals-count-badge">
                            {goals.length}
                        </span>
                    )}
                </div>
                <div className="widget-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsAddingGoal(!isAddingGoal)}
                        title="Add New Goal"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                            <path d="M5 12h14M12 5v14"/>
                        </svg>
                        New
                    </button>
                </div>
            </div>

            <div className="goals-container">
                {/* Add Goal Form */}
                {isAddingGoal && (
                    <form className="goal-add-form" onSubmit={handleAddGoal}>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-input"
                                value={newGoalTitle}
                                onChange={(e) => setNewGoalTitle(e.target.value)}
                                placeholder="What's your goal? (e.g. Learn Spanish)"
                                required
                                autoFocus
                            />
                        </div>
                        <div className="goal-add-row">
                            <div className="input-group">
                                <label htmlFor="new-goal-date">Target Date</label>
                                <input
                                    id="new-goal-date"
                                    type="date"
                                    className="form-input"
                                    value={newGoalDate}
                                    onChange={(e) => setNewGoalDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="goal-add-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => { setIsAddingGoal(false); setNewGoalTitle(''); setNewGoalDate(''); }}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Create Goal
                            </button>
                        </div>
                    </form>
                )}

                {/* Goals List */}
                {goals.length > 0 ? (
                    <div className="goals-list">
                        {goals.map(goal => {
                            const progress = getGoalProgress(goal);
                            const progressColor = getProgressColor(progress);
                            const daysLeft = getDaysRemaining(goal.targetDate);
                            const isExpanded = expandedGoalId === goal.id;
                            const isComplete = progress === 100 && goal.tasks.length > 0;

                            return (
                                <div
                                    className={`goal-card ${isExpanded ? 'expanded' : ''} ${isComplete ? 'goal-complete' : ''}`}
                                    key={goal.id}
                                >
                                    {/* Goal Card Header — always visible */}
                                    <div
                                        className="goal-card-header"
                                        onClick={() => toggleExpand(goal.id)}
                                    >
                                        <div className="goal-card-left">
                                            <div className={`goal-progress-ring ${progressColor}`}>
                                                <svg viewBox="0 0 36 36" width="28" height="28">
                                                    <circle
                                                        cx="18" cy="18" r="15.5"
                                                        fill="none"
                                                        stroke="var(--bg-card-inner)"
                                                        strokeWidth="3.5"
                                                    />
                                                    <circle
                                                        cx="18" cy="18" r="15.5"
                                                        fill="none"
                                                        strokeWidth="3.5"
                                                        strokeLinecap="round"
                                                        strokeDasharray={`${progress * 0.9738} ${97.38 - progress * 0.9738}`}
                                                        strokeDashoffset="24.35"
                                                        className="goal-ring-fill"
                                                    />
                                                </svg>
                                                <span className="goal-ring-text">{progress}%</span>
                                            </div>
                                            <div className="goal-card-info">
                                                <h4 className={isComplete ? 'goal-title-complete' : ''}>
                                                    {isComplete && <span className="goal-check-icon">✓ </span>}
                                                    {goal.title}
                                                </h4>
                                                <div className="goal-card-meta">
                                                    {goal.tasks.length > 0 && (
                                                        <span className="goal-task-count">
                                                            {goal.tasks.filter(t => t.completed).length}/{goal.tasks.length} tasks
                                                        </span>
                                                    )}
                                                    {daysLeft && (
                                                        <span className={`goal-deadline-tag ${daysLeft.overdue ? 'overdue' : ''}`}>
                                                            {daysLeft.text}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="goal-card-right">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16" height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className={`goal-expand-icon ${isExpanded ? 'rotated' : ''}`}
                                            >
                                                <polyline points="6 9 12 15 18 9"/>
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Expanded Content — tasks + actions */}
                                    {isExpanded && (
                                        <div className="goal-card-body">
                                            {/* Progress Bar */}
                                            <div className="progress-bar-container">
                                                <div
                                                    className={`progress-bar-fill ${progressColor}`}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            {/* Task List */}
                                            <div className="task-list">
                                                {goal.tasks.length > 0 ? (
                                                    goal.tasks.map(task => (
                                                        <div
                                                            className={`task-item ${task.completed ? 'completed' : ''}`}
                                                            key={task.id}
                                                        >
                                                            <div className="task-left">
                                                                <div
                                                                    className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                                                                    onClick={() => handleToggleTask(goal.id, task.id)}
                                                                    title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12"/>
                                                                    </svg>
                                                                </div>
                                                                <span className="task-text">{task.text}</span>
                                                            </div>
                                                            <button
                                                                className="task-delete-btn"
                                                                onClick={() => handleDeleteTask(goal.id, task.id)}
                                                                title="Delete task"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M18 6 6 18M6 6l12 12"/>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="task-empty-state">
                                                        No tasks yet — add some to track progress!
                                                    </div>
                                                )}
                                            </div>

                                            {/* Add Task */}
                                            {addingTaskGoalId === goal.id ? (
                                                <form
                                                    className="add-task-form"
                                                    onSubmit={(e) => handleAddTask(goal.id, e)}
                                                >
                                                    <input
                                                        ref={taskInputRef}
                                                        type="text"
                                                        className="form-input task-input"
                                                        value={newTaskText}
                                                        onChange={(e) => setNewTaskText(e.target.value)}
                                                        placeholder="Add a task..."
                                                        required
                                                    />
                                                    <button type="submit" className="btn btn-primary btn-sm" title="Add">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M5 12h14M12 5v14"/>
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => { setAddingTaskGoalId(null); setNewTaskText(''); }}
                                                        title="Cancel"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M18 6 6 18M6 6l12 12"/>
                                                        </svg>
                                                    </button>
                                                </form>
                                            ) : (
                                                <button
                                                    className="btn-add-task"
                                                    onClick={() => { setAddingTaskGoalId(goal.id); setNewTaskText(''); }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M5 12h14M12 5v14"/>
                                                    </svg>
                                                    Add Task
                                                </button>
                                            )}

                                            {/* Goal Actions */}
                                            <div className="goal-card-actions">
                                                <button
                                                    className="btn-icon-only"
                                                    onClick={() => handleEditGoal(goal)}
                                                    title="Edit Goal"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M12 20h9"/>
                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                                    </svg>
                                                </button>
                                                <button
                                                    className="btn-icon-only goal-delete-btn"
                                                    onClick={() => handleDeleteGoal(goal.id)}
                                                    title="Delete Goal"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="6"/>
                            <circle cx="12" cy="12" r="2"/>
                        </svg>
                        <span>No goals yet. Set your first goal!</span>
                    </div>
                )}
            </div>

            {/* Edit Goal Modal */}
            {editingGoalId && (
                <div className="modal-overlay">
                    <form className="modal-content" onSubmit={handleSaveEdit}>
                        <div className="modal-header">
                            <h3>Edit Goal</h3>
                            <button
                                type="button"
                                className="btn-icon-only"
                                onClick={() => setEditingGoalId(null)}
                                style={{ border: 'none', background: 'transparent' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        <div className="input-group">
                            <label htmlFor="edit-goal-title">Goal Title</label>
                            <input
                                id="edit-goal-title"
                                type="text"
                                className="form-input"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="Enter goal description..."
                                required
                                autoFocus
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="edit-goal-date">Target Deadline</label>
                            <input
                                id="edit-goal-date"
                                type="date"
                                className="form-input"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                            />
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setEditingGoalId(null)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Goal;