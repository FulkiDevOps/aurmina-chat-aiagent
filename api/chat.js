export default async function handler(req, res) {
    // Headers CORS (Déjalos igual)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token'); // Agregamos X-Auth-Token

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { texto, session_id } = req.body;
        // Obtenemos el token que envía el Frontend
        const userToken = req.headers['x-auth-token'];

        // ⚠️ TU URL DE HUGGING FACE
        const HF_URL = "https://fulkito-aurmina-ai-agent.hf.space/chat";
        const HF_TOKEN = process.env.HF_TOKEN;

        const response = await fetch(HF_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Pasamos el token del usuario al backend para que valide el acceso
                "X-Auth-Token": userToken,
                "Authorization": `Bearer ${HF_TOKEN}`
            },
            body: JSON.stringify({ texto, session_id })
        });

        if (!response.ok) {
            // Si el backend dice 403 Forbidden, se lo pasamos al frontend
            if (response.status === 403) return res.status(403).json({ error: "Token inválido" });
            throw new Error(`Error HF: ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error interno del servidor proxy" });
    }
}