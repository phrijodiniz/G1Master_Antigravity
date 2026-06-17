"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, ArrowLeft, User, Shield, CheckCircle, Clock, Trash2 } from "lucide-react";
import styles from "../../../components/LoginModal.module.css"; // Reuse modal and form styles if needed

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/users");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data.users || []);
            
            // Update selected user reference if active to refresh statistics
            if (selectedUser) {
                const refreshed = data.users.find((u: any) => u.id === selectedUser.id);
                if (refreshed) {
                    setSelectedUser(refreshed);
                }
            }
        } catch (err) {
            console.error("Error fetching admin users:", err);
        } finally {
            setLoading(false);
        }
    }, [selectedUser]);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filtered user list calculation
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            const email = (user.email || "").toLowerCase();
            const term = searchTerm.toLowerCase().trim();

            const matchesSearch = fullName.includes(term) || email.includes(term);
            const matchesStatus = statusFilter === "All" || user.status === statusFilter;
            const matchesRole = roleFilter === "All" || user.admin === roleFilter;

            return matchesSearch && matchesStatus && matchesRole;
        });
    }, [users, searchTerm, statusFilter, roleFilter]);

    // Summary statistics
    const stats = useMemo(() => {
        const total = users.length;
        const premium = users.filter(u => u.status === "Premium").length;
        const standard = total - premium;
        const conversionRate = total > 0 ? Math.round((premium / total) * 100) : 0;
        return { total, premium, standard, conversionRate };
    }, [users]);

    // Handle user status or role updates
    const handleUpdateUser = async (userId: string, fields: { status?: string; admin?: string }) => {
        setUpdatingUserId(userId);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ userId, ...fields })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update user");
            }

            // Fetch latest user states
            await fetchUsers();
        } catch (err: any) {
            console.error("Error updating user status:", err);
            alert(err.message || "Failed to update user");
        } finally {
            setUpdatingUserId(null);
        }
    };

    return (
        <div style={{ padding: "2rem" }}>
            {/* Back Button */}
            <button
                onClick={() => window.location.href = "/admin"}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                    padding: 0
                }}
            >
                <ArrowLeft size={16} />
                Back to Dashboard
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "2.2rem", fontWeight: 700 }}>Users Management</h1>
            </div>

            {/* Quick Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
                <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Total Users</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.total}</div>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem", color: "#10B981" }}>Premium Users</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "#10B981" }}>{stats.premium}</div>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Standard (Free) Users</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800 }}>{stats.standard}</div>
                </div>
                <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem", color: "var(--primary)" }}>Conversion Rate</div>
                    <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{stats.conversionRate}%</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
                    <Search style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} size={18} />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.8rem 1rem 0.8rem 2.8rem",
                            background: "var(--glass-bg)",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "8px",
                            color: "white"
                        }}
                    />
                </div>

                <div style={{ position: "relative", width: "200px" }}>
                    <Filter style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5, color: "black" }} size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.8rem 1rem 0.8rem 2.8rem",
                            background: "white",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "8px",
                            color: "black",
                            cursor: "pointer",
                            appearance: "none"
                        }}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Standard">Standard</option>
                        <option value="Premium">Premium</option>
                    </select>
                </div>

                <div style={{ position: "relative", width: "200px" }}>
                    <Filter style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5, color: "black" }} size={18} />
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.8rem 1rem 0.8rem 2.8rem",
                            background: "white",
                            border: "1px solid var(--glass-border)",
                            borderRadius: "8px",
                            color: "black",
                            cursor: "pointer",
                            appearance: "none"
                        }}
                    >
                        <option value="All">All Roles</option>
                        <option value="YES">Admins Only</option>
                        <option value="NO">Regular Users</option>
                    </select>
                </div>
            </div>

            {/* Content Split: Table and Edit Drawer */}
            <div style={{ display: "flex", gap: "2rem", flexDirection: "row", flexWrap: "wrap-reverse" }}>
                {/* User List Table */}
                <div style={{ flex: 2, minWidth: "600px" }}>
                    {loading && users.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center", opacity: 0.6 }}>Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center", opacity: 0.6 }}>No matching users found.</div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--glass-bg)", borderRadius: "12px", border: "1px solid var(--glass-border)", overflow: "hidden" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                                        <th style={{ textAlign: "left", padding: "1rem" }}>User</th>
                                        <th style={{ textAlign: "left", padding: "1rem" }}>Plan Status</th>
                                        <th style={{ textAlign: "left", padding: "1rem" }}>G1 Readiness</th>
                                        <th style={{ textAlign: "left", padding: "1rem" }}>Tests Taken</th>
                                        <th style={{ textAlign: "left", padding: "1rem" }}>Signed Up</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => {
                                        const isSelected = selectedUser?.id === u.id;
                                        const readyColor = u.stats.passProbability >= 80 ? "#10B981" : "#F59E0B";
                                        return (
                                            <tr
                                                key={u.id}
                                                onClick={() => setSelectedUser(u)}
                                                style={{
                                                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                    cursor: "pointer",
                                                    background: isSelected ? "rgba(255,255,255,0.08)" : "transparent",
                                                    transition: "background 0.2s"
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) e.currentTarget.style.background = "transparent";
                                                }}
                                            >
                                                <td style={{ padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                                            {u.firstName || u.lastName ? `${u.firstName} ${u.lastName}`.trim() : "G1 Candidate"}
                                                            {u.admin === "YES" && <span title="Admin"><Shield size={14} style={{ color: "var(--primary)" }} /></span>}
                                                        </div>
                                                        <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>{u.email}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    <span style={{
                                                        fontSize: "0.75rem",
                                                        padding: "4px 10px",
                                                        borderRadius: "100px",
                                                        fontWeight: 700,
                                                        background: u.status === "Premium" ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                                                        color: u.status === "Premium" ? "#10B981" : "rgba(255,255,255,0.7)",
                                                        border: `1px solid ${u.status === "Premium" ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.1)"}`
                                                    }}>
                                                        {u.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: "1rem", color: readyColor, fontWeight: 700 }}>
                                                    {u.stats.totalTests > 0 ? `${u.stats.passProbability}%` : "—"}
                                                </td>
                                                <td style={{ padding: "1rem" }}>
                                                    {u.stats.totalTests} <span style={{ opacity: 0.5, fontSize: "0.85rem" }}>({u.stats.simulationsCount} sim, {u.stats.practiceCount} prac)</span>
                                                </td>
                                                <td style={{ padding: "1rem", fontSize: "0.85rem", opacity: 0.7 }}>
                                                    {new Date(u.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit & Detail Sidebar Panel */}
                {selectedUser && (
                    <div style={{ flex: 1, minWidth: "350px", position: "sticky", top: "2rem" }}>
                        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                                <h2 style={{ fontSize: "1.4rem", fontWeight: 700 }}>User Profile</h2>
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    style={{ background: "transparent", border: "none", color: "white", opacity: 0.6, cursor: "pointer", fontSize: "1.2rem", padding: "0.2rem" }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* User Header Details */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1.5rem" }}>
                                <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>
                                    {selectedUser.firstName || selectedUser.lastName ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim() : "G1 Candidate"}
                                </div>
                                <div style={{ opacity: 0.6, fontSize: "0.9rem" }}>{selectedUser.email}</div>
                                <div style={{ opacity: 0.4, fontSize: "0.8rem", fontFamily: "monospace" }}>ID: {selectedUser.id}</div>
                                <div style={{ opacity: 0.6, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                                    Auth Method: <strong style={{ textTransform: "capitalize" }}>{selectedUser.provider}</strong>
                                </div>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.5rem 0" }} />

                            {/* Study Progress Metrics */}
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>📖 Study Engagement</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                                    <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block" }}>Rules Avg (3 tests)</span>
                                    <strong style={{ fontSize: "1.1rem" }}>{selectedUser.stats.rulesAvg !== null ? `${selectedUser.stats.rulesAvg}%` : "—"}</strong>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                                    <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block" }}>Signs Avg (3 tests)</span>
                                    <strong style={{ fontSize: "1.1rem" }}>{selectedUser.stats.signsAvg !== null ? `${selectedUser.stats.signsAvg}%` : "—"}</strong>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                                    <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block" }}>Rolling Credits Left</span>
                                    <strong style={{ fontSize: "1.1rem" }}>{selectedUser.stats.practiceCreditsLeft} / 3</strong>
                                </div>
                                <div style={{ background: "rgba(255,255,255,0.03)", padding: "0.75rem", borderRadius: "8px" }}>
                                    <span style={{ fontSize: "0.8rem", opacity: 0.5, display: "block" }}>Readiness Score</span>
                                    <strong style={{ fontSize: "1.1rem", color: selectedUser.stats.passProbability >= 80 ? "#10B981" : "#F59E0B" }}>
                                        {selectedUser.stats.totalTests > 0 ? `${selectedUser.stats.passProbability}%` : "—"}
                                    </strong>
                                </div>
                            </div>

                            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "1.5rem 0" }} />

                            {/* Administration Actions */}
                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>🛠️ Admin Commands</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div>
                                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Toggle Premium Status:</div>
                                    <button
                                        onClick={() => handleUpdateUser(selectedUser.id, {
                                            status: selectedUser.status === "Premium" ? "Standard" : "Premium"
                                        })}
                                        disabled={updatingUserId === selectedUser.id}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            background: selectedUser.status === "Premium" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                                            color: selectedUser.status === "Premium" ? "#ef4444" : "#10B981",
                                            border: `1px solid ${selectedUser.status === "Premium" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: updatingUserId ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        {updatingUserId === selectedUser.id ? "Processing..." : 
                                         selectedUser.status === "Premium" ? "Downgrade to Standard" : "Upgrade to Premium"}
                                    </button>
                                </div>

                                <div>
                                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Toggle Admin Role:</div>
                                    <button
                                        onClick={() => handleUpdateUser(selectedUser.id, {
                                            admin: selectedUser.admin === "YES" ? "NO" : "YES"
                                        })}
                                        disabled={updatingUserId === selectedUser.id}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            background: "transparent",
                                            color: selectedUser.admin === "YES" ? "#ef4444" : "var(--primary)",
                                            border: `1px solid ${selectedUser.admin === "YES" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.2)"}`,
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: updatingUserId ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        {updatingUserId === selectedUser.id ? "Processing..." :
                                         selectedUser.admin === "YES" ? "Revoke Admin Privileges" : "Grant Admin Privileges"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
