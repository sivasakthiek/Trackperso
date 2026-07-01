import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

function ProfileSettings({ currentTheme, onThemeChange, bgImage, onBgChange, onUpdate }) {
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem('dashboard_profile');
        if (saved) try { return JSON.parse(saved); } catch (e) { }
        return { name: 'Sivam', role: 'Productivity Architect', avatar: '🚀' };
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(profile.name);
    const [editRole, setEditRole] = useState(profile.role);
    const [editAvatar, setEditAvatar] = useState(profile.avatar);
    const fileInputRef = useRef(null);

    const avatarsList = ['🚀', '💻', '🧠', '⚡', '🏆', '🔥', '🎨', '👤', '🎯', '📚', '🌟', '🦾'];

    const handleSaveProfile = (e) => {
        e.preventDefault();
        if (editName.trim()) {
            const updated = { name: editName.trim(), role: editRole.trim() || 'User', avatar: editAvatar };
            setProfile(updated);
            localStorage.setItem('dashboard_profile', JSON.stringify(updated));
            setIsEditing(false);
            if (onUpdate) onUpdate();
        }
    };

    const handleThemeToggle = () => {
        onThemeChange(currentTheme === 'dark' ? 'light' : 'dark');
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert('Image too large. Please use an image under 5MB.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target.result;
            try {
                localStorage.setItem('dashboard_bg_image', base64);
            } catch (err) {
                alert('Image is too large for storage. Try a smaller image.');
                return;
            }
            onBgChange(base64);
        };
        reader.onerror = () => {
            alert('Failed to read image. Please try another file.');
        };
        reader.readAsDataURL(file);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const removeBg = () => {
        localStorage.removeItem('dashboard_bg_image');
        onBgChange(null);
    };

    return (
        <div className="widget" id="profile-settings-widget">
            <div className="widget-header">
                <div className="widget-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Profile & Settings</span>
                </div>
                <div className="widget-actions">
                    <button className="btn-icon-only" onClick={() => { setEditName(profile.name); setEditRole(profile.role); setEditAvatar(profile.avatar); setIsEditing(true); }} title="Edit Profile">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    </button>
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-summary">
                    <div className="profile-avatar-display">{profile.avatar}</div>
                    <div className="profile-details">
                        <span className="profile-name">{profile.name}</span>
                        <span className="profile-role">{profile.role}</span>
                    </div>
                </div>

                {/* Dark / Light Toggle */}
                <div className="theme-toggle-section">
                    <label>Appearance</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 14 }}>🌙</span>
                        <div className={`theme-toggle-track ${currentTheme === 'light' ? 'is-light' : ''}`} onClick={handleThemeToggle}>
                            <div className="theme-toggle-knob">
                                {currentTheme === 'dark' ? '🌙' : '☀️'}
                            </div>
                        </div>
                        <span style={{ fontSize: 14 }}>☀️</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{currentTheme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                    </div>
                </div>

            </div>

            {isEditing && createPortal(
                <div className="modal-overlay">
                    <form className="modal-content" onSubmit={handleSaveProfile}>
                        <div className="modal-header">
                            <h3>Edit Profile</h3>
                            <button type="button" className="btn-icon-only" onClick={() => setIsEditing(false)} style={{ border: 'none', background: 'transparent' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="input-group">
                            <label>Display Name</label>
                            <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your Name" required autoFocus />
                        </div>
                        <div className="input-group">
                            <label>Title / Role</label>
                            <input className="form-input" value={editRole} onChange={e => setEditRole(e.target.value)} placeholder="AI Architect, Student..." />
                        </div>
                        <div className="input-group">
                            <label>Choose Avatar</label>
                            <div className="avatar-grid">
                                {avatarsList.map(av => (
                                    <div key={av} className={`avatar-option ${editAvatar === av ? 'selected' : ''}`} onClick={() => setEditAvatar(av)}>{av}</div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>,
                document.body
            )}
        </div>
    );
}

export default ProfileSettings;
