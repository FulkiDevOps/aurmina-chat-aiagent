import { useState, useRef, useEffect } from 'react';
import './App.css';

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/724/724715.png";

// --- COMPONENTE CHAT (Lógica Intacta) ---
// Recibimos la propiedad 'onClose' para poder cerrar la ventana
const AurminaChat = ({ onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    // ID de sesión invitado
    const sessionId = useRef('guest-' + Math.random().toString(36).substr(2, 9));

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reseteamos
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Ajustamos
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const text = input;
        setInput('');

        if(textareaRef.current) textareaRef.current.style.height = 'auto';

        setMessages(prev => [...prev, {
            role: 'user',
            text,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
        setSending(true);

        try {
            // MANTENEMOS TU FETCH ORIGINAL QUE FUNCIONA
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
            setMessages(prev => [...prev, { role: 'ai', text: 'Connection error. Please try later.' }]);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) { return; }
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-main widget-mode">
            {/* Header con botón de cerrar agregado */}
            <header className="chat-header">
                <div className="chat-info">
                    <h3>Aurmina Agent</h3>
                    <span>Online Session</span>
                </div>
                {/* Botón X para cerrar el widget */}
                <button onClick={onClose} className="close-widget-btn" title="Cerrar chat">
                    ✕
                </button>
            </header>

            {/* Mensajes */}
            <div className="chat-background">
                <div className="messages-list">
                    {messages.length === 0 && (
                        <div className="empty-state">
                            <span>👋 Hi. How can I help you today?</span>
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
                    {sending && <div className="msg-row ai"><div className="msg-bubble typing">Typing...</div></div>}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="input-bar">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    autoFocus
                />
                <button onClick={handleSend} disabled={sending}>➤</button>
            </div>
        </div>
    );
};

// --- APP PRINCIPAL (Lógica del Widget) ---
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

            {/* 2. Contenedor del Widget (Solo se muestra si isOpen es true) */}
            {isOpen && (
                <div className="widget-container">
                    {/* Pasamos la función para cerrar al componente hijo */}
                    <AurminaChat onClose={() => setIsOpen(false)} />
                </div>
            )}
        </div>
    );
}

export default App;