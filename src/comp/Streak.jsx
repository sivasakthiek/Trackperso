import React, { useState, useEffect, useRef } from 'react';

function Streak({ onUpdate }) {
    const [habitName, setHabitName] = useState(() => {
        return localStorage.getItem('dashboard_habit_name') || 'Daily Coding';
    });
    
    const [isEditing, setIsEditing] = useState(false);
    const [editHabitName, setEditHabitName] = useState(habitName);

    // completedDays stores date strings in YYYY-MM-DD format
    const [completedDays, setCompletedDays] = useState(() => {
        const saved = localStorage.getItem('dashboard_streak_completed');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                // fallback
            }
        }
        return [];
    });

    const [longestStreak, setLongestStreak] = useState(() => {
        return parseInt(localStorage.getItem('dashboard_longest_streak') || '0', 10);
    });
    const prevCompletedDaysRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('dashboard_habit_name', habitName);
    }, [habitName]);

    useEffect(() => {
        localStorage.setItem('dashboard_streak_completed', JSON.stringify(completedDays));
        calculateAndSyncStreaks();
        const completedStr = JSON.stringify(completedDays);
        if (prevCompletedDaysRef.current !== null && prevCompletedDaysRef.current !== completedStr) {
            if (onUpdate) onUpdate();
        }
        prevCompletedDaysRef.current = completedStr;
    }, [completedDays]);

    // Generate dates for current week (Monday to Sunday)
    const getWeekDays = () => {
        const current = new Date();
        const dayOfWeek = current.getDay(); // 0 is Sun, 1 is Mon, etc.
        // Adjust so Mon is 0, Tue is 1, ..., Sun is 6
        const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        const monday = new Date(current);
        monday.setDate(current.getDate() + distanceToMonday);
        monday.setHours(0,0,0,0);
        
        const days = [];
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dateStr = formatDate(date);
            days.push({
                name: dayNames[i],
                dateStr,
                dateObj: date,
                isToday: formatDate(current) === dateStr
            });
        }
        return days;
    };

    const formatDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const toggleDay = (dateStr) => {
        setCompletedDays(prev => {
            if (prev.includes(dateStr)) {
                return prev.filter(d => d !== dateStr);
            } else {
                return [...prev, dateStr];
            }
        });
    };

    const checkInToday = () => {
        const todayStr = formatDate(new Date());
        if (!completedDays.includes(todayStr)) {
            setCompletedDays(prev => [...prev, todayStr]);
        }
    };

    const calculateAndSyncStreaks = () => {
        if (completedDays.length === 0) {
            localStorage.setItem('dashboard_longest_streak', '0');
            return;
        }

        // Sort completed days in ascending order
        const sortedDates = [...completedDays]
            .map(d => new Date(d))
            .sort((a, b) => a - b);

        let maxStreak = 0;
        let currentStreakCount = 0;
        let tempStreak = 0;
        
        // Calculate all streaks to find the longest one
        if (sortedDates.length > 0) {
            tempStreak = 1;
            maxStreak = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                const diffTime = sortedDates[i] - sortedDates[i - 1];
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                
                if (diffDays === 1) {
                    tempStreak++;
                } else if (diffDays > 1) {
                    if (tempStreak > maxStreak) {
                        maxStreak = tempStreak;
                    }
                    tempStreak = 1;
                }
            }
            if (tempStreak > maxStreak) {
                maxStreak = tempStreak;
            }
        }

        // Calculate current streak
        // Start from today, check if completed. If not, check yesterday. If neither, streak is 0.
        const today = new Date();
        today.setHours(0,0,0,0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const todayStr = formatDate(today);
        const yesterdayStr = formatDate(yesterday);

        const hasCompletedToday = completedDays.includes(todayStr);
        const hasCompletedYesterday = completedDays.includes(yesterdayStr);

        if (!hasCompletedToday && !hasCompletedYesterday) {
            currentStreakCount = 0;
        } else {
            let checkDate = hasCompletedToday ? today : yesterday;
            currentStreakCount = 0;
            
            while (true) {
                const checkDateStr = formatDate(checkDate);
                if (completedDays.includes(checkDateStr)) {
                    currentStreakCount++;
                    // Go to previous day
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Update state
        if (maxStreak > longestStreak) {
            setLongestStreak(maxStreak);
            localStorage.setItem('dashboard_longest_streak', String(maxStreak));
        } else if (currentStreakCount > longestStreak) {
            setLongestStreak(currentStreakCount);
            localStorage.setItem('dashboard_longest_streak', String(currentStreakCount));
        }
    };

    // Calculate current streak directly for presentation
    const getCurrentStreak = () => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const todayStr = formatDate(today);
        const yesterdayStr = formatDate(yesterday);

        const hasCompletedToday = completedDays.includes(todayStr);
        const hasCompletedYesterday = completedDays.includes(yesterdayStr);

        if (!hasCompletedToday && !hasCompletedYesterday) {
            return 0;
        }

        let checkDate = hasCompletedToday ? today : yesterday;
        let count = 0;
        
        // Loop back to count streak
        const safetyLimit = 1000; // prevent infinite loop
        let safetyCounter = 0;
        while (safetyCounter < safetyLimit) {
            safetyCounter++;
            const checkDateStr = formatDate(checkDate);
            if (completedDays.includes(checkDateStr)) {
                count++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return count;
    };

    const currentStreak = getCurrentStreak();
    const todayStr = formatDate(new Date());
    const isCompletedToday = completedDays.includes(todayStr);
    const weekDays = getWeekDays();

    const handleSaveHabit = (e) => {
        e.preventDefault();
        if (editHabitName.trim()) {
            setHabitName(editHabitName);
            setIsEditing(false);
        }
    };

    return (
        <div className="widget" id="streak-widget">
            <div className="widget-header">
                <div className="widget-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                    </svg>
                    <span>Habit Streak</span>
                </div>
                <div className="widget-actions">
                    <button 
                        className="btn-icon-only"
                        onClick={() => {
                            setEditHabitName(habitName);
                            setIsEditing(true);
                        }}
                        title="Edit Habit Name"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="streak-content">
                <div className="streak-center">
                    <div 
                        className={`streak-flame-container ${isCompletedToday ? 'active' : ''}`}
                        onClick={checkInToday}
                        title={isCompletedToday ? "Streak active! Checked in today." : "Click to check in for today!"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill={isCompletedToday ? '#34d399' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                        </svg>
                    </div>
                    <div className="streak-numbers">
                        <div className="streak-number-big">{currentStreak} Day{currentStreak !== 1 ? 's' : ''}</div>
                        <div className="streak-label-small">{habitName}</div>
                    </div>
                </div>

                <div className="week-grid">
                    {weekDays.map((day) => {
                        const isCompleted = completedDays.includes(day.dateStr);
                        return (
                            <div className="day-column" key={day.dateStr}>
                                <span className="day-label" style={day.isToday ? { color: 'var(--accent-purple)' } : {}}>
                                    {day.name}
                                </span>
                                <button
                                    onClick={() => toggleDay(day.dateStr)}
                                    className={`day-btn ${isCompleted ? 'completed' : ''}`}
                                    title={`${isCompleted ? 'Completed' : 'Not completed'} on ${day.dateStr}`}
                                >
                                    {day.dateStr.split('-')[2]}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {!isCompletedToday ? (
                    <button 
                        className="btn btn-primary" 
                        onClick={checkInToday}
                        style={{ width: '100%', marginTop: '8px' }}
                    >
                        ⚡ Check in for Today
                    </button>
                ) : (
                    <div className="notification-banner" style={{ width: '100%', marginTop: '8px' }}>
                        <span>🎉 Today's habit is complete! Keep it up!</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', marginTop: 'auto' }}>
                <span>🔥 Longest Streak: {longestStreak} days</span>
                <span>📅 Week of today</span>
            </div>

            {/* Editing Habit Name Modal */}
            {isEditing && (
                <div className="modal-overlay">
                    <form className="modal-content" onSubmit={handleSaveHabit}>
                        <div className="modal-header">
                            <h3>Edit Habit Tracker</h3>
                            <button 
                                type="button" 
                                className="btn-icon-only" 
                                onClick={() => setIsEditing(false)}
                                style={{ border: 'none', background: 'transparent' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="input-group">
                            <label htmlFor="habit-name-input">Habit Name</label>
                            <input 
                                id="habit-name-input"
                                type="text" 
                                className="form-input" 
                                value={editHabitName}
                                onChange={(e) => setEditHabitName(e.target.value)}
                                placeholder="Enter habit name (e.g. Daily Coding, Gym)..."
                                required
                                autoFocus
                            />
                        </div>

                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Streak;
