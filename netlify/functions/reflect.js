export default async (req) => {
  try {
    const { text, lang = "de", mode = "journal", topic = "" } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
    }

    // Language instruction (UI language)
    const LANG_MAP = {
      de: "German",
      en: "English",
      pl: "Polish",
      es: "Spanish",
      ru: "Russian",
      zh: "Simplified Chinese",
    };
    const langName = LANG_MAP[lang] || "German";

    // Base system style (safe, no diagnosis)
    const BASE_SYSTEM = `
You are MindReflect, an empathetic psychological companion (CBT-informed).
Rules:
- No diagnoses, no medical claims.
- Be warm, respectful, non-judgmental.
- Be practical: reflect + ask 2-4 good questions.
- Keep it concise but helpful.
- Respond in ${langName}.
`;

    // Mode/topic instructions
    function buildInstruction() {
      if (mode === "journal") {
        return `
Task:
1) Reflect back in 1 empathic sentence what you understood.
2) Offer 2–3 open reflection questions.
3) Add 1 small gentle next step (very small, realistic).
`;
      }

      if (mode === "cbt") {
        const CBT = {
          ABC: `Apply the ABC model step-by-step: A=Situation, B=Thoughts/Beliefs, C=Feelings/Consequences. Ask clarifying questions if needed.`,
          TRAPS: `Identify possible cognitive distortions (thought traps). Explain them briefly and propose a more balanced perspective.`,
          REFRAME: `Do 3 steps: Original thought → evidence for/against → balanced alternative thought.`,
          EXPERIMENT: `Propose a small behavioral experiment to test an assumption. Make it safe, tiny, and measurable.`,
        };
        return `
Task (CBT):
${CBT[topic] || "Use CBT structure step-by-step."}
Output format:
- Steps with short headings
- End with 2 questions
`;
      }

      // Focus topics
      const TOPICS = {
        SELF_REFLECTION: `Focus: self-reflection. Gently mirror patterns, values, needs. Ask 3 insightful questions.`,
        SELF_AWARENESS: `Focus: self-awareness. Explore emotions, body signals, needs, and triggers. Suggest 1 grounding exercise.`,
        COUPLE_CONFLICT: `Focus: couple conflict. De-escalation, needs, fair boundaries. Offer a calm next step and 2 communication phrases.`,
        COUPLE_COMM: `Focus: couple communication. Craft an "I-statement" + a clear request. Suggest active listening.`,
        SEXUALITY: `Focus: sexuality. Be respectful and safety-focused. Explore desires, boundaries, consent. Offer 2 gentle questions.`,
        SELF_WORTH: `Focus: self-worth. Reduce self-criticism, build self-compassion. Provide a balanced reframe + 1 tiny practice.`,
        FREUD_ID_EGO_SUPEREGO: `Focus: Freud's Id–Ego–Superego (Es–Ich–Über-Ich). Identify the voices (wants/needs, reality mediator, moral demands). Help strengthen ego balance and propose one integrative step.`,
      };

      return `
Task (Focus Topic):
${TOPICS[topic] || "Provide topic-based reflection."}
Structure:
1) Empathic reflection (1–2 sentences)
2) 2–4 bullet insights
3) 2–4 open questions
4) 1 tiny next step
`;
    }

    const instruction = buildInstruction();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: BASE_SYSTEM + "\n" + instruction },
          { role: "user", content: text },
        ],
      }),
    });

    const data = await response.json();

    // Robust extraction (Responses API can vary slightly)
    let out = "";
    try {
      out = data.output?.[0]?.content?.[0]?.text || "";
    } catch (e) {
      out = "";
    }

    if (!out) {
      // Fallback: return whole JSON if needed (but keep minimal)
      return new Response(JSON.stringify({ output: "No output from model." }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ output: out }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
