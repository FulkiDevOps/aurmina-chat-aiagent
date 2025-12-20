export default async function handler(req, res) {
    // --- 1. CONFIGURACIÓN CORS ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejo de Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Solo se permite POST' });
    }

    try {
        // --- 2. URL DE HUGGING FACE ---
        // IMPORTANTE: Sin barra al final, porque en main.py es @app.post("/login")

        const TARGET_URL = "https://fulkito-aurmina-ai-agent.hf.space/login";

        console.log(`🚀 Conectando a: ${TARGET_URL}`);

        // --- 3. TIMEOUT DE PROTECCIÓN (8 seg) ---
        // Vercel corta a los 10s. Cortamos antes para avisar al usuario.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(TARGET_URL, {
            method: "POST", // <--- Asegúrate que esto esté explícito
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // --- 4. VERIFICACIÓN DE RESPUESTA ---
        const contentType = response.headers.get("content-type");

        // Si devuelve JSON, todo bien (sea éxito o error de credenciales)
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            // Retornamos el status original de HF (200, 401, 403, etc.)
            return res.status(response.status).json(data);
        }

        // Si NO es JSON, es un error de infraestructura (HTML de Sleeping o Error 500 de Python)
        else {
            const text = await response.text();
            console.error("❌ RESPUESTA NO-JSON RECIBIDA:", text.slice(0, 200)); // Logueamos el inicio del HTML

            return res.status(502).json({
                error: "El servidor de IA no respondió correctamente.",
                details: "Es probable que el Space esté 'Sleeping' (dormido). Intenta de nuevo en 30 segundos.",
                raw_response: text.slice(0, 100) // Enviamos un poco del error al front para depurar
            });
        }

    } catch (error) {
        console.error("🔥 ERROR INTERNO VERCEL:", error);

        if (error.name === 'AbortError') {
            return res.status(504).json({ error: "Tiempo de espera agotado. El servidor de IA está despertando." });
        }

        return res.status(500).json({
            error: "Error de conexión en el proxy",
            details: error.message
        });
    }
}