import React, { useState, useEffect } from 'react';

function Notes() {
    const [notes, setNotes] = useState(() => {
        const saved = localStorage.getItem('dashboard_notes');
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
                title: 'Project Ideas',
                content: 'Build a high-performance personal tracker dashboard using Vite + React.',
                color: 'purple',
                date: 'Jun 25'
            },
            {
                id: '2',
                title: 'Reminders for next week',
                content: 'Refactor state persistence and check CSS mobile layouts on portrait modes.',
                color: 'blue',
                date: 'Jun 24'
            }
        ];
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newColor, setNewColor] = useState('purple');

    useEffect(() => {
        localStorage.setItem('dashboard_notes', JSON.stringify(notes));
    }, [notes]);

    const handleAddNote = (e) => {
        e.preventDefault();
        if (newTitle.trim() || newContent.trim()) {
            const today = new Date();
            const dateStr = today.toLocaleString('default', { month: 'short' }) + ' ' + today.getDate();
            
            const newNote = {
                id: Date.now().toString(),
                title: newTitle.trim() || 'Untitled Note',
                content: newContent.trim() || 'No description.',
                color: newColor,
                date: dateStr
            };
            
            setNotes(prev => [newNote, ...prev]);
            setIsAdding(false);
            setNewTitle('');
            setNewContent('');
            setNewColor('purple');
        }
    };

    const handleDeleteNote = (id) => {
        setNotes(prev => prev.filter(note => note.id !== id));
    };

    const filteredNotes = notes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const colorsList = [
        { value: 'purple', label: 'Violet' },
        { value: 'blue', label: 'Blue' },
        { value: 'emerald', label: 'Green' },
        { value: 'amber', label: 'Yellow' },
        { value: 'rose', label: 'Red' }
    ];

    return (
        <div className="widget" id="notes-widget">
            <div className="widget-header">
                <div className="widget-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    </svg>
                    <span>Quick Notes</span>
                </div>
                <div className="widget-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setIsAdding(true)}
                        title="Add Note"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                            <path d="M5 12h14M12 5v14"/>
                        </svg>
                        Add
                    </button>
                </div>
            </div>

            <div className="notes-container">
                <div className="notes-search-bar">
                    <input 
                        type="text" 
                        className="form-input" 
                        placeholder="🔍 Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ height: '34px' }}
                    />
                </div>

                {filteredNotes.length > 0 ? (
                    <div className="notes-grid">
                        {filteredNotes.map((note) => (
                            <div className={`note-card ${note.color}`} key={note.id}>
                                <div className="note-header">
                                    <span className="note-title">{note.title}</span>
                                    <button 
                                        onClick={() => handleDeleteNote(note.id)}
                                        className="note-delete-btn"
                                        title="Delete Note"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                        </svg>
                                    </button>
                                </div>
                                <p className="note-body">{note.content}</p>
                                <div className="note-footer">
                                    <span className="current-date">{note.date}</span>
                                    <span className={`note-tag ${note.color}`}>{note.color}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span>No notes found. Create a new one!</span>
                    </div>
                )}
            </div>

            {/* Create Note Modal Overlay */}
            {isAdding && (
                <div className="modal-overlay">
                    <form className="modal-content" onSubmit={handleAddNote}>
                        <div className="modal-header">
                            <h3>Create Quick Note</h3>
                            <button 
                                type="button" 
                                className="btn-icon-only" 
                                onClick={() => setIsAdding(false)}
                                style={{ border: 'none', background: 'transparent' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="input-group">
                            <label htmlFor="note-title-input">Note Title</label>
                            <input 
                                id="note-title-input"
                                type="text" 
                                className="form-input" 
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                placeholder="Meeting notes, idea name..."
                                required
                                autoFocus
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="note-desc-input">Note Content</label>
                            <textarea 
                                id="note-desc-input"
                                className="form-input" 
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                placeholder="Type your note details here..."
                                rows="3"
                                style={{ resize: 'none', minHeight: '80px' }}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="note-color-input">Category Theme Color</label>
                            <select
                                id="note-color-input"
                                className="form-select"
                                value={newColor}
                                onChange={(e) => setNewColor(e.target.value)}
                            >
                                {colorsList.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="modal-footer">
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
                                Add Note
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default Notes;
