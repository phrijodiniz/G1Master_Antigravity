"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { sendGTMEvent } from '@/lib/gtm';


interface LimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    variant?: 'default' | 'chapter_quiz' | 'practice_limit' | 'simulation_limit' | 'all_limit';
}

export default function LimitModal({ isOpen, onClose, message, variant = 'default' }: LimitModalProps) {
    if (!isOpen) return null;

    const handleUpgrade = async () => {
        sendGTMEvent('begin_checkout', { source: variant === 'default' ? 'limit_modal' : `${variant}_modal` });
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

    const isChapterQuiz = variant === 'chapter_quiz';
    const isPracticeLimit = variant === 'practice_limit';
    const isSimulationLimit = variant === 'simulation_limit';
    const isAllLimit = variant === 'all_limit';
    const isSpecialVariant = isChapterQuiz || isPracticeLimit || isSimulationLimit || isAllLimit;

    const getHeadline = () => {
        if (isChapterQuiz) return "Unlock All Chapter Tests";
        if (isPracticeLimit) return "Unlock Unlimited Practice";
        if (isSimulationLimit) return "Unlock Unlimited Simulations";
        if (isAllLimit) return "You’ve Reached the Free Limit";
        return "Limit Reached";
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                background: 'white',
                padding: isSpecialVariant ? '2.5rem 2rem' : '2rem',
                borderRadius: '24px',
                width: '100%',
                maxWidth: isSpecialVariant ? '480px' : '400px',
                textAlign: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {isSpecialVariant && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '6px',
                        background: 'linear-gradient(to right, #e1ff21, #2563eb)'
                    }} />
                )}

                <h2 style={{
                    marginBottom: isSpecialVariant ? '0.5rem' : '1rem',
                    color: '#0f172a',
                    fontSize: isSpecialVariant ? '1.75rem' : '1.5rem',
                    fontWeight: 800,
                    lineHeight: 1.2
                }}>
                    {getHeadline()}
                </h2>

                {isChapterQuiz && (
                    <>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
                            Chapter quizzes are part of G1 Master Premium Plan. <br />
                            <strong>Upgrade to get:</strong>
                        </p>

                        <div style={{
                            textAlign: 'left',
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Unlimited chapter quizzes
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Practice by topic (rules & signs)
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Review mistakes and improve weak areas
                            </div>
                        </div>

                        <div style={{
                            border: '2px solid #e1ff21',
                            background: '#fffff0',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>$9.97 <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>one-time payment</span></div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>No weekly fees • Lifetime access</div>
                        </div>
                    </>
                )}

                {isPracticeLimit && (
                    <>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
                            You’ve completed all 5 free practice tests <br />
                            <strong>Upgrade to Premium now and unlock:</strong>
                        </p>

                        <div style={{
                            textAlign: 'left',
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Unlimited practice tests
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Unlimited simulations
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Progress tracking & readiness score
                            </div>
                        </div>

                        <div style={{
                            border: '2px solid #e1ff21',
                            background: '#fffff0',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>One-time fee: $9.97</div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>Practice as much as you want — forever.</div>
                        </div>
                    </>
                )}

                {isSimulationLimit && (
                    <>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
                            You’ve used all free simulation credits. <br />
                            <strong>Upgrade to:</strong>
                        </p>

                        <div style={{
                            textAlign: 'left',
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Take unlimited G1 simulations
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Experience real exam flow and difficulty
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✅</span> Build confidence before test day
                            </div>
                        </div>

                        <div style={{
                            border: '2px solid #e1ff21',
                            background: '#fffff0',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>$9.97 <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>— one-time payment</span></div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>No subscriptions. No renewals.</div>
                        </div>
                    </>
                )}

                {isAllLimit && (
                    <>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
                            You’ve completed all free practice and simulation credits — great progress 👏 <br />
                            <strong>Upgrade to G1 Master Premium to unlock:</strong>
                        </p>

                        <div style={{
                            textAlign: 'left',
                            background: '#f8fafc',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ fontSize: '1.2rem' }}>🔓</span> Unlimited practice tests
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ fontSize: '1.2rem' }}>🔓</span> Unlimited simulations
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ fontSize: '1.2rem' }}>🔓</span> All chapter quizzes
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                                <span style={{ fontSize: '1.2rem' }}>🔓</span> Progress tracking & readiness meter
                            </div>
                        </div>

                        <div style={{
                            border: '2px solid #e1ff21',
                            background: '#fffff0',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>💰 Only $9.97 <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>(one-time fee)</span></div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem', fontWeight: 500 }}>No subscriptions • Lifetime access</div>
                        </div>
                    </>
                )}

                {!isSpecialVariant && (
                    <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>
                        {message || "You have used all your free practice credits. Upgrade to Premium for unlimited access."}
                    </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                        onClick={handleUpgrade}
                        style={{
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            border: 'none',
                            background: '#2563eb', // More vibrant blue for primary CTA
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            width: '100%',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        {isSpecialVariant ? (
                            isAllLimit ? "Upgrade to Premium for $9.97" :
                                (isPracticeLimit || isSimulationLimit ?
                                    (isSimulationLimit ? "Get Premium Access" : "Upgrade Now") : "Unlock Premium Access Now")
                        ) : (
                            <>
                                <span>Upgrade Now</span>
                                <span style={{ background: '#e1ff21', color: 'black', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px' }}>$9.97</span>
                            </>
                        )}
                    </button>

                    {isChapterQuiz && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Other apps charge $49/week or $159 lifetime
                        </p>
                    )}
                    {(isPracticeLimit || isSimulationLimit) && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            {isSimulationLimit ? "Other apps charge $49/week or $159 lifetime" : "One single payment. No renewals or hidden fees."}
                        </p>
                    )}
                    {isAllLimit && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Some G1 apps charge $49/week or $159 lifetime.
                        </p>
                    )}

                    <button
                        onClick={() => {
                            if (isAllLimit) {
                                supabase.auth.signOut().then(() => window.location.href = '/');
                            } else {
                                window.location.href = '/dashboard';
                            }
                        }}
                        style={{
                            padding: '0.75rem 1.5rem',
                            marginTop: isSpecialVariant ? '0.5rem' : 0,
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        {isAllLimit ? "Log Out" : (isSpecialVariant ? "Not now, take me back" : "Back to Dashboard")}
                    </button>
                </div>
            </div>
        </div>
    );
}
