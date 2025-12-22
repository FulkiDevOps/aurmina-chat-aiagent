(function() {

    // Limpiamos cualquier rastro previo si recargas el script sin refrescar la página
    const oldLauncher = document.querySelector("#aurmina-launcher");
    if (oldLauncher) oldLauncher.remove();
    const oldChat = document.querySelector("#aurmina-chat");
    if (oldChat) oldChat.remove();

    let isOpen = false;
    let sessionId = Math.random().toString(36).substring(7);
    let isLoading = false;
    let messages = [
        { text: "Hi! I'm the Aurmina AI Agent. How can I help you today?", sender: "bot" }
    ];

    const API_URL = "/api/chat";

    // 1. LAUNCHER (Botón flotante)
    const launcher = document.createElement("div");
    launcher.id = "aurmina-launcher"; // ID para evitar duplicados
    launcher.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; width: 70px; height: 70px;
        background: #007bff; border-radius: 50%; display: flex;
        justify-content: center; align-items: center; cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3); z-index: 9999; transition: transform 0.3s;
    `;
    launcher.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/724/724715.png" style="width:40px;height:40px;filter:invert(1);" />`;
    launcher.onmouseenter = () => launcher.style.transform = "scale(1.1)";
    launcher.onmouseleave = () => launcher.style.transform = "scale(1)";
    document.body.appendChild(launcher);

    // 2. CHAT CONTAINER
    const chat = document.createElement("div");
    chat.id = "aurmina-chat"; // ID para evitar duplicados
    chat.style.cssText = `
        display:none; position: fixed; bottom: 20px; right: 20px;
        width: 400px; height: 500px; background: white; border-radius: 10px;
        border: 1px solid #ccc; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9998; overflow: hidden; font-family: Arial, sans-serif;
        flex-direction: column;
    `;

    chat.innerHTML = `
        <div style="background:#007bff;color:white;padding:15px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:bold;">Virtual Agent</span>
            <button id="closeChat" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;">&times;</button>
        </div>
        <div id="messagesArea" style="flex:1;padding:15px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:#f9f9f9;"></div>
        <div style="padding:15px;border-top:1px solid #eee;display:flex;background:white;">
            <input id="chatInput" type="text" placeholder="Type here..." style="flex:1;padding:10px;border:1px solid #ddd;border-radius:4px;outline:none;" />
            <button id="sendBtn" style="margin-left:10px;padding:10px 20px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;transition:background 0.3s;">Enviar</button>
        </div>
    `;
    document.body.appendChild(chat);

    const $messages = chat.querySelector("#messagesArea");
    const $input = chat.querySelector("#chatInput");
    const $send = chat.querySelector("#sendBtn");
    const $close = chat.querySelector("#closeChat");

    // --- LÓGICA DE BLOQUEO UI ---
    function updateUIState() {
        if (isLoading) {
            $input.disabled = true;           // Deshabilita el input físicamente
            $send.disabled = true;            // Deshabilita el botón
            $input.placeholder = "Waiting for the answer...";
            $send.style.background = "#ccc";
            $send.style.cursor = "not-allowed";
        } else {
            $input.disabled = false;
            $send.disabled = false;
            $input.placeholder = "Type here...";
            $send.style.background = "#007bff";
            $send.style.cursor = "pointer";
            setTimeout(() => $input.focus(), 10);
        }
    }
    function renderTextWithLists(text) {
        // 1. Escapar HTML
        let rendered = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // 2. Convertir saltos de línea dobles en párrafos reales
        // Esto respeta el \n\n que pediste en el System Prompt
        rendered = rendered.split(/\n\n+/).map(para => {
            if (para.trim().startsWith("•")) {
                // Si el bloque es un bullet, lo tratamos como un elemento de lista
                return `<div style="margin-bottom: 12px;">${para.trim()}</div>`;
            }
            return `<p style="margin-bottom: 12px;">${para.trim()}</p>`;
        }).join("");

        // 3. Si quedan saltos de línea simples, los convertimos a br
        rendered = rendered.replace(/\n/g, "<br>");

        return rendered;
    }


    function renderMessages() {
        $messages.innerHTML = "";
        messages.forEach(m => {
            const div = document.createElement("div");
            div.style.cssText = `
                max-width:80%; padding:10px 14px; border-radius:15px; line-height:1.5; font-size:14px;
                ${m.sender === "user" ?
                "align-self:flex-end;background:#007bff;color:white;border-radius:15px 15px 0 15px;" :
                "align-self:flex-start;background:#e9ecef;color:#333;border-radius:15px 15px 15px 0;"}
            `;
            div.innerHTML = renderTextWithLists(m.text);
            $messages.appendChild(div);
        });

        if (isLoading) {
            const loading = document.createElement("div");
            loading.style.cssText = "color:#888;font-style:italic;font-size:12px;margin-left:10px;align-self:flex-start;";
            loading.textContent = "Typing...";
            $messages.appendChild(loading);
        }
        $messages.scrollTop = $messages.scrollHeight;
    }

    async function sendMessage() {
        // DOBLE CHECK DE SEGURIDAD
        if (isLoading) {
            return;
        }
        if (!$input.value.trim()) return;

        const text = $input.value;
        $input.value = "";

        messages.push({ text, sender: "user" });

        isLoading = true; // Activamos bandera
        updateUIState();  // Bloqueamos interfaz visualmente
        renderMessages();

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    texto: text,
                    session_id: sessionId
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            messages.push({ text: data.respuesta_ia || data.detail || "...", sender: "bot" });

        } catch (err) {
            console.error(err);
            messages.push({ text: "Connection error. Please Try later.", sender: "bot" });
        } finally {
            isLoading = false; // Desactivamos bandera
            renderMessages();
            updateUIState();   // Desbloqueamos interfaz
        }
    }

    // --- EVENTOS ---

    launcher.onclick = () => {
        launcher.style.display = "none";
        chat.style.display = "flex";
        isOpen = true;
        renderMessages();
        setTimeout(() => $input.focus(), 100);
    };

    $close.onclick = () => {
        chat.style.display = "none";
        launcher.style.display = "flex";
        isOpen = false;
    };

    $send.onclick = sendMessage;

    // SOLUCIÓN CLAVE PARA EL ENTER:
    // Usamos .onkeydown en lugar de .addEventListener para sobrescribir cualquier listener viejo
    $input.onkeydown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Evita salto de línea o submits extraños

            if (!isLoading) {
                sendMessage();
            } else {
                console.log("Enter ignorado: esperando respuesta...");
            }
        }
    };

})();