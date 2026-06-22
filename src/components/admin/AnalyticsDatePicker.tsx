"use client";

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
    label: string;
}

interface AnalyticsDatePickerProps {
    onDateChange: (range: { startDate: Date; endDate: Date; label: string }) => void;
    currentLabel: string;
}

export default function AnalyticsDatePicker({ onDateChange, currentLabel }: AnalyticsDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState(currentLabel || 'Last 30 Days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [presets, setPresets] = useState<any[]>([]);
    const [newPresetName, setNewPresetName] = useState('');
    const [presetError, setPresetError] = useState('');

    useEffect(() => {
        async function fetchPresets() {
            try {
                const res = await fetch('/api/admin/analytics/presets');
                if (res.ok) {
                    const json = await res.json();
                    setPresets(json.presets || []);
                }
            } catch (err) {
                console.error('Error loading presets:', err);
            }
        }
        fetchPresets();
    }, []);

    const handlePresetClick = (preset: any) => {
        const [startY, startM, startD] = preset.start_date.split('-').map(Number);
        const [endY, endM, endD] = preset.end_date.split('-').map(Number);
        
        const start = new Date(startY, startM - 1, startD);
        const end = new Date(endY, endM - 1, endD);

        setCustomStart(preset.start_date);
        setCustomEnd(preset.end_date);

        setSelectedLabel(preset.name);
        onDateChange({ startDate: start, endDate: end, label: preset.name });
        setIsOpen(false);
    };

    const handleSavePreset = async () => {
        if (!newPresetName || !customStart || !customEnd) return;
        setPresetError('');
        try {
            const res = await fetch('/api/admin/analytics/presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPresetName,
                    startDate: customStart,
                    endDate: customEnd
                })
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.preset) {
                    setPresets(prev => [...prev, json.preset].sort((a, b) => a.name.localeCompare(b.name)));
                    setNewPresetName('');
                    handlePresetClick(json.preset);
                } else {
                    setPresetError(json.error || 'Failed to save preset');
                }
            } else {
                const json = await res.json();
                setPresetError(json.error || 'Failed to save preset');
            }
        } catch (err) {
            console.error('Error saving preset:', err);
            setPresetError('Error saving preset');
        }
    };

    const handleDeletePreset = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this preset?')) return;
        setPresetError('');
        try {
            const res = await fetch(`/api/admin/analytics/presets?id=${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setPresets(prev => prev.filter(p => p.id !== id));
            } else {
                setPresetError('Failed to delete preset');
            }
        } catch (err) {
            console.error('Error deleting preset:', err);
            setPresetError('Error deleting preset');
        }
    };

    useEffect(() => {
        if (currentLabel) {
            setSelectedLabel(currentLabel);
        }
    }, [currentLabel]);

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSingleDaySelect = (offset: number, label: string) => {
        const date = new Date();
        date.setDate(date.getDate() - offset);

        // Start and End are the same day
        const start = new Date(date);
        const end = new Date(date);

        setSelectedLabel(label);
        onDateChange({ startDate: start, endDate: end, label });
        setIsOpen(false);
    };

    const handlePresetSelect = (days: number, label: string) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        setSelectedLabel(label);
        onDateChange({ startDate: start, endDate: end, label });
        setIsOpen(false);
    };

    const handleCustomApply = () => {
        if (customStart && customEnd) {
            console.log('Custom Range Input:', { customStart, customEnd });

            // Helper to parse "YYYY-MM-DD" as local date (00:00:00)
            const parseDateLocal = (dateStr: string) => {
                const [year, month, day] = dateStr.split('-').map(Number);
                return new Date(year, month - 1, day);
            };

            const start = parseDateLocal(customStart);
            const end = parseDateLocal(customEnd);

            console.log('Parsed Custom Dates (Local):', { start, end });

            const label = `${customStart} - ${customEnd}`;
            setSelectedLabel(label);
            onDateChange({ startDate: start, endDate: end, label });
            setIsOpen(false);
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '0.5rem 1rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '200px',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} style={{ opacity: 0.7 }} />
                    <span>{selectedLabel}</span>
                </div>
                <ChevronDown size={14} style={{ opacity: 0.5 }} />
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '0.5rem',
                    background: 'rgba(31, 41, 55, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    zIndex: 50,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    width: '280px'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem' }}>
                        <PresetButton label="Today" onClick={() => handleSingleDaySelect(0, 'Today')} active={selectedLabel === 'Today'} />
                        <PresetButton label="Yesterday" onClick={() => handleSingleDaySelect(1, 'Yesterday')} active={selectedLabel === 'Yesterday'} />
                        <PresetButton label="Last 7 Days" onClick={() => handlePresetSelect(7, 'Last 7 Days')} active={selectedLabel === 'Last 7 Days'} />
                        <PresetButton label="Last 15 Days" onClick={() => handlePresetSelect(15, 'Last 15 Days')} active={selectedLabel === 'Last 15 Days'} />
                        <PresetButton label="Last 30 Days" onClick={() => handlePresetSelect(30, 'Last 30 Days')} active={selectedLabel === 'Last 30 Days'} />
                        <PresetButton label="Last 180 Days" onClick={() => handlePresetSelect(180, 'Last 180 Days')} active={selectedLabel === 'Last 180 Days'} />
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Saved Presets</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '120px', overflowY: 'auto' }}>
                            {presets.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', padding: '0.25rem' }}>No saved presets</div>
                            ) : (
                                presets.map(preset => (
                                    <div key={preset.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <PresetButton
                                                label={preset.name}
                                                onClick={() => handlePresetClick(preset)}
                                                active={selectedLabel === preset.name}
                                            />
                                        </div>
                                        <button
                                            onClick={(e) => handleDeletePreset(preset.id, e)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                                fontSize: '0.8rem',
                                                opacity: 0.7
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                                            title="Delete Preset"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Custom Range</div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '0.25rem',
                                    width: '100%',
                                    fontSize: '0.8rem'
                                }}
                            />
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '0.25rem',
                                    width: '100%',
                                    fontSize: '0.8rem'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleCustomApply}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                background: '#e1ff21',
                                color: 'black',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                opacity: (!customStart || !customEnd) ? 0.5 : 1,
                                fontWeight: 'bold',
                                marginBottom: '0.5rem'
                            }}
                            disabled={!customStart || !customEnd}
                        >
                            Apply Range
                        </button>

                        <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>Save Range as Preset</div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <input
                                    type="text"
                                    placeholder="Preset Name (e.g. Summer Promo)"
                                    value={newPresetName}
                                    onChange={(e) => setNewPresetName(e.target.value)}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        borderRadius: '4px',
                                        padding: '0.25rem',
                                        width: '100%',
                                        fontSize: '0.8rem'
                                    }}
                                />
                                <button
                                    onClick={handleSavePreset}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#e1ff21',
                                        border: '1px solid rgba(225, 255, 33, 0.2)',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        whiteSpace: 'nowrap'
                                    }}
                                    disabled={!newPresetName || !customStart || !customEnd}
                                >
                                    Save
                                </button>
                            </div>
                            {presetError && (
                                <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>{presetError}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PresetButton({ label, onClick, active }: any) {
    return (
        <button
            onClick={onClick}
            style={{
                textAlign: 'left',
                padding: '0.5rem',
                background: active ? 'black' : 'transparent',
                border: 'none',
                borderRadius: '4px',
                color: active ? '#e1ff21' : 'white',
                cursor: 'pointer',
                fontSize: '0.9rem',
                width: '100%'
            }}
        >
            {label}
        </button>
    );
}
