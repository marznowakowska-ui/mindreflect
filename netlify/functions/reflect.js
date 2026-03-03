export default async (request, context) => {
  try {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { text, lang = "de", mode = "reflect" } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const languageMap = {
      de: "Deutsch",
      en: "English",
      pl: "Polski",
      es: "Español",
      ru: "Русский",
      zh: "中文",
    };

    const outLang = languageMap[lang] || "Deutsch";

    // Professional, structured psychological assistant (non-medical)
    const system = `
You are MindReflect, a supportive, professional psychological reflection assistant.
IMPORTANT:
- You are NOT a doctor/therapist and you do NOT provide medical diagnosis.
- You help with self-reflection, emotion labeling, perspective taking, communication, and practical exercises.
- Be trauma-informed, respectful, non-judgmental.
- If the user expresses self-harm, suicide, or immediate danger: respond with a brief, caring crisis message + suggest local emergency services and trusted contacts. Keep it short and direct.

OUTPUT FORMAT:
Return ONLY valid JSON (no markdown, no extra text). Schema:

{
  "crisis": boolean,
  "title": string,
  "summary": string,
  "emotion_check": { "primary": string, "intensity_0_10": number, "secondary": string },
  "themes": string[],
  "analysis": {
    "cbt": {
      "situation": string,
      "thoughts": string[],
      "feelings": string[],
      "body": string[],
      "behaviors": string[],
      "cognitive_distortions": string[],
      "alternative_view": string
    },
    "self_worth": { "core_belief_guess": string, "reframe": string },
    "relationship": { "dynamic": string, "needs": string[], "communication_tip": string },
    "freud": { "id": string, "ego": string, "superego": string, "conflict": string }
  },
  "reflection_questions": string[],
  "exercise": { "name": string, "steps": string[], "time_minutes": number },
  "next_micro_step": string
}

MODE:
- mode="reflect": general reflection
- mode="cbt": emphasize CBT structure + distortions
- mode="focus": pick a relevant focus area and go deeper (Selbstreflexion, Selbstwahrnehmung, Paarkonflikte, Paarkommunikation, Sexualität, Selbstwertgefühl, Freud Id/Ego/Superego)

LANGUAGE: Respond in ${outLang}.
STYLE: concise but warm, professional tone, concrete steps, no fluff.
`;

    const userPrompt = `
User language: ${outLang}
Selected mode: ${mode}

User text:
${text}

Task:
1) Detect crisis risk (self-harm / suicide / immediate danger). If present, set crisis=true and provide short crisis guidance inside JSON.
2) Otherwise: Provide a professional structured reflection using CBT + self-worth + relationship + Freud model, adapted to the user's text.
3) Keep all fields filled. If something is unknown, make a gentle best-guess and label as such.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        // Helps force JSON-only output:
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "Upstream error", details: errText }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // OpenAI Responses API typically returns the model text in output[0].content[0].text
    const raw =
      data?.output?.[0]?.content?.[0]?.text ||
      data?.output_text ||
      "";

    // raw should already be JSON string, but we hard-guard parse:
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // fallback: return raw as output
      parsed = { crisis: false, title: "Antwort", summary: raw };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error", details: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
