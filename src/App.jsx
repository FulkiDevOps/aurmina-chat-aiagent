import { useState, useRef, useEffect } from 'react';
import './App.css';

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/724/724715.png";

// --- COMPONENTE CHAT WIDGET ---
const AurminaChat = ({ onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Generamos ID de sesión único para el invitado
    const sessionId = useRef('guest-' + Math.random().toString(36).substr(2, 9));

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const text = input;
        setInput('');

        setMessages(prev => [...prev, {
            role: 'user',
            text,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
        setSending(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: text, session_id: sessionId.current })
            });

            const data = await res.json();
            setMessages(prev => [...prev, {
                role: 'ai',
                text: data.respuesta_ia,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Hi. How can I help you today?' }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="chat-main widget-mode">
            {/* Header */}
            <header className="chat-header">
                <div className="chat-info">
                    <h3>Aurmina Agent</h3>
                    <span>Online</span>
                </div>
                {/* Botón X para cerrar */}
                <button onClick={onClose} className="close-widget-btn" title="Cerrar">
                    ✕
                </button>
            </header>

            {/* Area de Mensajes */}
            <div className="chat-background">
                <div className="messages-list">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <span>👋 Hi. ¿How can I help you today?</span>
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

            {/* Input */}
            <div className="input-bar">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe aquí..."
                    autoFocus
                />
                <button onClick={handleSend} disabled={sending}>➤</button>
            </div>
        </div>
    );
};

// --- APP PRINCIPAL ---
function App() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="app-root">
            {/* 1. Botón Flotante (Launcher) */}
            <button
                className={`launcher-btn ${isOpen ? 'hidden' : ''}`}
                onClick={() => setIsOpen(true)}
            >
                <img src={LOGO_URL} alt="Chat" />
            </button>

            {/* 2. Contenedor del Widget */}
            {isOpen && (
                <div className="widget-container">
                    <AurminaChat onClose={() => setIsOpen(false)} />
                </div>
            )}
        </div>
    );
}

export default App;