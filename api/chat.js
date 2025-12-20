export default async function handler(req, res) {
    // 1. CORS UNIVERSAL (Vital para que el widget funcione en CUALQUIER web)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', ''); // Permite que se use desde cualquier dominio
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejo de "Preflight" (el navegador pregunta antes de enviar)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo aceptamos POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { texto, session_id } = req.body;

        // URL DIRECTA a tu Space Privado (termina en .hf.space)
        const HF_URL = "https://fulkito-aurmina-ai-agent.hf.space/chat";

        const response = await fetch(HF_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Aquí el servidor inyecta el token seguro
                "Authorization": `Bearer ${process.env.HF_TOKEN}`
            },
            body: JSON.stringify({ texto, session_id })
        });

        if (!response.ok) {
            throw new Error(`Error HF: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error interno del servidor proxy" });
    }
}