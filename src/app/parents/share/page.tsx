"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Copy, Check, MessageCircle, Mail, MessageSquare } from 'lucide-react';
import styles from './page.module.css';

interface UserInfo {
    firstName: string;
    email: string;
    isPremium: boolean;
}

function ShareHubContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email');
    const userId = searchParams.get('userId');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [copied, setCopied] = useState(false);
    const [parentPayUrl, setParentPayUrl] = useState('');

    useEffect(() => {
        if (!email && !userId) {
            setError("Missing email or userId. Please make sure the link is complete.");
            setLoading(false);
            return;
        }

        async function fetchUserInfo() {
            try {
                const param = userId ? `userId=${encodeURIComponent(userId)}` : `email=${encodeURIComponent(email!)}`;
                const response = await fetch(`/api/checkout/direct/info?${param}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("We couldn't find your account. Please make sure you signed up first.");
                    }
                    throw new Error("Failed to load user information.");
                }

                const data = await response.json();
                setUserInfo({
                    firstName: data.firstName,
                    email: data.email,
                    isPremium: data.isPremium
                });

                // Generate dynamic parent payment URL using current browser origin
                const origin = window.location.origin;
                const payUrl = `${origin}/parents/pay?email=${encodeURIComponent(data.email)}`;
                setParentPayUrl(payUrl);

            } catch (err: any) {
                console.error("Error fetching user share info:", err);
                setError(err.message || "An unexpected error occurred while loading this page.");
            } finally {
                setLoading(false);
            }
        }

        fetchUserInfo();
    }, [email, userId]);

    if (loading) {
        return (
            <div className={styles.card}>
                <div className={styles.logo}>G1 MASTER</div>
                <div className={styles.spinner}></div>
                <p className={styles.subtitle}>Preparing sharing options...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.card}>
                <div className={styles.logo}>G1 MASTER</div>
                <div className={styles.avatar}>⚠️</div>
                <h1 className={styles.title} style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Something Went Wrong</h1>
                <p className={styles.errorState}>{error}</p>
                <p className={styles.subtitle}>Please try opening the link again or log in directly to your dashboard.</p>
            </div>
        );
    }

    if (userInfo?.isPremium) {
        return (
            <div className={styles.card}>
                <div className={styles.logo}>G1 MASTER</div>
                <div className={styles.avatar}>🎉</div>
                <h1 className={styles.title}>Already Premium!</h1>
                <div className={styles.alreadyPremium}>
                    You already have full access to G1 Master Premium!
                </div>
                <p className={styles.subtitle}>There is no need to share a payment link with your parents.</p>
            </div>
        );
    }

    // Pre-crafted request message
    const messageText = `Hi! I'm studying for my Ontario G1 driving test using G1 Master. Can you unlock the Premium version for me so I can practice with unlimited tests and simulations? Here is the secure Stripe payment link to pay once (no subscription): ${parentPayUrl}`;

    // Native mobile SMS link
    const smsUrl = `sms:?&body=${encodeURIComponent(messageText)}`;
    
    // WhatsApp API share link
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    
    // Pre-filled Email link
    const emailUrl = `mailto:?subject=${encodeURIComponent("Unlock G1 Master Premium for me")}&body=${encodeURIComponent(messageText)}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(parentPayUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy link:', err);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logo}>G1 MASTER</div>
            
            <div className={styles.header}>
                <div className={styles.avatar}>🧑‍🎓</div>
                <h1 className={styles.title}>Ask Parent to Pay</h1>
                <p className={styles.subtitle}>
                    Send the secure payment link below to your parents so they can unlock G1 Master Premium for you.
                </p>
            </div>

            <div className={styles.shareSection}>
                {/* Primary Mobile SMS Link */}
                <a href={smsUrl} className={styles.smsButton}>
                    <MessageSquare size={20} />
                    <span>Send Text Message</span>
                </a>

                {/* Secondary Sharing Grid */}
                <div className={styles.secondaryShareGrid}>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${styles.shareBtn} ${styles.whatsapp}`}>
                        <MessageCircle size={18} />
                        <span>WhatsApp</span>
                    </a>
                    
                    <a href={emailUrl} className={styles.shareBtn}>
                        <Mail size={18} />
                        <span>Email Link</span>
                    </a>
                </div>
            </div>

            {/* Direct Copy Section */}
            <div className={styles.linkGroup}>
                <label className={styles.linkLabel}>Copy Secure Share Link</label>
                <div className={styles.copyWrapper}>
                    <input 
                        type="text" 
                        readOnly 
                        value={parentPayUrl} 
                        className={styles.urlInput}
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <button 
                        onClick={handleCopy} 
                        className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ShareHubPage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={
                <div className={styles.card}>
                    <div className={styles.logo}>G1 MASTER</div>
                    <div className={styles.spinner}></div>
                    <p className={styles.subtitle}>Loading G1 Master Portal...</p>
                </div>
            }>
                <ShareHubContent />
            </Suspense>
        </div>
    );
}
