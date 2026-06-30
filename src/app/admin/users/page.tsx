"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, ArrowLeft, User, Shield, CheckCircle, Clock, Trash2, Download } from "lucide-react";
import styles from "../../../components/LoginModal.module.css"; // Reuse modal and form styles if needed

export default function AdminUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");
    const [dateFilter, setDateFilter] = useState("All");
    const [specificDate, setSpecificDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [testFilter, setTestFilter] = useState("All");
    const [freeTestFilter, setFreeTestFilter] = useState("All");
    const [hideTestAccounts, setHideTestAccounts] = useState(true);
    const [checkoutFilter, setCheckoutFilter] = useState("All");
    const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

    // Deletion states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [deleteTextConfirm, setDeleteTextConfirm] = useState("");

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

            let matchesDate = true;
            if (dateFilter !== "All") {
                const signupDate = new Date(user.createdAt);
                
                if (dateFilter === "Specific") {
                    if (specificDate) {
                        const userLocalDateStr = signupDate.toLocaleDateString('en-CA'); // format: YYYY-MM-DD
                        matchesDate = userLocalDateStr === specificDate;
                    }
                } else if (dateFilter === "Range") {
                    const userLocalDateStr = signupDate.toLocaleDateString('en-CA'); // format: YYYY-MM-DD
                    if (startDate && endDate) {
                        matchesDate = userLocalDateStr >= startDate && userLocalDateStr <= endDate;
                    } else if (startDate) {
                        matchesDate = userLocalDateStr >= startDate;
                    } else if (endDate) {
                        matchesDate = userLocalDateStr <= endDate;
                    }
                } else {
                    const todayStr = new Date().toLocaleDateString('en-CA'); // format: YYYY-MM-DD
                    const userLocalDateStr = signupDate.toLocaleDateString('en-CA'); // format: YYYY-MM-DD

                    if (dateFilter === "Today") {
                        matchesDate = userLocalDateStr === todayStr;
                    } else {
                        const diffTime = Date.now() - signupDate.getTime();
                        const diffDays = diffTime / (1000 * 60 * 60 * 24);

                        if (dateFilter === "Week") {
                            matchesDate = diffDays <= 7;
                        } else if (dateFilter === "Month") {
                            matchesDate = diffDays <= 30;
                        }
                    }
                }
            }

            let matchesTests = true;
            if (testFilter !== "All") {
                const totalTests = user.stats.totalTests || 0;
                if (testFilter === "0") {
                    matchesTests = totalTests === 0;
                } else if (testFilter === "1") {
                    matchesTests = totalTests === 1;
                } else if (testFilter === "2") {
                    matchesTests = totalTests === 2;
                } else if (testFilter === "3") {
                    matchesTests = totalTests === 3;
                } else if (testFilter === "3+") {
                    matchesTests = totalTests > 3;
                }
            }

            let matchesFreeTest = true;
            if (freeTestFilter !== "All") {
                const hasTaken = !!user.hasTakenFreeTest;
                if (freeTestFilter === "Taken") {
                    matchesFreeTest = hasTaken;
                } else if (freeTestFilter === "Not Taken") {
                    matchesFreeTest = !hasTaken;
                }
            }

            let matchesTestAccount = true;
            if (hideTestAccounts) {
                matchesTestAccount = !user.isTest;
            }

            let matchesCheckout = true;
            if (checkoutFilter !== "All") {
                const hasCheckout = !!user.initiatedCheckout;
                if (checkoutFilter === "Initiated") {
                    matchesCheckout = hasCheckout;
                } else if (checkoutFilter === "No Checkout") {
                    matchesCheckout = !hasCheckout;
                }
            }

            return matchesSearch && matchesStatus && matchesRole && matchesDate && matchesTests && matchesTestAccount && matchesFreeTest && matchesCheckout;
        });
    }, [users, searchTerm, statusFilter, roleFilter, dateFilter, specificDate, startDate, endDate, testFilter, freeTestFilter, hideTestAccounts, checkoutFilter]);

    // Summary statistics (excluding test accounts)
    const stats = useMemo(() => {
        const realUsers = users.filter(u => !u.isTest);
        const total = realUsers.length;
        const premium = realUsers.filter(u => u.status === "Premium").length;
        const standard = total - premium;
        return { total, premium, standard };
    }, [users]);

    // Handle user status or role updates
    const handleUpdateUser = async (userId: string, fields: { status?: string; admin?: string; isTestAccount?: boolean }) => {
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

    // Handle user deletion
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setUpdatingUserId(userToDelete.id);
        try {
            const res = await fetch(`/api/admin/users?userId=${userToDelete.id}`, {
                method: "DELETE"
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to delete user");
            }

            // Reset selection if deleted
            if (selectedUser?.id === userToDelete.id) {
                setSelectedUser(null);
            }

            setShowDeleteModal(false);
            setUserToDelete(null);
            setDeleteTextConfirm("");

            // Fetch updated list
            await fetchUsers();
        } catch (err: any) {
            console.error("Error deleting user:", err);
            alert(err.message || "Failed to delete user");
        } finally {
            setUpdatingUserId(null);
        }
    };

    const exportToCSV = () => {
        const headers = ["Email", "First Name", "Last Name", "Average Score"];
        
        const rows = filteredUsers.map(user => [
            user.email || "",
            user.firstName || "",
            user.lastName || "",
            user.stats.averageScore !== null ? `${user.stats.averageScore}%` : "—"
        ]);
        
        const csvContent = [
            headers.join(","),
            ...rows.map(row => 
                row.map(val => {
                    const escaped = String(val).replace(/"/g, '""');
                    return /[,\"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
                }).join(",")
            )
        ].join("\n");
        
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <button
                    onClick={exportToCSV}
                    style={{
                        padding: "0.8rem 1.5rem",
                        background: "rgba(255, 255, 255, 0.1)",
                        color: "white",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)"}
                >
                    <Download size={16} />
                    Export CSV
                </button>
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

                <div style={{ position: "relative", width: "200px" }}>
                    <Filter style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5, color: "black" }} size={18} />
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
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
                        <option value="All">All Sign Up Dates</option>
                        <option value="Today">Joined Today</option>
                        <option value="Week">Joined Last 7 Days</option>
                        <option value="Month">Joined Last 30 Days</option>
                        <option value="Specific">Pick Specific Date...</option>
                        <option value="Range">Pick Date Range...</option>
                    </select>
                </div>

                {dateFilter === "Specific" && (
                    <div style={{ position: "relative", width: "200px" }}>
                        <input
                            type="date"
                            value={specificDate}
                            onChange={(e) => setSpecificDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "0.8rem 1rem",
                                background: "white",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "8px",
                                color: "black",
                                cursor: "pointer"
                            }}
                        />
                    </div>
                )}

                {dateFilter === "Range" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                padding: "0.8rem 1rem",
                                background: "white",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "8px",
                                color: "black",
                                cursor: "pointer"
                            }}
                            placeholder="Start Date"
                        />
                        <span style={{ opacity: 0.6 }}>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                                padding: "0.8rem 1rem",
                                background: "white",
                                border: "1px solid var(--glass-border)",
                                borderRadius: "8px",
                                color: "black",
                                cursor: "pointer"
                            }}
                            placeholder="End Date"
                        />
                    </div>
                )}

                <div style={{ position: "relative", width: "200px" }}>
                    <Filter style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5, color: "black" }} size={18} />
                    <select
                        value={testFilter}
                        onChange={(e) => setTestFilter(e.target.value)}
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
                        <option value="All">All Test Counts</option>
                        <option value="0">0 tests taken</option>
                        <option value="1">1 test taken</option>
                        <option value="2">2 tests taken</option>
                        <option value="3">3 tests taken</option>
                        <option value="3+">3+ tests taken</option>
                    </select>
                </div>
                <div style={{ position: "relative", width: "200px" }}>
                    <Filter style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5, color: "black" }} size={18} />
                    <select
                        value={freeTestFilter}
                        onChange={(e) => setFreeTestFilter(e.target.value)}
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
                        <option value="All">All Free Tests</option>
                        <option value="Taken">Free Test Taken</option>
                        <option value="Not Taken">Free Test Not Taken</option>
                    </select>
                </div>

                <div style={{ position: "relative", width: "200px" }}>
                    <Filter style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", opacity: 0.5, color: "black" }} size={18} />
                    <select
                        value={checkoutFilter}
                        onChange={(e) => setCheckoutFilter(e.target.value)}
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
                        <option value="All">All Checkout Statuses</option>
                        <option value="Initiated">Initiated Checkout</option>
                        <option value="No Checkout">Did Not Initiate Checkout</option>
                    </select>
                </div>
            </div>

            {/* Filter Result Summary and Hide/Show Test Toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", fontSize: "0.95rem", flexWrap: "wrap", gap: "1rem", width: "100%" }}>
                <div style={{ opacity: 0.9 }}>
                    Found <strong>{filteredUsers.length}</strong> {filteredUsers.length === 1 ? "user" : "users"} matching current filters (out of {users.length} total).
                </div>
                <button
                    onClick={() => setHideTestAccounts(!hideTestAccounts)}
                    style={{
                        background: "none",
                        border: "none",
                        color: "rgba(255, 255, 255, 0.75)",
                        textDecoration: "underline",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        fontFamily: "inherit"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255, 255, 255, 0.75)"}
                >
                    {hideTestAccounts ? "Show Test Accounts" : "Hide Test Accounts"}
                </button>
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
                                        <th style={{ textAlign: "center", padding: "1rem" }}>Plan Status</th>
                                        <th style={{ textAlign: "center", padding: "1rem" }}>Free Test</th>
                                        <th style={{ textAlign: "center", padding: "1rem" }}>Available Credits</th>
                                        <th style={{ textAlign: "center", padding: "1rem" }}>G1 Readiness</th>
                                        <th style={{ textAlign: "center", padding: "1rem" }}>Avg Score</th>
                                        <th style={{ textAlign: "center", padding: "1rem" }}>Tests Taken</th>
                                        <th style={{ textAlign: "center", padding: "1rem" }}>Signed Up</th>
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
                                                            {u.firstName || u.lastName 
                                                                ? `${u.firstName} ${u.lastName}`.trim() 
                                                                : (u.email ? u.email.split('@')[0] : "G1 Candidate")}
                                                            {u.admin === "YES" && <span title="Admin"><Shield size={14} style={{ color: "var(--primary)" }} /></span>}
                                                            {u.isTest && <span style={{ fontSize: "0.7rem", padding: "2px 6px", background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "4px", fontWeight: "bold" }}>Test</span>}
                                                            {u.initiatedCheckout && (
                                                                <span style={{
                                                                    fontSize: "0.7rem",
                                                                    padding: "2px 6px",
                                                                    background: "rgba(139, 92, 246, 0.15)",
                                                                    color: "#a78bfa",
                                                                    border: "1px solid rgba(139, 92, 246, 0.3)",
                                                                    borderRadius: "4px",
                                                                    fontWeight: "bold"
                                                                }} title="Initiated Checkout">
                                                                    Checkout
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: "0.8rem", opacity: 0.6 }}>{u.email}</div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "1rem", textAlign: "center" }}>
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
                                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                                    {u.hasTakenFreeTest ? (
                                                        <span style={{
                                                            fontSize: "0.75rem",
                                                            padding: "4px 8px",
                                                            background: "rgba(16,185,129,0.15)",
                                                            color: "#10B981",
                                                            border: "1px solid rgba(16,185,129,0.3)",
                                                            borderRadius: "6px",
                                                            fontWeight: "bold"
                                                        }}>
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span style={{
                                                            fontSize: "0.75rem",
                                                            padding: "4px 8px",
                                                            background: "rgba(255,255,255,0.05)",
                                                            color: "rgba(255,255,255,0.5)",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "6px"
                                                        }}>
                                                            No
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                                    {u.status === "Premium" ? (
                                                        <span style={{ color: "#10B981", fontWeight: "bold", fontSize: "0.85rem" }}>Unlimited</span>
                                                    ) : (
                                                        <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                                                            {u.stats.practiceCreditsLeft} / 3 <span style={{ opacity: 0.5, fontSize: "0.75rem" }}>(prac)</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "1rem", color: readyColor, fontWeight: 700, textAlign: "center" }}>
                                                    {u.stats.totalTests > 0 ? `${u.stats.passProbability}%` : "—"}
                                                </td>
                                                <td style={{ padding: "1rem", textAlign: "center", fontWeight: 600 }}>
                                                    {u.stats.averageScore !== null ? `${u.stats.averageScore}%` : "—"}
                                                </td>
                                                <td style={{ padding: "1rem", textAlign: "center" }}>
                                                    {u.stats.totalTests} <span style={{ opacity: 0.5, fontSize: "0.85rem" }}>({u.stats.simulationsCount} sim, {u.stats.practiceCount} prac)</span>
                                                </td>
                                                <td style={{ padding: "1rem", fontSize: "0.85rem", opacity: 0.7, textAlign: "center" }}>
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
                                    {selectedUser.firstName || selectedUser.lastName 
                                        ? `${selectedUser.firstName} ${selectedUser.lastName}`.trim() 
                                        : (selectedUser.email ? selectedUser.email.split('@')[0] : "G1 Candidate")}
                                </div>
                                <div style={{ opacity: 0.6, fontSize: "0.9rem" }}>{selectedUser.email}</div>
                                <div style={{ opacity: 0.4, fontSize: "0.8rem", fontFamily: "monospace" }}>ID: {selectedUser.id}</div>
                                <div style={{ opacity: 0.6, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                                    Auth Method: <strong style={{ textTransform: "capitalize" }}>{selectedUser.provider}</strong>
                                </div>
                                <div style={{ opacity: 0.6, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                                    Landing Free Test: <strong>{selectedUser.hasTakenFreeTest ? "Yes" : "No"}</strong>
                                </div>
                                <div style={{ opacity: 0.6, fontSize: "0.85rem", marginTop: "0.25rem" }}>
                                    Initiated Checkout: <strong>{selectedUser.initiatedCheckout ? "Yes" : "No"}</strong>
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

                                <div>
                                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Toggle Test Account Status:</div>
                                    <button
                                        onClick={() => handleUpdateUser(selectedUser.id, {
                                            isTestAccount: !selectedUser.isTest
                                        })}
                                        disabled={updatingUserId === selectedUser.id}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            background: selectedUser.isTest ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)",
                                            color: selectedUser.isTest ? "#f59e0b" : "rgba(255,255,255,0.7)",
                                            border: `1px solid ${selectedUser.isTest ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.1)"}`,
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: updatingUserId ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        {updatingUserId === selectedUser.id ? "Processing..." :
                                         selectedUser.isTest ? "Unflag Test Account" : "Flag as Test Account"}
                                    </button>
                                </div>

                                <div style={{ marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
                                    <div style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: "0.5rem" }}>Delete User Account (Permanent):</div>
                                    <button
                                        onClick={() => {
                                            setUserToDelete(selectedUser);
                                            setDeleteTextConfirm("");
                                            setShowDeleteModal(true);
                                        }}
                                        disabled={updatingUserId !== null}
                                        style={{
                                            width: "100%",
                                            padding: "0.75rem",
                                            background: "rgba(239, 68, 68, 0.12)",
                                            color: "#ff6b6b",
                                            border: "1px solid rgba(239, 68, 68, 0.25)",
                                            borderRadius: "8px",
                                            fontWeight: 600,
                                            cursor: updatingUserId ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "0.5rem"
                                        }}
                                    >
                                        <Trash2 size={16} />
                                        Delete User Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* User Deletion Confirmation Modal Overlay */}
            {showDeleteModal && userToDelete && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#1f2937", padding: "2.5rem", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", maxWidth: "450px", width: "90%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", color: "#ef4444" }}>
                            <Trash2 size={24} />
                            <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800 }}>Permanently Delete User?</h3>
                        </div>
                        
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: "1.5" }}>
                            Are you absolutely sure you want to delete <strong>{userToDelete.email}</strong>?<br/><br/>
                            This will permanently delete their account and wipe all test progress, history, and settings from the database. <strong>This action cannot be undone.</strong>
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{ fontSize: "0.85rem", opacity: 0.7 }}>Type <strong style={{ color: "white" }}>DELETE</strong> below to confirm:</label>
                            <input
                                type="text"
                                value={deleteTextConfirm}
                                onChange={(e) => setDeleteTextConfirm(e.target.value)}
                                placeholder="DELETE"
                                style={{
                                    width: "100%",
                                    padding: "0.75rem 1rem",
                                    background: "rgba(0,0,0,0.2)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: "8px",
                                    color: "white",
                                    boxSizing: "border-box",
                                    fontSize: "1rem"
                                }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setUserToDelete(null);
                                    setDeleteTextConfirm("");
                                }}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    color: "white",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={deleteTextConfirm !== "DELETE" || updatingUserId !== null}
                                style={{
                                    flex: 1,
                                    padding: "0.75rem",
                                    background: deleteTextConfirm === "DELETE" ? "#ef4444" : "rgba(239, 68, 68, 0.2)",
                                    border: "none",
                                    color: deleteTextConfirm === "DELETE" ? "white" : "rgba(255,255,255,0.4)",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    cursor: deleteTextConfirm === "DELETE" ? "pointer" : "not-allowed"
                                }}
                            >
                                {updatingUserId === userToDelete.id ? "Deleting..." : "Permanently Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
