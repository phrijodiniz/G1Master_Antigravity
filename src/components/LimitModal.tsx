"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

export default function LimitModal({ isOpen, onClose, message }: LimitModalProps) {
    if (!isOpen) return null;

    const handleUpgrade = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Please log in again.");
                return;
            }

            // Create Checkout Session
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error(err);
            alert("Error initiating checkout.");
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <h2 style={{ marginBottom: '1rem', color: '#0f172a', fontSize: '1.5rem', fontWeight: 800 }}>
                    Limit Reached
                </h2>
                <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
                    {message || "You have used all your free practice credits. Upgrade to Premium for unlimited access."}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={handleUpgrade}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#0f172a',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>Upgrade Now</span>
                        <span style={{ background: '#e1ff21', color: 'black', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px' }}>$9.97</span>
                    </button>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
