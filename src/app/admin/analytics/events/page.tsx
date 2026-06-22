"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Calendar, Tag, Trash2, Archive, Edit2, Check, X, RefreshCw } from 'lucide-react';

interface Event {
    id: string;
    name: string;
    description: string | null;
    start_date: string;
    end_date: string | null;
    category: 'Feature Release' | 'Marketing Campaign' | 'Pricing Change' | 'Product Update' | 'Other';
    is_archived: boolean;
}

interface Preset {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
}

export default function EventsAndPresetsManagementPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'events' | 'presets'>('events');
    
    // Events state
    const [events, setEvents] = useState<Event[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    
    // Form fields for Events
    const [eventName, setEventName] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [eventCategory, setEventCategory] = useState<Event['category']>('Feature Release');
    const [eventStartDate, setEventStartDate] = useState('');
    const [eventEndDate, setEventEndDate] = useState('');
    const [eventError, setEventError] = useState('');
    
    // Presets state
    const [presets, setPresets] = useState<Preset[]>([]);
    const [loadingPresets, setLoadingPresets] = useState(true);
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    
    // Form fields for Presets (inline edit)
    const [editPresetName, setEditPresetName] = useState('');
    const [editPresetStart, setEditPresetStart] = useState('');
    const [editPresetEnd, setEditPresetEnd] = useState('');
    const [presetError, setPresetError] = useState('');

    useEffect(() => {
        fetchEvents();
        fetchPresets();
    }, []);

    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const res = await fetch('/api/admin/analytics/events?includeArchived=true');
            if (res.ok) {
                const json = await res.json();
                setEvents(json.events || []);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoadingEvents(false);
        }
    };

    const fetchPresets = async () => {
        setLoadingPresets(true);
        try {
            const res = await fetch('/api/admin/analytics/presets');
            if (res.ok) {
                const json = await res.json();
                setPresets(json.presets || []);
            }
        } catch (err) {
            console.error('Error fetching presets:', err);
        } finally {
            setLoadingPresets(false);
        }
    };

    // Events Operations
    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setEventError('');
        if (!eventName || !eventStartDate || !eventCategory) {
            setEventError('Name, start date, and category are required.');
            return;
        }

        try {
            const res = await fetch('/api/admin/analytics/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: eventName,
                    description: eventDescription,
                    startDate: eventStartDate,
                    endDate: eventEndDate || null,
                    category: eventCategory
                })
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setEvents(prev => [json.event, ...prev]);
                    setIsCreatingEvent(false);
                    // Reset form
                    setEventName('');
                    setEventDescription('');
                    setEventCategory('Feature Release');
                    setEventStartDate('');
                    setEventEndDate('');
                } else {
                    setEventError(json.error || 'Failed to create event');
                }
            } else {
                const json = await res.json();
                setEventError(json.error || 'Failed to create event');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            setEventError('Error creating event.');
        }
    };

    const handleToggleArchiveEvent = async (event: Event) => {
        try {
            const res = await fetch(`/api/admin/analytics/events?id=${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isArchived: !event.is_archived
                })
            });

            if (res.ok) {
                setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_archived: !e.is_archived } : e));
            }
        } catch (err) {
            console.error('Error toggling event archive status:', err);
        }
    };

    const handleDeleteEvent = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this event? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/admin/analytics/events?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setEvents(prev => prev.filter(e => e.id !== id));
            }
        } catch (err) {
            console.error('Error deleting event:', err);
        }
    };

    const startEditingEvent = (event: Event) => {
        setEditingEventId(event.id);
        setEventName(event.name);
        setEventDescription(event.description || '');
        setEventCategory(event.category);
        setEventStartDate(event.start_date);
        setEventEndDate(event.end_date || '');
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setEventError('');
        if (!editingEventId || !eventName || !eventStartDate || !eventCategory) {
            setEventError('Name, start date, and category are required.');
            return;
        }

        try {
            const res = await fetch(`/api/admin/analytics/events?id=${editingEventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: eventName,
                    description: eventDescription,
                    startDate: eventStartDate,
                    endDate: eventEndDate || null,
                    category: eventCategory
                })
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setEvents(prev => prev.map(e => e.id === editingEventId ? json.event : e));
                    setEditingEventId(null);
                    // Reset form
                    setEventName('');
                    setEventDescription('');
                    setEventCategory('Feature Release');
                    setEventStartDate('');
                    setEventEndDate('');
                } else {
                    setEventError(json.error || 'Failed to update event');
                }
            } else {
                const json = await res.json();
                setEventError(json.error || 'Failed to update event');
            }
        } catch (err) {
            console.error('Error updating event:', err);
            setEventError('Error updating event.');
        }
    };

    // Presets Operations
    const startEditingPreset = (preset: Preset) => {
        setEditingPresetId(preset.id);
        setEditPresetName(preset.name);
        setEditPresetStart(preset.start_date);
        setEditPresetEnd(preset.end_date);
    };

    const handleUpdatePreset = async (id: string) => {
        setPresetError('');
        if (!editPresetName || !editPresetStart || !editPresetEnd) {
            setPresetError('All preset fields are required.');
            return;
        }

        try {
            const res = await fetch(`/api/admin/analytics/presets?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editPresetName,
                    startDate: editPresetStart,
                    endDate: editPresetEnd
                })
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success) {
                    setPresets(prev => prev.map(p => p.id === id ? json.preset : p));
                    setEditingPresetId(null);
                } else {
                    setPresetError(json.error || 'Failed to update preset');
                }
            } else {
                const json = await res.json();
                setPresetError(json.error || 'Failed to update preset');
            }
        } catch (err) {
            console.error('Error updating preset:', err);
            setPresetError('Error updating preset.');
        }
    };

    const handleDeletePreset = async (id: string) => {
        if (!confirm('Are you sure you want to permanently delete this preset?')) return;
        try {
            const res = await fetch(`/api/admin/analytics/presets?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setPresets(prev => prev.filter(p => p.id !== id));
            }
        } catch (err) {
            console.error('Error deleting preset:', err);
        }
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Feature Release':
                return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' };
            case 'Marketing Campaign':
                return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' };
            case 'Pricing Change':
                return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' };
            case 'Product Update':
                return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' };
            default:
                return { bg: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' };
        }
    };

    const formatDateDisplay = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Back Button */}
            <button
                onClick={() => router.push('/admin/analytics')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                    padding: 0
                }}
            >
                <ArrowLeft size={16} />
                Back to Analytics Hub
            </button>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Event & Preset Manager</h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
                        Register key business milestones and audit custom date ranges.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('events')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'events' ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                        fontWeight: activeTab === 'events' ? 'bold' : 'normal',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderBottom: activeTab === 'events' ? '2px solid var(--primary)' : 'none',
                        marginBottom: '-0.6rem'
                    }}
                >
                    Milestones & Events
                </button>
                <button
                    onClick={() => setActiveTab('presets')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: activeTab === 'presets' ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                        fontWeight: activeTab === 'presets' ? 'bold' : 'normal',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        padding: '0.5rem 1rem',
                        borderBottom: activeTab === 'presets' ? '2px solid var(--primary)' : 'none',
                        marginBottom: '-0.6rem'
                    }}
                >
                    Custom Date Presets
                </button>
            </div>

            {/* Tab: Events */}
            {activeTab === 'events' && (
                <div>
                    {/* Add Event Panel */}
                    {!isCreatingEvent && !editingEventId ? (
                        <button
                            onClick={() => setIsCreatingEvent(true)}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                padding: '0.6rem 1.2rem'
                            }}
                        >
                            <Plus size={16} />
                            Log New Event
                        </button>
                    ) : (
                        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', fontWeight: 600 }}>
                                {editingEventId ? 'Edit Business Event' : 'Log New Event'}
                            </h3>
                            <form onSubmit={editingEventId ? handleUpdateEvent : handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 2, minWidth: '250px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.35rem' }}>Event Name *</label>
                                        <input
                                            type="text"
                                            value={eventName}
                                            onChange={(e) => setEventName(e.target.value)}
                                            placeholder="e.g. AI Scoring Feature Launch"
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                color: 'white',
                                                padding: '0.5rem',
                                                width: '100%',
                                                fontSize: '0.9rem'
                                            }}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '180px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.35rem' }}>Category *</label>
                                        <select
                                            value={eventCategory}
                                            onChange={(e) => setEventCategory(e.target.value as Event['category'])}
                                            style={{
                                                background: 'rgb(31, 41, 55)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                color: 'white',
                                                padding: '0.5rem',
                                                width: '100%',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            <option value="Feature Release">Feature Release</option>
                                            <option value="Marketing Campaign">Marketing Campaign</option>
                                            <option value="Pricing Change">Pricing Change</option>
                                            <option value="Product Update">Product Update</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.35rem' }}>Description</label>
                                    <textarea
                                        value={eventDescription}
                                        onChange={(e) => setEventDescription(e.target.value)}
                                        placeholder="Add key parameters, campaign budget, or launch context..."
                                        rows={3}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            padding: '0.5rem',
                                            width: '100%',
                                            fontSize: '0.9rem',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.35rem' }}>Start Date *</label>
                                        <input
                                            type="date"
                                            value={eventStartDate}
                                            onChange={(e) => setEventStartDate(e.target.value)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                color: 'white',
                                                padding: '0.5rem',
                                                width: '100%',
                                                fontSize: '0.9rem'
                                            }}
                                            required
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.35rem' }}>End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={eventEndDate}
                                            onChange={(e) => setEventEndDate(e.target.value)}
                                            style={{
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '6px',
                                                color: 'white',
                                                padding: '0.5rem',
                                                width: '100%',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </div>
                                </div>

                                {eventError && (
                                    <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{eventError}</div>
                                )}

                                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreatingEvent(false);
                                            setEditingEventId(null);
                                            setEventName('');
                                            setEventDescription('');
                                            setEventCategory('Feature Release');
                                            setEventStartDate('');
                                            setEventEndDate('');
                                        }}
                                        className="btn-secondary"
                                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                    >
                                        {editingEventId ? 'Save Changes' : 'Publish Event'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Events List */}
                    {loadingEvents ? (
                        <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
                            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem' }} />
                            Loading business events...
                        </div>
                    ) : events.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                            No business events logged yet. Register events to correlate them with business performance.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {events.map(event => {
                                const style = getCategoryStyles(event.category);
                                return (
                                    <div
                                        key={event.id}
                                        className="glass-panel"
                                        style={{
                                            padding: '1.25rem',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: event.is_archived ? 0.5 : 1,
                                            transition: 'opacity 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{event.name}</h3>
                                                <span
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        padding: '2px 8px',
                                                        borderRadius: '100px',
                                                        backgroundColor: style.bg,
                                                        color: style.color,
                                                        border: style.border
                                                    }}
                                                >
                                                    {event.category}
                                                </span>
                                                {event.is_archived && (
                                                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', opacity: 0.8 }}>
                                                        Archived
                                                    </span>
                                                )}
                                            </div>
                                            {event.description && (
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                                                    {event.description}
                                                </p>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>
                                                <Calendar size={12} />
                                                <span>
                                                    {formatDateDisplay(event.start_date)}
                                                    {event.end_date ? ` to ${formatDateDisplay(event.end_date)}` : ' (Ongoing)'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button
                                                onClick={() => startEditingEvent(event)}
                                                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.4rem', opacity: 0.7 }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                                title="Edit Event"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleArchiveEvent(event)}
                                                style={{ background: 'none', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: '0.4rem', opacity: 0.7 }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                                title={event.is_archived ? 'Activate Event' : 'Archive Event'}
                                            >
                                                <Archive size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', opacity: 0.7 }}
                                                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                                title="Delete Event"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Tab: Presets */}
            {activeTab === 'presets' && (
                <div>
                    {loadingPresets ? (
                        <div style={{ padding: '3rem', textAlign: 'center', opacity: 0.6 }}>
                            <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem' }} />
                            Loading custom presets...
                        </div>
                    ) : presets.length === 0 ? (
                        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                            No custom date range presets saved yet. Create presets directly inside any Analytics page using the date picker selector dropdown.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {presetError && (
                                <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{presetError}</div>
                            )}
                            
                            {presets.map(preset => {
                                const isEditing = editingPresetId === preset.id;
                                return (
                                    <div
                                        key={preset.id}
                                        className="glass-panel"
                                        style={{
                                            padding: '1.25rem',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1rem'
                                        }}
                                    >
                                        {isEditing ? (
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    value={editPresetName}
                                                    onChange={(e) => setEditPresetName(e.target.value)}
                                                    placeholder="Preset Name"
                                                    style={{
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '6px',
                                                        color: 'white',
                                                        padding: '0.4rem',
                                                        fontSize: '0.85rem',
                                                        minWidth: '150px'
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                                    <input
                                                        type="date"
                                                        value={editPresetStart}
                                                        onChange={(e) => setEditPresetStart(e.target.value)}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '6px',
                                                            color: 'white',
                                                            padding: '0.4rem',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    />
                                                    <span style={{ opacity: 0.5 }}>to</span>
                                                    <input
                                                        type="date"
                                                        value={editPresetEnd}
                                                        onChange={(e) => setEditPresetEnd(e.target.value)}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.05)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                            borderRadius: '6px',
                                                            color: 'white',
                                                            padding: '0.4rem',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{preset.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                                    <Calendar size={12} />
                                                    <span>{formatDateDisplay(preset.start_date)} to {formatDateDisplay(preset.end_date)}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdatePreset(preset.id)}
                                                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.4rem' }}
                                                        title="Save Changes"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingPresetId(null)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                                                        title="Cancel Editing"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEditingPreset(preset)}
                                                        style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.4rem', opacity: 0.7 }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                                        title="Edit Preset"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePreset(preset.id)}
                                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', opacity: 0.7 }}
                                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                                        title="Delete Preset"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
