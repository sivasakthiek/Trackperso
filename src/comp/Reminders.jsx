import React, { useState, useEffect, useRef } from 'react';

function Reminders({ onUpdate }) {
    const [reminders, setReminders] = useState(() => {
        const saved = localStorage.getItem('dashboard_reminders');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // fallback
            }
        }
        return [
            {
                id: '1',
                text: 'Deploy beta dashboard changes',
                time: '18:30',
                priority: 'high',
                completed: false
            },
            {
                id: '2',
                text: 'Team standup meeting',
                time: '10:00',
                priority: 'medium',
                completed: true
            },
            {
                id: '3',
                text: 'Read React 19 concurrent features docs',
                time: '21:00',
                priority: 'low',
                completed: false
            }
        ];
    });

    const [newText, setNewText] = useState('');
    const [newTime, setNewTime] = useState('');
    const [newPriority, setNewPriority] = useState('medium');
    const [showCompleted, setShowCompleted] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const prevRemindersRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('dashboard_reminders', JSON.stringify(reminders));
        const remindersStr = JSON.stringify(reminders);
        if (prevRemindersRef.current !== null && prevRemindersRef.current !== remindersStr) {
            if (onUpdate) onUpdate();
        }
        prevRemindersRef.current = remindersStr;
    }, [reminders]);

    const handleToggleComplete = (id) => {
        setReminders(prev => prev.map(rem => {
            if (rem.id === id) {
                return { ...rem, completed: !rem.completed };
            }
            return rem;
        }));
    };

    const handleDeleteReminder = (id) => {
        setReminders(prev => prev.filter(rem => rem.id !== id));
    };

    const handleAddReminder = (e) => {
        e.preventDefault();
        if (newText.trim()) {
            const newReminder = {
                id: Date.now().toString(),
                text: newText.trim(),
                time: newTime || 'No time set',
                priority: newPriority,
                completed: false
            };

            setReminders(prev => [...prev, newReminder]);
            setNewText('');
            setNewTime('');
            setNewPriority('medium');
            setIsAdding(false);
        }
    };

    const activeReminders = reminders.filter(r => showCompleted ? true : !r.completed);

    // Count pending reminders
    const pendingCount = reminders.filter(r => !r.completed).length;

    return (
        <div className="widget" id="reminders-widget">
            <div className="widget-header">
                <div className="widget-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m7.73 13a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <span>Upcoming Reminders</span>
                    {pendingCount > 0 && (
                        <span style={{ fontSize: '11px', background: 'rgba(251, 191, 36, 0.15)', color: 'var(--accent-amber)', padding: '2px 8px', borderRadius: '50px', marginLeft: '6px', fontWeight: 'bold' }}>
                            {pendingCount} Left
                        </span>
                    )}
                </div>
                <div className="widget-actions">
                    <button 
                        className="btn-icon-only"
                        onClick={() => setShowCompleted(!showCompleted)}
                        title={showCompleted ? "Hide Completed" : "Show Completed"}
                    >
                        {showCompleted ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>
                            </svg>
                        )}
                    </button>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setIsAdding(!isAdding)}
                        title="Quick Add Reminder"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                            <path d="M5 12h14M12 5v14"/>
                        </svg>
                        Add
                    </button>
                </div>
            </div>

            <div className="reminders-container">
                {isAdding && (
                    <form className="quick-add-form" onSubmit={handleAddReminder}>
                        <div className="input-group">
                            <input 
                                type="text" 
                                className="form-input" 
                                value={newText} 
                                onChange={(e) => setNewText(e.target.value)} 
                                placeholder="What do you need to remember?" 
                                required
                                autoFocus
                            />
                        </div>
                        <div className="quick-add-row">
                            <div className="input-group">
                                <input 
                                    type="time" 
                                    className="form-input" 
                                    value={newTime} 
                                    onChange={(e) => setNewTime(e.target.value)} 
                                />
                            </div>
                            <div className="input-group">
                                <select 
                                    className="form-select" 
                                    value={newPriority} 
                                    onChange={(e) => setNewPriority(e.target.value)}
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                        <div className="quick-add-row" style={{ marginTop: '4px' }}>
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => setIsAdding(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                            >
                                Save Reminder
                            </button>
                        </div>
                    </form>
                )}

                {activeReminders.length > 0 ? (
                    <div className="reminders-list">
                        {activeReminders.map(rem => (
                            <div 
                                className={`reminder-item ${rem.completed ? 'completed' : ''}`} 
                                key={rem.id}
                            >
                                <div className="reminder-left">
                                    <div 
                                        className={`reminder-checkbox ${rem.completed ? 'checked' : ''}`}
                                        onClick={() => handleToggleComplete(rem.id)}
                                        title={rem.completed ? "Mark Incomplete" : "Mark Complete"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </div>
                                    <div className="reminder-info">
                                        <span className="reminder-text">{rem.text}</span>
                                        <div className="reminder-meta">
                                            <span className="reminder-time">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <polyline points="12 6 12 12 16 14"/>
                                                </svg>
                                                {rem.time}
                                            </span>
                                            <span className={`priority-tag ${rem.priority}`}>{rem.priority}</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    className="reminder-delete-btn"
                                    onClick={() => handleDeleteReminder(rem.id)}
                                    title="Delete Reminder"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        <span>No reminders. Nice job staying on top of it!</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Reminders;
