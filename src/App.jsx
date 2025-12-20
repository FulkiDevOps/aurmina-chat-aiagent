import { useState } from 'react';
import './App.css';

function App() {
    // --- ESTADOS ---
    // Al iniciar en null, obligamos a ver el Login primero
    const [token, setToken] = useState(null);

    // Estados para el Login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Estados para el Chat
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    // --- FUNCIÓN DE LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoggingIn(true);

        try {
            // Petición al backend para validar usuario
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) throw new Error('Credenciales incorrectas');

            const data = await response.json();
            // ¡AQUÍ OCURRE LA MAGIA!
            // Al guardar el token, React detecta el cambio y muestra el Chat
            setToken(data.access_token);
        } catch (err) {
            setLoginError("Usuario o contraseña incorrectos.");
        } finally {
            setIsLoggingIn(false);
        }
    };

    // --- FUNCIÓN DE CHAT ---
    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        // Agregamos mensaje del usuario visualmente
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsSending(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Enviamos el pase VIP en cada mensaje
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    texto: userMsg,
                    session_id: "sesion-demo-1"
                }),
            });

            if (response.status === 403) {
                alert("Tu sesión expiró.");
                setToken(null); // Esto nos devuelve a la pantalla de Login
                return;
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.respuesta_ia }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Error de conexión." }]);
        } finally {
            setIsSending(false);
        }
    };

    // ==========================================
    // 🚪 PANTALLA 1: EL MURO DE LOGIN
    // ==========================================
    // Si NO hay token, retornamos esto y el código se detiene aquí.
    // El chat NO se renderiza.
    if (!token) {
        return (
            <div className="login-wrapper">
                <div className="login-card">
                    <div className="login-header">
                        <span className="login-icon">🛡️</span>
                        <h2 className="login-title">Protego Aurmina</h2>
                        <p className="login-subtitle">Acceso restringido a personal autorizado</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Usuario</label>
                            <input
                                className="form-input"
                                type="text"
                                placeholder="Ej: aurmina_admin"
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
                            {isLoggingIn ? 'Verificando...' : 'Ingresar al Sistema'}
                        </button>
                    </form>

                    {loginError && <div className="error-msg">{loginError}</div>}
                </div>
            </div>
        );
    }

    // ==========================================
    // 💬 PANTALLA 2: EL CHAT
    // ==========================================
    // Si llegamos aquí, es porque SÍ hay token.
    return (
        <div className="app-container">
            <div className="chat-interface">
                <header className="chat-header">
                    <div className="header-info">
                        <h2>🛡️ Agente Quirúrgico</h2>
                        <span className="status-badge">En línea</span>
                    </div>
                    <button onClick={() => setToken(null)} className="logout-btn">
                        Cerrar Sesión
                    </button>
                </header>

                <div className="messages-area">
                    {messages.length === 0 && (
                        <div className="welcome-placeholder">
                            <span className="placeholder-icon">👋</span>
                            <h3>Bienvenido, Admin</h3>
                            <p>Estoy listo para consultar los protocolos quirúrgicos.</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message-row ${msg.role}`}>
                            <div className="message-bubble">
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isSending && <div className="loading-indicator">Analizando base de datos...</div>}
                </div>

                <div className="input-area">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Escribe tu consulta..."
                        className="chat-input"
                    />
                    <button onClick={handleSendMessage} disabled={isSending} className="send-btn">
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;