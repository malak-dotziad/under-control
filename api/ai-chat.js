export const config = {
  api: {
    bodyParser: true,
  },
};

const systemPrompt = [
  "You are a gentle, supportive, non-clinical mental wellness companion.",
  "Offer empathetic, practical suggestions and short grounding exercises.",
  "Do not diagnose or present yourself as a therapist or medical professional.",
  "If the user expresses self-harm or immediate danger, encourage reaching out to local emergency services or a trusted person.",
  "Keep responses concise and warm."
].join(" ");

function extractText(responseJson) {
  if (!responseJson) return "";
  if (typeof responseJson.output_text === "string") return responseJson.output_text;
  const output = responseJson.output || [];
  for (const item of output) {
    const content = item?.content || [];
    for (const c of content) {
      if (c?.type === "output_text" && typeof c.text === "string") {
        return c.text;
      }
    }
  }
  return "";
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message is required" });
  }

  const input = [
    {
      role: "system",
      content: [{ type: "input_text", text: systemPrompt }],
    },
  ];

  if (Array.isArray(history)) {
    for (const h of history.slice(-6)) {
      if (!h || !h.role || !h.text) continue;
      input.push({
        role: h.role === "assistant" ? "assistant" : "user",
        content: [{ type: "input_text", text: String(h.text) }],
      });
    }
  }

  input.push({
    role: "user",
    content: [{ type: "input_text", text: message }],
  });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        input,
        temperature: 0.7,
        max_output_tokens: 220,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    const text = extractText(data) || "I’m here with you. Want to share a bit more?";
    return res.status(200).json({ text });
  } catch (err) {
    console.error("AI request failed:", err?.message || err);
    return res.status(500).json({ error: "AI request failed" });
  }
}
