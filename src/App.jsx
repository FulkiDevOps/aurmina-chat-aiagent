import { useState } from 'react';
import './App.css';

function App() {
    const [token, setToken] = useState(null);

    // Login States
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Chat States
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);

    // --- BOTÓN PARA MINIMIZAR/ABRIR (Opcional, muy útil para widgets) ---
    const [isOpen, setIsOpen] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setToken(data.access_token);
        } catch {
            setError('Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if(!input.trim()) return;
        const text = input;
        setInput('');
        setMessages(prev => [...prev, {role: 'user', text}]);
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', 'X-Auth-Token': token},
                body: JSON.stringify({texto: text, session_id: 'widget-user'})
            });
            if(res.status === 403) { setToken(null); return; } // Token vencido
            const data = await res.json();
            setMessages(prev => [...prev, {role: 'ai', text: data.respuesta_ia}]);
        } catch {
            setMessages(prev => [...prev, {role: 'ai', text: 'Error de red.'}]);
        } finally {
            setSending(false);
        }
    };

    // 🔴 ESTADO 1: SI ESTÁ CERRADO (SOLO MUESTRA UN BOTÓN FLOTANTE)
    if (!isOpen) {
        return (
            <div onClick={() => setIsOpen(true)} style={{
                cursor: 'pointer',
                width: '60px', height: '60px',
                background: '#0070f3', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                color: 'white', fontSize: '30px'
            }}>
                💬
            </div>
        );
    }

    // 🟠 ESTADO 2: ABIERTO PERO SIN LOGIN
    if (!token) {
        return (
            <div className="widget-container">
                <div style={{textAlign:'right', padding:'10px', cursor:'pointer'}} onClick={() => setIsOpen(false)}>✕</div>
                <div className="login-view">
                    <div className="login-icon">🛡️</div>
                    <h3 className="login-title">Acceso Protego</h3>
                    <form onSubmit={handleLogin} style={{width: '100%'}}>
                        <input className="form-input" placeholder="Usuario" value={username} onChange={e=>setUsername(e.target.value)} />
                        <input className="form-input" type="password" placeholder="Pass" value={password} onChange={e=>setPassword(e.target.value)} />
                        <button className="primary-btn" disabled={loading}>{loading ? '...' : 'Entrar'}</button>
                    </form>
                    {error && <p className="error-msg">{error}</p>}
                </div>
            </div>
        );
    }

    // 🟢 ESTADO 3: CHAT ACTIVO
    return (
        <div className="widget-container">
            <header className="chat-header">
                <h3>Agente Aurmina</h3>
                <div style={{display:'flex', gap:'10px'}}>
                    <button className="logout-btn" onClick={() => setToken(null)}>Salir</button>
                    <button className="logout-btn" onClick={() => setIsOpen(false)}>_</button>
                </div>
            </header>

            <div className="messages-area">
                {messages.map((m, i) => (
                    <div key={i} className={`message-bubble ${m.role === 'user' ? 'user-msg' : 'ai-msg'}`}>
                        {m.text}
                    </div>
                ))}
                {sending && <small style={{color:'#999'}}>Escribiendo...</small>}
            </div>

            <div className="input-area">
                <input className="chat-input" value={input} onChange={e=>setInput(e.target.value)} onKeyPress={e=>e.key==='Enter' && handleSend()} placeholder="..." />
                <button onClick={handleSend} style={{background:'none', border:'none', cursor:'pointer'}}>➤</button>
            </div>
        </div>
    );
}

export default App;