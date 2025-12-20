
export default async function handler(req, res) {
    // 1. CORS (Para que no te bloquee)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        console.log("🔵 Iniciando intento de login desde Vercel...");

        // 👇 IMPORTANTE: CAMBIA ESTO POR TU URL REAL DE HUGGING FACE
        // Debe terminar en .hf.space (sin /login al final, eso lo agrego abajo)
        const HF_BASE_URL = "https://fulkito-aurmina-ai-agent.hf.space";
        const TARGET_URL = `${HF_BASE_URL}/login`;

        console.log(`📡 Conectando a: ${TARGET_URL}`);

        const response = await fetch(TARGET_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });

        console.log(`📥 Respuesta recibida. Status: ${response.status}`);

        // Verificamos que la respuesta sea JSON antes de intentar leerla
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textBody = await response.text();
            console.error("❌ Error: Hugging Face no devolvió JSON:", textBody);
            throw new Error(`Hugging Face devolvió algo que no es JSON (Posiblemente un error HTML 404 o 500). Status: ${response.status}`);
        }

        const data = await response.json();

        if (!response.ok) {
            console.warn("⚠️ Login rechazado por el backend:", data);
            return res.status(response.status).json(data);
        }

        console.log("✅ Login exitoso.");
        return res.status(200).json(data);

    } catch (error) {
        console.error("🔥 ERROR CRÍTICO EN VERCEL FUNCTION:", error);
        return res.status(500).json({
            error: "Error interno del proxy Vercel",
            details: error.message
        });
    }
}