import Link from 'next/link';
import styles from '../page.module.css';

export default function SimulationIntro() {
    return (
        <main className={styles.main}>
            <div className="glass-panel" style={{ padding: '3rem', maxWidth: '800px', width: '100%', textAlign: 'center' }}>
                <h1 style={{ marginBottom: '1.5rem', fontSize: '2.5rem' }}>G1 Test Simulation</h1>

                <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Exam Rules:</h3>
                    <ul style={{ listStyle: 'none', lineHeight: '2' }}>
                        <li>⏱️ <strong>Time Limit:</strong> None (Stopwatch provided)</li>
                        <li>📝 <strong>Questions:</strong> 40 Total (20 Rules of the Road, 20 Road Signs)</li>
                        <li>🚫 <strong>Feedback:</strong> No immediate answers. Results at the end.</li>
                        <li>✅ <strong>Passing Score:</strong> You need 16/20 in EACH section to pass.</li>
                    </ul>
                </div>

                <Link href="/quiz/simulation" className="btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 2rem' }}>
                    Start G1 Simulation
                </Link>

                <div style={{ marginTop: '1.5rem' }}>
                    <Link href="/" style={{ opacity: 0.7 }}>Cancel</Link>
                </div>
            </div>
        </main>
    );
}
