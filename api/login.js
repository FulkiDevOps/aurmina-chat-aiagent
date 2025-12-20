// api/login.js
export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // Tu URL de Hugging Face (donde está el main.py)
        const HF_URL = "https://fulkito-aurmina-ai-agent.hf.space/login"; // ⚠️ AJUSTA TU URL

        const response = await fetch(HF_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();

        // Si el backend de Python rechaza (401), rechazamos aquí
        if (!response.ok) return res.status(response.status).json(data);

        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: "Error de conexión con el servidor de IA" });
    }
}