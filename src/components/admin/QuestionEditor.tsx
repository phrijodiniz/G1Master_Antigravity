"use client";

import { useState, useEffect } from "react";
import { Save, Check, X, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";


interface Question {
    id: string;
    text: string;
    options: string[]; // It's actually a JSON string/array in DB, we'll parse it
    correct_index: number;
    category: string;
    chapter: string;
    explanation: string;
    is_validated: boolean;
    media_url?: string;
}

interface QuestionEditorProps {
    question: Question;
    onSave: () => void;
    onCancel: () => void;
    onDelete?: () => void;
}

export default function QuestionEditor({ question, onSave, onCancel, onDelete }: QuestionEditorProps) {
    const [formData, setFormData] = useState<Question>({ ...question });
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(""); // "" | "Preparing..." | "Uploading..." | "Finishing..."
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Make sure options is an array (handle if it came as string from some legacy path, though supbase returns JSONB as object/array usually)
    // Actually, looking at schema, it is jsonb.
    // We'll trust it's an array of strings.

    const handleOptionChange = (idx: number, val: string) => {
        const newOptions = [...(formData.options || [])];
        newOptions[idx] = val;
        setFormData({ ...formData, options: newOptions });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        setUploadStatus("Preparing...");
        setError(""); // Clear previous errors

        console.log("Starting upload for:", file.name, "Size:", file.size, "bytes");
        const uploadStart = performance.now();


        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;


            // 1. Get Signed Upload URL (Server-Side)
            const signRes = await fetch('/api/admin/questions/sign-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });

            if (!signRes.ok) {
                const errorData = await signRes.json();
                throw new Error(errorData.error || "Failed to get signed URL");
            }

            const { signedUrl } = await signRes.json();

            setUploadStatus("Uploading...");

            // 2. Upload via standard fetch
            const uploadRes = await fetch(signedUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                    'cache-control': '3600'
                }
            });

            if (!uploadRes.ok) {
                throw new Error(`Upload failed with status: ${uploadRes.status}`);
            }

            setUploadStatus("Finishing...");

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('question-images')
                .getPublicUrl(filePath);

            console.log("Image uploaded:", publicUrl);

            // Force browser to reload image by appending timestamp
            const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
            setFormData({ ...formData, media_url: publicUrlWithTimestamp });

        } catch (err: any) {
            console.error("Upload error:", err);
            setError("Failed to upload image: " + (err.message || JSON.stringify(err)));
        } finally {
            setUploadStatus("");
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");
        setSuccess(false);

        const startTime = Date.now();
        console.log(`[${new Date().toISOString()}] Attempting to save question. ID: ${formData.id}`);
        console.log("Saving payload - is_validated:", formData.is_validated);

        try {
            // Create a timeout promise to detect hangs - INCREASED TO 20s
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out - check network or RLS policies")), 20000)
            );

            // Perform the update via API Route
            const updatePromise = fetch('/api/admin/questions/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: formData.id,
                    text: formData.text,
                    options: formData.options,
                    correct_index: formData.correct_index,
                    explanation: formData.explanation,
                    category: formData.category,
                    chapter: formData.chapter,
                    is_validated: formData.is_validated,
                    media_url: formData.media_url
                }),
            }).then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || `Server returned ${res.status}`);
                }
                return res.json();
            });

            // Race them
            await Promise.race([updatePromise, timeoutPromise]);

            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] Save successful. Duration: ${duration}ms`);

            setSuccess(true);
            setTimeout(() => {
                onSave();
            }, 1000);
        } catch (err: any) {
            const duration = Date.now() - startTime;
            console.error(`[${new Date().toISOString()}] Save FAILED after ${duration}ms. Error:`, err);
            setError(err.message || "Failed to save");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch('/api/admin/questions/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: formData.id }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Server returned ${res.status}`);
            }

            console.log("Delete successful");
            if (onDelete) onDelete();

        } catch (err: any) {
            console.error("Delete failed:", err);
            setError(err.message || "Failed to delete");
            setLoading(false);
        }
    };

    const toggleValidated = async () => {
        // Just toggle the validated state locally for the form, user must click Save to persist?
        // OR persist immediately. Let's make it part of the form state for now.
        setFormData({ ...formData, is_validated: !formData.is_validated });
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', border: '1px solid var(--primary)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h3>Edit Question</h3>
                <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>

            {error && <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>{error}</div>}
            {success && <div style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Check size={16} /> Saved Successfully!</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Meta Fields */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Category</label>
                        <input
                            className="admin-input"
                            value={formData.category || ''}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Chapter</label>
                        <input
                            className="admin-input"
                            value={formData.chapter || ''}
                            onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                            style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                        />
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Image (Optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {formData.media_url && (
                            <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <img src={formData.media_url} alt="Question" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    onClick={() => setFormData({ ...formData, media_url: '' })}
                                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', padding: '2px' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        <div style={{ flex: 1 }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={!!uploadStatus}
                                style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255,255,255,0.7)',
                                    cursor: 'pointer'
                                }}
                            />
                            {uploadStatus && <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', color: 'var(--primary)' }}>{uploadStatus}</span>}
                        </div>
                    </div>
                </div>

                {/* Question Text */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Question Text</label>
                    <textarea
                        value={formData.text}
                        onChange={e => setFormData({ ...formData, text: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', resize: 'vertical' }}
                    />
                </div>

                {/* Options */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Options (Select Correct)</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {formData.options?.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="radio"
                                    name="correct_index"
                                    checked={formData.correct_index === idx}
                                    onChange={() => setFormData({ ...formData, correct_index: idx })}
                                    style={{ accentColor: 'var(--primary)', width: '20px', height: '20px' }}
                                />
                                <input
                                    value={opt}
                                    onChange={e => handleOptionChange(idx, e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Explanation */}
                <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Explanation</label>
                    <textarea
                        value={formData.explanation || ''}
                        onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                        rows={3}
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '4px', resize: 'vertical' }}
                    />
                </div>

                {/* Validation Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.9rem' }}>Status:</label>
                    <button
                        onClick={toggleValidated}
                        type="button"
                        style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '100px',
                            border: 'none',
                            background: formData.is_validated ? 'var(--success)' : '#F59E0B',
                            color: 'black',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        {formData.is_validated ? 'VALIDATED' : 'PENDING REVIEW'}
                    </button>
                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>(Click to toggle)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div>
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.5)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Trash2 size={18} /> Delete
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={onCancel} disabled={loading} className="btn-secondary">Cancel</button>
                        <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
