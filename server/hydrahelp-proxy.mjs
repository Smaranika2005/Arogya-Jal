import http from "node:http";

const port = Number(process.env.PORT || 8787);
const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
const apiKey = process.env.OPENAI_API_KEY;

const systemPrompt = `
You are HydraHelp, the in-app assistant for Arogya Jal.
Your job:
1. Help with waterborne diseases, including causes, symptoms, severity, precautions, recovery, and when to seek medical care.
2. Guide users on how to use Arogya Jal.

When the user provides a list of symptoms, suggest possible waterborne diseases in a cautious way.
Examples may include cholera, typhoid, dysentery, hepatitis A/E, giardiasis, or amoebiasis depending on symptoms.

Rules:
- Do not claim a diagnosis.
- Be concise, practical, and easy to understand.
- If symptoms sound severe, advise urgent medical care.
- If the user asks about the platform, explain the relevant Arogya Jal page or workflow.
- Keep the tone friendly and helpful.
`.trim();

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function normalizeMessages(messages) {
  return Array.isArray(messages)
    ? messages
        .filter((message) => message && typeof message.text === "string")
        .slice(-12)
        .map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.text,
        }))
    : [];
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    });
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/chat") {
    json(res, 404, { error: "Not found" });
    return;
  }

  if (!apiKey) {
    json(res, 500, {
      error:
        "OPENAI_API_KEY is missing. Set it in your environment and restart the HydraHelp API server.",
    });
    return;
  }

  try {
    const body = await readBody(req);
    const messages = normalizeMessages(body.messages);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      json(res, response.status, {
        error: `OpenAI request failed: ${errorText}`,
      });
      return;
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      json(res, 500, { error: "AI returned an empty response." });
      return;
    }

    json(res, 200, { reply });
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : "Unknown server error",
    });
  }
});

server.listen(port, () => {
  console.log(`HydraHelp API server listening on http://localhost:${port}`);
});