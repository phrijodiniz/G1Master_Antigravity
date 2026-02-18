"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import styles from "./account.module.css";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

function AccountContent() {
    const { user, isPremium, practiceCredits, simulationCredits, renewalDate } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [plan, setPlan] = useState("Standard"); // Default
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isGoogleAuth, setIsGoogleAuth] = useState(false);

    useEffect(() => {
        if (user) {
            setEmail(user.email || "");
            const meta = user.user_metadata || {};
            setFirstName(meta.first_name || "");
            setLastName(meta.last_name || "");

            // Check for Google Auth
            const isGoogle = user.app_metadata?.provider === 'google' ||
                user.identities?.some(id => id.provider === 'google');
            setIsGoogleAuth(!!isGoogle);
        }
    }, [user]);

    // Update plan display based on isPremium context which fetches from profiles table
    useEffect(() => {
        if (isPremium) {
            setPlan("Premium");
        } else {
            setPlan("Standard");
        }
    }, [isPremium]);

    // Handle Stripe redirect - Separate effect
    useEffect(() => {
        if (searchParams.get('session_id')) {
            setMsg({ type: "success", text: "Payment successful! Your account is being upgraded..." });

            // Track Purchase
            import('@/lib/gtm').then(({ sendGTMEvent }) => {
                sendGTMEvent('purchase', {
                    method: 'stripe',
                    session_id: searchParams.get('session_id'),
                    value: 9.97,
                    currency: 'CAD'
                });
            });

            // Force strict refresh of user data to get the new 'Premium' claim
            const refreshUser = async () => {
                const { error } = await supabase.auth.refreshSession();
                if (!error) {
                    window.location.href = '/account';
                }
            };
            refreshUser();
        }
    }, [searchParams, router]);

    const handleSave = async () => {
        console.log("DEBUG: handleSave started");
        setLoading(true);
        setMsg({ type: "", text: "" });
        try {
            // Call server-side API to handle update reliably
            const response = await fetch('/api/account/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    password: newPassword || undefined
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update profile");
            }

            // Success
            const result = await response.json();

            setMsg({ type: "success", text: "Profile updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("DEBUG: handleSave error", error);
            setMsg({ type: "error", text: error.message || "Failed to update profile" });
        } finally {
            console.log("DEBUG: handleSave finally");
            setLoading(false);
        }
    };

    const handleUpgrade = async () => {
        setLoading(true);
        // Track Checkout Start
        import('@/lib/gtm').then(({ sendGTMEvent }) => {
            sendGTMEvent('begin_checkout', { source: 'account_page' });
        });

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error("Please log in to upgrade.");
            }

            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
            });

            const { url, error } = await response.json();

            if (error) throw new Error(error);

            if (url) {
                window.location.href = url;
            } else {
                throw new Error("Failed to create checkout session");
            }

        } catch (error: any) {
            setMsg({ type: "error", text: error.message || "Failed to initiate checkout" });
            setLoading(false);
        }
    };



    // ... existing imports ...

    // ... inside AccountContent ...
    return (
        <DashboardLayout>
            <h1 className={styles.title}>Account Settings</h1>

            {/* Personal Information Section */}
            <div className={styles.card} style={{ marginBottom: '2rem' }}>
                <h2 className={styles.sectionTitle}>Personal Information</h2>
                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>First Name</label>
                        <input
                            className={styles.input}
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Jane"
                            autoComplete="given-name"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Last Name</label>
                        <input
                            className={styles.input}
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            autoComplete="family-name"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email Address</label>
                        <input
                            className={`${styles.input} ${styles.inputDisabled}`}
                            value={email}
                            disabled
                            readOnly
                        />
                    </div>
                </div>
            </div>

            {/* Current Plan Section */}
            {/* Current Plan Section */}
            <div className={styles.card} style={{ marginBottom: '2rem' }}>
                <h2 className={styles.sectionTitle}>Current Plan</h2>
                <div className={styles.formGroup}>
                    <div className={styles.planContainer}>
                        <div className={`${styles.planBadge} ${isPremium ? styles.premium : ''}`}>
                            {isPremium ? "Premium Member" : `${plan} Plan`}
                        </div>

                        {!isPremium && (
                            <div className={styles.creditsGroup}>
                                <span className={styles.creditsLabel}>Remaining Available Credits:</span>
                                <div className={styles.creditsInline}>
                                    <div className={styles.creditItemInline}>
                                        <span className={styles.creditValueInline}>{practiceCredits}</span> Practice Tests
                                    </div>
                                    <div className={styles.creditItemInline}>
                                        <span className={styles.creditValueInline}>{simulationCredits}</span> Simulations
                                    </div>
                                </div>
                                {renewalDate && ((practiceCredits || 0) <= 0 || (simulationCredits || 0) <= 0) && (
                                    <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                                        Credits will renew automatically on {renewalDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {!isPremium && (
                    <div className={styles.marketingContainer}>
                        <button
                            className={styles.upgradeBtn}
                            onClick={handleUpgrade}
                            disabled={loading}
                            style={{ marginBottom: '1rem', width: '100%' }}
                        >
                            Click here to unlock your Premium plan for only $9.97 (One-Time Fee)
                        </button>

                        <div className={styles.marketingText}>
                            As a <span className={styles.marketingHighlight}>PREMIUM</span> member, you get unlimited practice tests, simulations, and full progress tracking. Pay once. Lifetime access. No subscriptions.
                        </div>
                    </div>
                )}
            </div>

            {/* Security Section */}
            <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Security</h2>

                {isGoogleAuth ? (
                    <div className={styles.infoMessage}>
                        You signed in using Google. To change your password, please visit your Google Account settings.
                    </div>
                ) : (
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>New Password</label>
                            <input
                                className={styles.input}
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New Password"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Confirm Password</label>
                            <input
                                className={styles.input}
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm New Password"
                            />
                        </div>
                    </div>
                )}

                <div className={styles.buttonGroup}>
                    <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {msg.text && (
                    <div className={msg.type === 'success' ? styles.successMessage : styles.errorMessage}>
                        {msg.text}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AccountContent />
        </Suspense>
    );
}
