import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarData, setCalendarData] = useState(() => {
    const saved = localStorage.getItem('dashboard_calendar');
    if (saved) try { return JSON.parse(saved); } catch (e) {}
    return { ticked: [], events: [], specials: [] };
  });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventColor, setNewEventColor] = useState('accent');
  const [isSpecial, setIsSpecial] = useState(false);

  useEffect(() => {
    localStorage.setItem('dashboard_calendar', JSON.stringify(calendarData));
  }, [calendarData]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const prevMonthDays = new Date(year, month, 0).getDate();

  const dayKey = (y, m, d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  const cells = [];
  for (let i = startDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, key: dayKey(y, m, d), otherMonth: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: dayKey(year, month, d), otherMonth: false });
  }
  const remaining = Math.max(0, 35 - cells.length);
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: d, key: dayKey(y, m, d), otherMonth: true });
  }

  const toggleTick = (key) => {
    setCalendarData(prev => {
      const ticked = prev.ticked.includes(key)
        ? prev.ticked.filter(k => k !== key)
        : [...prev.ticked, key];
      return { ...prev, ticked };
    });
  };

  const handleDayClick = (cell) => {
    if (cell.otherMonth) return;
    if (selectedDate === cell.key) {
      toggleTick(cell.key);
    } else {
      setSelectedDate(cell.key);
    }
  };

  const addEvent = (e) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !selectedDate) return;
    const ev = { id: Date.now().toString(), title: newEventTitle.trim(), color: newEventColor, date: selectedDate };
    setCalendarData(prev => {
      const events = [...prev.events, ev];
      const specials = isSpecial && !prev.specials.includes(selectedDate)
        ? [...prev.specials, selectedDate] : prev.specials;
      return { ...prev, events, specials };
    });
    setNewEventTitle('');
    setNewEventColor('accent');
    setIsSpecial(false);
    setShowAddEvent(false);
  };

  const deleteEvent = (id) => {
    setCalendarData(prev => ({ ...prev, events: prev.events.filter(ev => ev.id !== id) }));
  };

  const toggleSpecial = (key) => {
    setCalendarData(prev => {
      const specials = prev.specials.includes(key)
        ? prev.specials.filter(k => k !== key)
        : [...prev.specials, key];
      return { ...prev, specials };
    });
  };

  const eventsForDate = selectedDate ? calendarData.events.filter(ev => ev.date === selectedDate) : [];

  const colorMap = { accent: 'var(--accent)', emerald: 'var(--emerald)', amber: 'var(--amber)', rose: 'var(--rose)', blue: 'var(--blue)' };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(todayStr); };

  return (
    <div className="widget" id="calendar-widget">
      <div className="widget-header">
        <div className="widget-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span>Calendar</span>
        </div>
        <div className="widget-actions">
          <button className="btn btn-secondary" onClick={goToday} style={{fontSize:'11px',padding:'4px 10px'}}>Today</button>
        </div>
      </div>

      <div className="calendar-content">
        <div className="cal-nav">
          <button className="btn-icon-only" onClick={prevMonth} title="Previous month" style={{width:28,height:28}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="cal-month-label">{monthName}</span>
          <button className="btn-icon-only" onClick={nextMonth} title="Next month" style={{width:28,height:28}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        <div className="cal-grid-header">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <span key={d}>{d}</span>)}
        </div>

        <div className="cal-grid">
          {cells.map((cell) => {
            const isTicked = calendarData.ticked.includes(cell.key);
            const isSpecialDay = calendarData.specials.includes(cell.key);
            const isToday = cell.key === todayStr;
            const isSelected = cell.key === selectedDate;
            const dayEvents = calendarData.events.filter(ev => ev.date === cell.key);

            let className = 'cal-day';
            if (cell.otherMonth) className += ' other-month';
            if (isToday) className += ' today';
            if (isTicked) className += ' ticked';
            if (isSpecialDay) className += ' special';

            return (
              <div
                key={cell.key}
                className={className}
                onClick={() => handleDayClick(cell)}
                style={isSelected ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 2px var(--accent-glow)' } : {}}
              >
                <span>{cell.day}</span>
                {dayEvents.length > 0 && (
                  <div className="cal-day-dots">
                    {dayEvents.slice(0, 3).map(ev => (
                      <span key={ev.id} className="cal-dot" style={{ background: colorMap[ev.color] || 'var(--accent)' }} />
                    ))}
                  </div>
                )}
                {isSpecialDay && !cell.otherMonth && <span style={{position:'absolute',top:1,right:3,fontSize:8}}>⭐</span>}
              </div>
            );
          })}
        </div>

        {selectedDate && (
          <div className="cal-events-panel">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
              <span style={{fontWeight:600,fontSize:13,color:'var(--text-primary)'}}>
                📅 {selectedDate}
                {calendarData.specials.includes(selectedDate) && ' ⭐'}
              </span>
              <div style={{display:'flex',gap:6}}>
                <button className="btn btn-secondary" onClick={() => toggleSpecial(selectedDate)} style={{fontSize:10,padding:'3px 8px'}}>
                  {calendarData.specials.includes(selectedDate) ? 'Unmark Special' : '⭐ Mark Special'}
                </button>
                <button className="btn btn-primary" onClick={() => setShowAddEvent(true)} style={{fontSize:10,padding:'3px 8px'}}>
                  + Event
                </button>
              </div>
            </div>

            {eventsForDate.length > 0 ? eventsForDate.map(ev => (
              <div key={ev.id} className="cal-event-item">
                <span className="cal-event-title">
                  <span className="cal-event-dot" style={{background: colorMap[ev.color] || 'var(--accent)'}} />
                  {ev.title}
                </span>
                <button onClick={() => deleteEvent(ev.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:12}}>✕</button>
              </div>
            )) : (
              <div style={{color:'var(--text-muted)',fontSize:11,textAlign:'center',padding:8}}>No events. Click "+ Event" to add one.</div>
            )}
          </div>
        )}
      </div>

      {showAddEvent && createPortal(
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={addEvent}>
            <div className="modal-header">
              <h3>Add Event — {selectedDate}</h3>
              <button type="button" className="btn-icon-only" onClick={() => setShowAddEvent(false)} style={{border:'none',background:'transparent'}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="input-group">
              <label>Event Title</label>
              <input className="form-input" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} placeholder="Birthday, Meeting, Deadline..." required autoFocus />
            </div>
            <div className="input-group">
              <label>Color Tag</label>
              <div style={{display:'flex',gap:8}}>
                {Object.keys(colorMap).map(c => (
                  <div key={c} onClick={() => setNewEventColor(c)} style={{width:24,height:24,borderRadius:'50%',background:colorMap[c],cursor:'pointer',border: newEventColor === c ? '2px solid var(--text-primary)' : '2px solid transparent',transition:'border 0.15s'}} />
                ))}
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <input type="checkbox" id="special-check" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)} />
              <label htmlFor="special-check" style={{fontSize:12,color:'var(--text-secondary)',cursor:'pointer'}}>⭐ Mark as special day</label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddEvent(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Event</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Calendar;
