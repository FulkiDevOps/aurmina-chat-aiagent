export default async function handler(req, res) {
    // --- Configuración CORS (Igual que antes) ---
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Solo POST' });

    try {
        const HF_DOMAIN = "https://fulkito-aurmina-ai-agent.hf.space";
        const TARGET_URL = `${HF_DOMAIN}/login`; // Sin barra al final

        // ⚠️ AQUÍ ESTÁ LA CLAVE: Leer el token de las variables de Vercel
        const HF_TOKEN = process.env.HF_TOKEN;

        if (!HF_TOKEN) {
            console.error("❌ ERROR: No se encontró la variable HF_ACCESS_TOKEN en Vercel");
            return res.status(500).json({ error: "Error de configuración en el servidor (Falta Token)" });
        }

        console.log(`🚀 Conectando a Space Privado: ${TARGET_URL}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const response = await fetch(TARGET_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",

                "Authorization": `Bearer ${HF_TOKEN}`
            },
            body: JSON.stringify(req.body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        // --- Verificación de respuesta ---
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            return res.status(response.status).json(data);
        } else {
            const text = await response.text();
            console.error("❌ RESPUESTA NO-JSON (Probablemente error de Auth):", text.slice(0, 100));
            return res.status(502).json({ error: "Respuesta inválida de HF. Verifica el token y permisos." });
        }

    } catch (error) {
        console.error("🔥 ERROR VERCEL:", error);
        return res.status(500).json({ error: error.message });
    }
}