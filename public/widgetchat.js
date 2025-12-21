(function() {

    let isOpen = false;
    let sessionId = Math.random().toString(36).substring(7);
    let isLoading = false;
    let messages = [
        { text: "Hi! I'm the Aurmina AI Agent. ¿How can I help you today?", sender: "bot" }
    ];

    const API_URL = "/api/chat";


    // Crear botón flotante
    const launcher = document.createElement("div");
    launcher.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; width: 70px; height: 70px;
        background: #007bff; border-radius: 50%; display: flex;
        justify-content: center; align-items: center; cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 9999;
    `;
    launcher.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/724/724715.png" style="width:40px;height:40px;filter:invert(1);" />`;
    document.body.appendChild(launcher);

    // Crear contenedor del chat
    const chat = document.createElement("div");
    chat.style.cssText = `
        display:none; position: fixed; bottom: 20px; right: 20px;
        width: 400px; height: 500px; background: white; border-radius: 10px;
        border: 1px solid #ccc; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9998; overflow: hidden; font-family: Arial, sans-serif;
        flex-direction: column;
    `;
    // ... (HTML interno del chat igual que antes) ...
    chat.innerHTML = `
        <div style="background:#fff;color:white;padding:10px;display:flex;justify-content:space-between;align-items:center;">
            <span>Asistente Virtual</span>
            <button id="closeChat" style="background:none;border:none;color:white;font-size:16px;cursor:pointer;">✕</button>
        </div>
        <div id="messagesArea" style="flex:1;padding:10px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;"></div>
        <div style="padding:10px;border-top:1px solid #eee;display:flex;">
            <input id="chatInput" placeholder="Escribe aquí..." style="flex:1;padding:8px;border:1px solid #ccc;border-radius:4px;" />
            <button id="sendBtn" style="margin-left:10px;padding:8px 15px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">Enviar</button>
        </div>
    `;
    document.body.appendChild(chat);

    const $messages = chat.querySelector("#messagesArea");
    const $input = chat.querySelector("#chatInput");
    const $send = chat.querySelector("#sendBtn");
    const $close = chat.querySelector("#closeChat");

    function renderMessages() {
        $messages.innerHTML = "";
        messages.forEach(m => {
            const div = document.createElement("div");
            div.style.cssText = `
                max-width:85%; padding:8px 12px; border-radius:15px; line-height:1.4;
                ${m.sender === "user" ? "align-self:flex-end;background:#007bff;color:white;border-radius:15px 15px 0 15px;" : "align-self:flex-start;background:#f1f0f0;color:black;border-radius:15px 15px 15px 0;"}
            `;
            div.innerHTML = m.text; // OJO: Usar una librería de Markdown aquí sería ideal
            $messages.appendChild(div);
        });
        if (isLoading) {
            const loading = document.createElement("div");
            loading.style.cssText = "color:#888;font-style:italic;font-size:0.8rem;";
            loading.textContent = "Typing...";
            $messages.appendChild(loading);
        }
        $messages.scrollTop = $messages.scrollHeight;
    }

    async function sendMessage() {
        if (!$input.value.trim() || isLoading) return;
        const text = $input.value;
        $input.value = "";
        messages.push({ text, sender: "user" });
        isLoading = true;
        renderMessages();

        try {
            // CAMBIO CLAVE: Llamamos a nuestra API de Vercel, NO a HF directo
            // Y borramos el header de Authorization porque el navegador no debe tener el token
            const res = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    texto: text,
                    session_id: sessionId
                })
            });

            const data = await res.json();

            // Verificamos si vino respuesta válida o error
            if (data.error) throw new Error(data.error);

            messages.push({ text: data.respuesta_ia || data.detail || "Respuesta vacía", sender: "bot" });

        } catch (err) {
            console.error(err);
            messages.push({ text: "Error de conexión. Intenta más tarde.", sender: "bot" });
        } finally {
            isLoading = false;
            renderMessages();
        }
    }

    // ... (Eventos onclick igual que antes) ...
    launcher.onclick = () => { launcher.style.display = "none"; chat.style.display = "flex"; isOpen = true; renderMessages(); setTimeout(() => $input.focus(), 100); };
    $close.onclick = () => { chat.style.display = "none"; launcher.style.display = "flex"; isOpen = false; };
    $send.onclick = sendMessage;
    $input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

})();