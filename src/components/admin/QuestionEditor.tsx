"use client";

import { useState, useEffect } from "react";
import { Save, Check, X, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { createBrowserClient } from '@supabase/ssr';

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
}

export default function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
    const [formData, setFormData] = useState<Question>({ ...question });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
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
        setUploading(true);
        setError(""); // Clear previous errors

        console.log("Starting upload for:", file.name);

        // Use fresh client
        const tempSupabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload directly to Supabase Storage
            const { error: uploadError } = await tempSupabase.storage
                .from('question-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Supabase Storage Error:", uploadError);
                throw uploadError;
            }

            // Get Public URL
            const { data: { publicUrl } } = tempSupabase.storage
                .from('question-images')
                .getPublicUrl(filePath);

            console.log("Image uploaded:", publicUrl);
            setFormData({ ...formData, media_url: publicUrl });

        } catch (err: any) {
            console.error("Upload error:", err);
            setError("Failed to upload image: " + (err.message || JSON.stringify(err)));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        setError("");
        setSuccess(false);

        console.log("Attempting to save question:", formData);

        // Use fresh client
        const tempSupabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        try {
            // Create a timeout promise to detect hangs
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out - check network or RLS policies")), 10000)
            );

            // Perform the update
            const updatePromise = tempSupabase
                .from('questions')
                .update({
                    text: formData.text,
                    options: formData.options,
                    correct_index: formData.correct_index,
                    explanation: formData.explanation,
                    category: formData.category,
                    chapter: formData.chapter,
                    is_validated: formData.is_validated,
                    media_url: formData.media_url
                })
                .eq('id', formData.id);

            // Race them
            const { error: updateError } = await Promise.race([updatePromise, timeoutPromise]) as any;

            if (updateError) {
                console.error("Supabase Update Error:", updateError);
                throw updateError;
            }

            console.log("Save successful");
            setSuccess(true);
            setTimeout(() => {
                onSave();
            }, 1000);
        } catch (err: any) {
            console.error("Save caught error:", err);
            setError(err.message || "Failed to save");
        } finally {
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
                                disabled={uploading}
                                style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255,255,255,0.7)',
                                    cursor: 'pointer'
                                }}
                            />
                            {uploading && <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', color: 'var(--primary)' }}>Uploading...</span>}
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

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={onCancel} disabled={loading} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} disabled={loading} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                </div>

            </div>
        </div>
    );
}
