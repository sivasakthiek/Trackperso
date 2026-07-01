import React, { useState, useEffect, useRef, useCallback } from 'react';

function ClockTimer() {
  const [activeTab, setActiveTab] = useState('clock');
  const [time, setTime] = useState(new Date());

  // Alarm state
  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem('dashboard_alarms');
    if (saved) try { return JSON.parse(saved); } catch (e) {}
    return [];
  });
  const [newAlarmTime, setNewAlarmTime] = useState('');
  const [newAlarmLabel, setNewAlarmLabel] = useState('');
  const alarmCheckRef = useRef(new Set());

  // Timer state
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [timerRemaining, setTimerRemaining] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPreset, setTimerPreset] = useState(25);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Save alarms
  useEffect(() => {
    localStorage.setItem('dashboard_alarms', JSON.stringify(alarms));
  }, [alarms]);

  // Check alarms every second
  useEffect(() => {
    const now = time;
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const nowKey = `${hh}:${mm}`;

    alarms.forEach(alarm => {
      if (alarm.time === nowKey && alarm.enabled && !alarmCheckRef.current.has(alarm.id)) {
        alarmCheckRef.current.add(alarm.id);
        triggerAlarm(alarm);
        // Reset after 61 seconds to allow re-trigger next day
        setTimeout(() => alarmCheckRef.current.delete(alarm.id), 61000);
      }
    });
  }, [time, alarms]);

  const triggerAlarm = useCallback((alarm) => {
    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⏰ Alarm!', { body: alarm.label || `Alarm at ${alarm.time}`, icon: '/icon-192.svg' });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        if (p === 'granted') new Notification('⏰ Alarm!', { body: alarm.label || `Alarm at ${alarm.time}` });
      });
    }
    // Audio beep
    playBeep();
    alert(`⏰ Alarm: ${alarm.label || alarm.time}`);
  }, []);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        osc2.connect(gain);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 600);
    } catch (e) {}
  };

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            playBeep();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⏱ Timer Complete!', { body: 'Your countdown has finished.', icon: '/icon-192.svg' });
            }
            alert('⏱ Timer Complete!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const addAlarm = (e) => {
    e.preventDefault();
    if (!newAlarmTime) return;
    setAlarms(prev => [...prev, { id: Date.now().toString(), time: newAlarmTime, label: newAlarmLabel || '', enabled: true }]);
    setNewAlarmTime('');
    setNewAlarmLabel('');
  };

  const deleteAlarm = (id) => setAlarms(prev => prev.filter(a => a.id !== id));
  const toggleAlarm = (id) => setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));

  const setPreset = (minutes) => {
    setTimerPreset(minutes);
    setTimerDuration(minutes * 60);
    setTimerRemaining(minutes * 60);
    setTimerRunning(false);
  };

  const startTimer = () => setTimerRunning(true);
  const pauseTimer = () => setTimerRunning(false);
  const resetTimer = () => { setTimerRunning(false); setTimerRemaining(timerDuration); };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const clockH = time.getHours();
  const clockM = time.getMinutes();
  const clockS = time.getSeconds();
  const displayTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const period = clockH >= 12 ? 'PM' : 'AM';

  // Timer ring
  const circumference = 2 * Math.PI * 52;
  const progress = timerDuration > 0 ? (timerRemaining / timerDuration) : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="widget" id="clock-widget">
      <div className="widget-header">
        <div className="widget-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Clock & Timer</span>
        </div>
      </div>

      <div className="clock-content">
        <div className="clock-tabs">
          {['clock', 'alarm', 'timer'].map(tab => (
            <button key={tab} className={`clock-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab === 'clock' ? '🕐 Clock' : tab === 'alarm' ? '⏰ Alarm' : '⏱ Timer'}
            </button>
          ))}
        </div>

        {activeTab === 'clock' && (
          <div className="clock-display">
            <div className="clock-big-time">{displayTime.replace(/ (AM|PM)/, '')}</div>
            <div className="clock-period">{period} — {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
        )}

        {activeTab === 'alarm' && (
          <div style={{display:'flex',flexDirection:'column',gap:10,flexGrow:1}}>
            <form className="alarm-add-form" onSubmit={addAlarm}>
              <div className="input-group" style={{flex:1}}>
                <input type="time" className="form-input" value={newAlarmTime} onChange={e => setNewAlarmTime(e.target.value)} required style={{padding:'8px 10px'}} />
              </div>
              <div className="input-group" style={{flex:1}}>
                <input type="text" className="form-input" value={newAlarmLabel} onChange={e => setNewAlarmLabel(e.target.value)} placeholder="Label..." style={{padding:'8px 10px'}} />
              </div>
              <button type="submit" className="btn btn-primary" style={{padding:'8px 12px',alignSelf:'flex-end'}}>Set</button>
            </form>

            {alarms.length > 0 ? (
              <div className="alarm-list">
                {alarms.map(alarm => (
                  <div key={alarm.id} className="alarm-item" style={{opacity: alarm.enabled ? 1 : 0.4}}>
                    <div>
                      <div className="alarm-time">{alarm.time}</div>
                      {alarm.label && <div className="alarm-label">{alarm.label}</div>}
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn-icon-only" onClick={() => toggleAlarm(alarm.id)} title={alarm.enabled ? 'Disable' : 'Enable'} style={{width:26,height:26,fontSize:12}}>
                        {alarm.enabled ? '🔔' : '🔕'}
                      </button>
                      <button className="btn-icon-only" onClick={() => deleteAlarm(alarm.id)} title="Delete" style={{width:26,height:26,fontSize:12}}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{flex:1}}>
                <span>No alarms set yet.</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timer' && (
          <div style={{display:'flex',flexDirection:'column',gap:12,alignItems:'center',flexGrow:1,justifyContent:'center'}}>
            <div className="timer-ring-container">
              <svg className="timer-ring-bg" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" />
              </svg>
              <svg className="timer-ring-progress" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
              </svg>
              <span className="timer-center-text">{formatTimer(timerRemaining)}</span>
            </div>

            <div className="timer-presets">
              {[1, 5, 10, 15, 25, 30, 45, 60].map(m => (
                <button key={m} className={`timer-preset-btn ${timerPreset === m ? 'active' : ''}`} onClick={() => setPreset(m)}>
                  {m}m
                </button>
              ))}
            </div>

            <div className="timer-controls">
              {!timerRunning ? (
                <button className="btn btn-primary" onClick={startTimer} disabled={timerRemaining === 0}>▶ Start</button>
              ) : (
                <button className="btn btn-secondary" onClick={pauseTimer}>⏸ Pause</button>
              )}
              <button className="btn btn-secondary" onClick={resetTimer}>↺ Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClockTimer;
