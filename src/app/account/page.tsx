"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import styles from "./account.module.css";
import Sidebar from "../../components/Sidebar"; // Assuming relative path
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

function AccountContent() {
    const { user, isPremium } = useAuth();
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
            const updates: any = {
                data: {
                    first_name: firstName,
                    last_name: lastName
                }
            };

            // Only update password if provided
            if (newPassword) {
                if (newPassword !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                if (newPassword.length < 6) {
                    throw new Error("Password must be at least 6 characters");
                }
                updates.password = newPassword;
            }

            console.log("DEBUG: Calling supabase.auth.updateUser with", updates);

            // Add a timeout to prevent hanging indefinitely
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out - check network or Supabase config")), 15000)
            );

            // Race the update against the timeout
            const result: any = await Promise.race([
                supabase.auth.updateUser(updates),
                timeoutPromise
            ]);

            const { error } = result;

            console.log("DEBUG: supabase.auth.updateUser returned", result);

            if (error) throw error;

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

    return (
        <div className={styles.accountLayout}>
            <Sidebar />
            <div className={styles.contentWrapper}>
                <h1 className={styles.title}>Account Settings</h1>

                <div className={styles.card}>
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

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Current Plan</label>
                            <div className={styles.planContainer}>
                                <div className={`${styles.planBadge} ${isPremium ? styles.premium : ''}`}>
                                    {isPremium ? "Premium Member" : `${plan} Plan`}
                                </div>
                                {!isPremium && (
                                    <button
                                        className={styles.upgradeBtn}
                                        onClick={handleUpgrade}
                                        disabled={loading}
                                    >
                                        Upgrade to Premium
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Security</h2>

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
            </div>
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AccountContent />
        </Suspense>
    );
}
