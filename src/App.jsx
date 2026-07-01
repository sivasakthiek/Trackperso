import React, { useState, useEffect, useCallback } from 'react';
import Goal from "./comp/Goal";
import Streak from "./comp/Streak";
import Notes from "./comp/Notes";
import Reminders from "./comp/Reminders";
import ProfileSettings from "./comp/ProfileSettings";
import Calendar from "./comp/Calendar";
import ClockTimer from "./comp/ClockTimer";

function App() {
  const [time, setTime] = useState(new Date());
  const [statsTrigger, setStatsTrigger] = useState(0);

  // Theme: dark or light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dashboard_theme') || 'dark';
  });

  // Background image
  const [bgImage, setBgImage] = useState(() => {
    return localStorage.getItem('dashboard_bg_image') || null;
  });

  // Profile
  const [profile, setProfile] = useState({ name: 'Sivam', avatar: '🚀' });

  const [stats, setStats] = useState({
    goalProgress: 45,
    streak: 0,
    remindersCount: 0
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('dashboard_theme', theme);
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const triggerStatsUpdate = useCallback(() => setStatsTrigger(prev => prev + 1), []);

  const formatDateKey = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Sync stats + profile
  useEffect(() => {
    const savedProfile = localStorage.getItem('dashboard_profile');
    if (savedProfile) {
      try {
        const p = JSON.parse(savedProfile);
        setProfile({ name: p.name || 'Sivam', avatar: p.avatar || '🚀' });
      } catch (e) {}
    }

    const savedGoal = localStorage.getItem('dashboard_goal');
    let gProgress = 0;
    if (savedGoal) {
      try {
        const parsed = JSON.parse(savedGoal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // New format: array of goals with tasks
          const totalProgress = parsed.reduce((sum, goal) => {
            if (!goal.tasks || goal.tasks.length === 0) return sum;
            const completed = goal.tasks.filter(t => t.completed).length;
            return sum + Math.round((completed / goal.tasks.length) * 100);
          }, 0);
          const goalsWithTasks = parsed.filter(g => g.tasks && g.tasks.length > 0).length;
          gProgress = goalsWithTasks > 0 ? Math.round(totalProgress / goalsWithTasks) : 0;
        } else if (parsed && parsed.progress !== undefined) {
          // Legacy single-goal format
          gProgress = parsed.progress;
        }
      } catch (e) {}
    }

    const savedStreak = localStorage.getItem('dashboard_streak_completed');
    let streakCount = 0;
    if (savedStreak) {
      try {
        const completed = JSON.parse(savedStreak);
        const today = new Date(); today.setHours(0,0,0,0);
        const todayStr = formatDateKey(today);
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = formatDateKey(yesterday);
        if (completed.includes(todayStr) || completed.includes(yesterdayStr)) {
          let checkDate = completed.includes(todayStr) ? new Date(today) : new Date(yesterday);
          let limit = 0;
          while (limit < 1000) {
            limit++;
            if (completed.includes(formatDateKey(checkDate))) { streakCount++; checkDate.setDate(checkDate.getDate() - 1); }
            else break;
          }
        }
      } catch (e) {}
    }

    const savedReminders = localStorage.getItem('dashboard_reminders');
    let pendingCount = 0;
    if (savedReminders) try { pendingCount = JSON.parse(savedReminders).filter(r => !r.completed).length; } catch (e) {}

    setStats({ goalProgress: gProgress, streak: streakCount, remindersCount: pendingCount });
  }, [statsTrigger]);

  const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getGreeting = () => {
    const hrs = time.getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className={`theme-${theme}`} style={{minHeight:'100vh', display:'flex', flexDirection:'column'}}>
      {/* Background Layer */}
      <div
        className={`app-bg-layer ${bgImage ? 'has-image' : ''}`}
        style={bgImage ? { backgroundImage: `url(${bgImage})` } : {}}
      />

      <div className="app-wrapper">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>{getGreeting()}, {profile.avatar} {profile.name}!</h1>
            <p>Let's stay productive and crush our targets today.</p>
          </div>
          <div className="header-right">
            <div className="current-time">{formattedTime}</div>
            <div className="current-date">{formattedDate}</div>
          </div>
        </header>

        {/* Stats */}
        <section className="stats-strip">
          <div className="stat-card">
            <div className="stat-icon" style={{background:'var(--accent-glow)', color:'var(--accent)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Goal</span>
              <span className="stat-value">{stats.goalProgress}%</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:'var(--emerald-glow)', color:'var(--emerald)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{stats.streak} Day{stats.streak !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background:'var(--amber-glow)', color:'var(--amber)'}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9m7.73 13a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <div className="stat-info">
              <span className="stat-label">Tasks</span>
              <span className="stat-value">{stats.remindersCount} Left</span>
            </div>
          </div>
        </section>

        {/* Bento Grid */}
        <main className="dashboard-grid">
          <div className="bento-profile">
            <ProfileSettings currentTheme={theme} onThemeChange={setTheme} bgImage={bgImage} onBgChange={setBgImage} onUpdate={triggerStatsUpdate} />
          </div>
          <div className="bento-clock">
            <ClockTimer />
          </div>
          <div className="bento-goal">
            <Goal onUpdate={triggerStatsUpdate} />
          </div>
          <div className="bento-calendar">
            <Calendar />
          </div>
          <div className="bento-streak">
            <Streak onUpdate={triggerStatsUpdate} />
          </div>
          <div className="bento-notes">
            <Notes onUpdate={triggerStatsUpdate} />
          </div>
          <div className="bento-reminders">
            <Reminders onUpdate={triggerStatsUpdate} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
