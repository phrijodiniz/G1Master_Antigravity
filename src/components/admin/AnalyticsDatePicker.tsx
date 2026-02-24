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
                                fontWeight: 'bold'
                            }}
                            disabled={!customStart || !customEnd}
                        >
                            Apply Range
                        </button>
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
