import { useState } from 'react';
import './App.css'; // Asegúrate de tener estilos básicos

function App() {
    // Estado para guardar el token (si existe, estamos logueados)
    const [token, setToken] = useState(null);

    // Estados para el formulario de login
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Estados del Chat
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    // --- FUNCIÓN PARA INICIAR SESIÓN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Usamos /api/login gracias al proxy de Vercel
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) throw new Error('Usuario o contraseña incorrectos');

            const data = await response.json();
            // Guardamos el token que nos dio el backend
            setToken(data.access_token);
        } catch (err) {
            setError("❌ Acceso Denegado: " + err.message);
        }
    };

    // --- FUNCIÓN PARA ENVIAR MENSAJE ---
    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 👇 AQUÍ ENVIAMOS EL PASE VIP AL BACKEND
                    'X-Auth-Token': token
                },
                body: JSON.stringify({
                    texto: userMsg,
                    session_id: "sesion-demo-1"
                }),
            });

            if (response.status === 403) {
                alert("Tu sesión ha expirado o no es válida.");
                setToken(null); // Desloguear
                return;
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'ai', text: data.respuesta_ia }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', text: "Error de conexión." }]);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERIZADO CONDICIONAL ---

    // 1. SI NO ESTAMOS LOGUEADOS: MUESTRA EL LOGIN
    if (!token) {
        return (
            <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
                <div style={{ padding: '2rem', background: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '350px' }}>
                    <h2 style={{ textAlign: 'center', color: '#333' }}>🔐 Acceso Protego</h2>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
                        />
                        <button type="submit" style={{ padding: '10px', background: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Ingresar
                        </button>
                    </form>
                    {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
                </div>
            </div>
        );
    }

    // 2. SI ESTAMOS LOGUEADOS: MUESTRA EL CHAT
    return (
        <div className="chat-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>🛡️ Agente Aurmina</h1>
                <button onClick={() => setToken(null)} style={{ padding: '5px 10px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Salir
                </button>
            </header>

            <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '10px', padding: '15px', background: 'white', marginBottom: '15px' }}>
                {messages.map((msg, idx) => (
                    <div key={idx} style={{
                        marginBottom: '10px',
                        textAlign: msg.role === 'user' ? 'right' : 'left'
                    }}>
            <span style={{
                display: 'inline-block',
                padding: '10px 15px',
                borderRadius: '15px',
                background: msg.role === 'user' ? '#0070f3' : '#f1f1f1',
                color: msg.role === 'user' ? 'white' : 'black',
                maxWidth: '70%'
            }}>
              {msg.text}
            </span>
                    </div>
                ))}
                {loading && <p style={{fontStyle: 'italic', color: '#666'}}>Escribiendo...</p>}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe tu consulta..."
                    style={{ flex: 1, padding: '15px', borderRadius: '30px', border: '1px solid #ddd' }}
                />
                <button onClick={handleSendMessage} style={{ padding: '15px 25px', borderRadius: '30px', background: '#0070f3', color: 'white', border: 'none', cursor: 'pointer' }}>
                    Enviar
                </button>
            </div>
        </div>
    );
}

export default App;