import { useState, useRef, useEffect } from 'react';
import './App.css';

// --- COMPONENTE 1: PANTALLA DE LOGIN ---
const LoginScreen = ({ onLoginSuccess }) => {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const LOGO_URL = "/Aurmina bubble chat.png";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.detail || 'Credenciales inválidas');

            // Si éxito, pasamos el token al padre
            onLoginSuccess(data.access_token);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {/* La imagen cargará desde la carpeta public */}
                <img src={LOGO_URL} alt="Logo Aurmina" className="brand-logo-img" />

                {/* Estos textos ahora tendrán estilos oscuros gracias al CSS de abajo */}
                <h2 className="login-title">Aurmina Agent</h2>
                <p className="login-subtitle">Acceso to chat with the Aurmina Agent</p>

                <form onSubmit={handleSubmit}>
                    {/* ... inputs y botón ... */}
                    <input
                        className="login-input"
                        placeholder="Usuario"
                        value={user}
                        onChange={e => setUser(e.target.value)}
                    />
                    <input
                        className="login-input"
                        type="password"
                        placeholder="Contraseña"
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                    />
                    <button className="login-btn" disabled={loading}>
                        {loading ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>
                {error && <p className="error-text">{error}</p>}
            </div>
        </div>
    );
};

// --- COMPONENTE 2: CHAT ESTILO TELEGRAM ---
const AurminaChat = ({ token, onLogout }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll al fondo
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const text = input;
        setInput('');
        // Agregamos mensaje usuario
        setMessages(prev => [...prev, { role: 'user', text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }]);
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': token
                },
                body: JSON.stringify({ texto: text, session_id: 'web-session' })
            });

            if (res.status === 403) {
                alert("Sesión caducada");
                onLogout();
                return;
            }

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'ai',
                text: data.respuesta_ia,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: '⚠️ Error de conexión.' }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="telegram-layout">
            {/* Barra Lateral (Opcional, decorativa) */}
            <div className="sidebar">
                <div className="sidebar-header">Aurmina AI</div>
                <div className="contact-item active">
                    <div className="avatar">🤖</div>
                    <div className="contact-info">
                        <div className="name">Agente Quirúrgico</div>
                        <div className="last-msg">En línea</div>
                    </div>
                </div>
            </div>

            {/* Área Principal de Chat */}
            <div className="chat-main">
                <header className="chat-header">
                    <div className="chat-info">
                        <h3>Agente Quirúrgico</h3>
                        <span>bot • en línea</span>
                    </div>
                    <button onClick={onLogout} className="logout-icon-btn">⎋</button>
                </header>

                <div className="chat-background">
                    <div className="messages-list">
                        {messages.length === 0 && (
                            <div className="empty-state">
                                <span>👋 Hola, soy tu asistente. Consulta sobre protocolos, envíos o productos.</span>
                            </div>
                        )}
                        {messages.map((m, i) => (
                            <div key={i} className={`msg-row ${m.role}`}>
                                <div className="msg-bubble">
                                    <div className="msg-text">{m.text}</div>
                                    <div className="msg-time">{m.time}</div>
                                </div>
                            </div>
                        ))}
                        {sending && <div className="msg-row ai"><div className="msg-bubble typing">Escribiendo...</div></div>}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                <div className="input-bar">
                    <input
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        placeholder="Escribir un mensaje..."
                    />
                    <button onClick={handleSend} disabled={sending}>➤</button>
                </div>
            </div>
        </div>
    );
};

// --- APP PRINCIPAL ---
function App() {
    const [token, setToken] = useState(null);

    // Si no hay token, mostramos LOGIN. Si hay, mostramos CHAT.
    if (!token) {
        return <LoginScreen onLoginSuccess={(t) => setToken(t)} />;
    }

    return <AurminaChat token={token} onLogout={() => setToken(null)} />;
}

export default App;