"use client";

import React, { useState } from 'react';
import { Copy, Check, MessageCircle, Mail, MessageSquare, X } from 'lucide-react';
import styles from './ParentShareModal.module.css';

interface ParentShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkoutUrl: string;
    isPromoActive: boolean;
}

export default function ParentShareModal({ isOpen, onClose, checkoutUrl, isPromoActive }: ParentShareModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const price = isPromoActive ? "$12.98 CAD" : "$19.97 CAD";
    
    // Copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(checkoutUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    // Pre-crafted message
    const messageText = `Hi! I'm studying for my Ontario G1 driving test using G1 Master. Can you unlock the Premium version for me so I can practice with unlimited tests and simulations? Here is the secure Stripe payment link to pay once (no subscription): ${checkoutUrl}`;
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent("Unlock G1 Master Premium for me")}&body=${encodeURIComponent(messageText)}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(messageText)}`;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                    <X size={20} />
                </button>

                <div className={styles.header}>
                    <div className={styles.iconContainer}>🧑‍🎓</div>
                    <h2 className={styles.title}>Ask Parent to Pay</h2>
                    <p className={styles.subtitle}>
                        Send this secure payment link to your parents so they can unlock G1 Master Premium for you.
                    </p>
                </div>

                <div className={styles.parentPerks}>
                    <div className={styles.perkItem}>
                        <span className={styles.perkCheck}>🛡️</span>
                        <div>
                            <strong>One-Time Payment of {price}</strong>
                            <p>Single charge. No recurring subscriptions or hidden weekly fees.</p>
                        </div>
                    </div>
                    <div className={styles.perkItem}>
                        <span className={styles.perkCheck}>🛡️</span>
                        <div>
                            <strong>100% Pass Guarantee</strong>
                            <p>Full refund if you do not pass your official G1 test on the first try.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.linkSection}>
                    <label className={styles.linkLabel}>Secure Checkout Link</label>
                    <div className={styles.copyGroup}>
                        <input 
                            type="text" 
                            readOnly 
                            value={checkoutUrl} 
                            className={styles.linkInput} 
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button onClick={handleCopy} className={styles.copyBtn}>
                            {copied ? <Check size={16} className={styles.copyIconCheck} /> : <Copy size={16} />}
                            <span>{copied ? 'Copied!' : 'Copy'}</span>
                        </button>
                    </div>
                </div>

                <div className={styles.shareTitle}>Quick Share Options</div>
                <div className={styles.shareGrid}>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={`${styles.shareOption} ${styles.whatsapp}`}>
                        <MessageCircle size={20} />
                        <span>WhatsApp</span>
                    </a>
                    
                    <a href={smsUrl} className={`${styles.shareOption} ${styles.sms}`}>
                        <MessageSquare size={20} />
                        <span>SMS / Text</span>
                    </a>

                    <a href={emailUrl} className={`${styles.shareOption} ${styles.email}`}>
                        <Mail size={20} />
                        <span>Email</span>
                    </a>
                </div>

                <button onClick={onClose} className={styles.doneBtn}>
                    Done, take me back
                </button>
            </div>
        </div>
    );
}
