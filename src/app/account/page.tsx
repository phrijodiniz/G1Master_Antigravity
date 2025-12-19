"use client";

import { useEffect, useState } from "react";
import styles from "./account.module.css";
import Sidebar from "../../components/Sidebar"; // Assuming relative path
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function AccountPage() {
    const { user } = useAuth();
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
            setPlan(meta.plan || "Standard");

            // Check for Google Auth
            const isGoogle = user.app_metadata?.provider === 'google' ||
                user.identities?.some(id => id.provider === 'google');
            setIsGoogleAuth(!!isGoogle);
        }
    }, [user]);

    const handleSave = async () => {
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

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            setMsg({ type: "success", text: "Profile updated successfully!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            setMsg({ type: "error", text: error.message || "Failed to update profile" });
        } finally {
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
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Last Name</label>
                            <input
                                className={styles.input}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
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
                            <div className={styles.planBadge}>
                                {plan} Plan
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
