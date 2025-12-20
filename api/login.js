
export default async function handler(req, res) {
    // 1. Manejo de CORS (Vital)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Responder al "ping" del navegador
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // --- CONFIGURACIÓN ---
        const HF_DOMAIN = "https://fulkito-aurmina-ai-agent.hf.space";
        const TARGET_URL = `${HF_DOMAIN}/login`;

        console.log(`🚀 Intentando conectar a: ${TARGET_URL}`);
        console.log("📦 Datos enviados:", JSON.stringify(req.body));

        const response = await fetch(TARGET_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(req.body)
        });

        console.log(`📥 Estado de respuesta HF: ${response.status}`);

        // Verificamos si la respuesta es JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("❌ Error: Hugging Face devolvió HTML o Texto en vez de JSON:", text);
            throw new Error(`HF devolvió formato incorrecto (${response.status}). Posiblemente el servidor está apagado o la URL está mal.`);
        }

        const data = await response.json();

        // Si Hugging Face dice que la contraseña está mal (401), lo pasamos al front
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        // Éxito total
        return res.status(200).json(data);

    } catch (error) {
        console.error("🔥 ERROR CRÍTICO EN VERCEL:", error);
        return res.status(500).json({
            error: "Error interno del servidor Vercel",
            details: error.message
        });
    }
}