import { useState } from 'react';
import './App.css';

function App() {
    // --- ESTADOS ---
    const [token, setToken] = useState(null);

    // Login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false); // Nuevo estado para feedback visual

    // Chat
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    // --- HANDLER: LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true); // Activamos spinner/texto de carga

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) throw new Error('Credenciales incorrectas');

            const data = await response.json();
            setToken(data.access_token);
        } catch (err) {
            setLoginError("Usuario o contraseña incorrectos.");
        } finally {
            setIsLoggingIn(false); // Desactivamos carga pase lo que pase
        }
    };

    // --- HANDLER: CHAT ---
    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsSending(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    texto: userMsg,
                    session_id: "sesion-demo-1"
                }),
            });

            if (response.status === 403) {
                alert("Sesión expirada.");
                setToken(null);
                return;
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.respuesta_ia }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Error de conexión con el agente." }]);
        } finally {
            setIsSending(false);
        }
    };

    // --------------------------------------------------------
    // VISTA 1: LOGIN (Si no hay token)
    // --------------------------------------------------------
    if (!token) {
        return (
            <div className="login-wrapper">
                <div className="login-card">
                    <div className="login-header">
                        <span className="login-icon">🛡️</span>
                        <h2 className="login-title">Protego Aurmina</h2>
                        <p style={{color: '#888', fontSize: '0.9rem', marginTop: '5px'}}>Acceso Seguro al Agente IA</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Usuario</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Ej: admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Contraseña</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={isLoggingIn}>
                            {isLoggingIn ? 'Verificando...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    {loginError && <div className="error-msg">{loginError}</div>}
                </div>
            </div>
        );
    }

    // --------------------------------------------------------
    // VISTA 2: CHAT (Si hay token)
    // --------------------------------------------------------
    return (
        <div className="chat-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            {/* Aquí puedes usar el mismo estilo que te di antes o mejorarlo */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                <h2 style={{color: '#333'}}>🛡️ Agente Aurmina</h2>
                <button onClick={() => setToken(null)} style={{ padding: '8px 15px', background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', borderRadius: '6px', cursor: 'pointer' }}>
                    Cerrar Sesión
                </button>
            </header>

            <div style={{ height: '500px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '12px', padding: '20px', background: 'white', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                {messages.length === 0 && (
                    <div style={{textAlign: 'center', color: '#999', marginTop: '150px'}}>
                        <span style={{fontSize: '2rem'}}>👋</span>
                        <p>Hola, soy tu asistente quirúrgico.<br/>¿En qué puedo ayudarte hoy?</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        marginBottom: '15px',
                        textAlign: msg.role === 'user' ? 'right' : 'left'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            padding: '12px 18px',
                            borderRadius: '18px',
                            borderBottomRightRadius: msg.role === 'user' ? '4px' : '18px',
                            borderTopLeftRadius: msg.role === 'ai' ? '4px' : '18px',
                            background: msg.role === 'user' ? '#0070f3' : '#f4f6f8',
                            color: msg.role === 'user' ? 'white' : '#333',
                            maxWidth: '75%',
                            lineHeight: '1.5',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isSending && <p style={{fontStyle: 'italic', color: '#999', fontSize: '0.9rem', marginLeft: '10px'}}>Analizando documentación...</p>}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe tu consulta sobre protocolos..."
                    style={{ flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' }}
                />
                <button onClick={handleSendMessage} disabled={isSending} style={{ padding: '0 30px', borderRadius: '12px', background: isSending ? '#ccc' : '#0070f3', color: 'white', border: 'none', cursor: isSending ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                    Enviar
                </button>
            </div>
        </div>
    );
}

export default App;