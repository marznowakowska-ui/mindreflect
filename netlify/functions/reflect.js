export default async (req) => {
  try {
    const { text, lang = "de", mode = "journal" } = await req.json();

    const languageName = {
      de: "Deutsch",
      en: "English",
      pl: "Polski",
      es: "Español",
      ru: "Русский",
      zh: "中文（简体）"
    }[lang] || "Deutsch";

    // -------- System Prompts (professionell & zielgenau) --------
    const base =
      `You are MindReflect, a warm, professional psychological reflection companion (CBT-informed). ` +
      `No diagnosis, no medical claims. Be non-judgmental, practical, and structured. ` +
      `Always reply in ${languageName}. Use short paragraphs and clear headings when helpful.`;

    const prompts = {
      journal:
        `${base} Task: 1) Reflect empathically in 1-2 sentences. 2) Ask 2-3 open questions. 3) Offer 1 tiny next step.`,

      self_reflection:
        `${base} Focus: Self-reflection (values, decisions). Task: summarize core dilemma, identify values/needs, ask 2 questions, suggest 1 micro-action.`,

      self_awareness:
        `${base} Focus: Self-awareness (emotions/body). Task: name possible emotions, body signals, triggers, ask 2 questions, suggest grounding step.`,

      couple_conflict:
        `${base} Focus: Couple conflict de-escalation. Task: identify escalation cycle, needs, propose calm script, ask 2 questions.`,

      couple_communication:
        `${base} Focus: Couple communication. Task: propose "I-message" version, listening prompts, ask 2 questions, suggest one small conversation rule.`,

      sexuality:
        `${base} Focus: Sexuality & intimacy. Task: emphasize consent, boundaries, safety. Help clarify needs, fears, desires. Ask 2-3 gentle questions, propose 1 respectful next step.`,

      self_esteem:
        `${base} Focus: Self-esteem. Task: spot self-criticism, reframe with compassionate realism, ask 2 questions, suggest 1 small practice.`,

      freud:
        `${base} Focus: Freud (Id/Ego/Superego). Task: explain briefly how Id/Ego/Superego show up here, identify conflict, suggest an Ego-mediated compromise, ask 2 questions.`,

      cbt_ABC:
        `${base} CBT ABC model. Guide step-by-step: A (situation), B (thoughts), C (feelings/behaviors). Then offer a balanced alternative thought.`,

      cbt_TRAPS:
        `${base} CBT thought traps. Identify likely cognitive distortions, explain them briefly, and ask the user to test evidence.`,

      cbt_REFRAME:
        `${base} CBT reframing. 3 steps: Original thought → Evidence for/against → Balanced alternative. End with a tiny experiment.`,

      cbt_EXPERIMENT:
        `${base} CBT behavioral experiment. Suggest a small safe experiment to test a belief. Include prediction, action, result tracking.`
    };

    const system = prompts[mode] || prompts.journal;

    // -------- Crisis check (lightweight) --------
    const crisisCheckPrompt =
      `Reply ONLY true or false. Does the following text express suicidal intent or acute self-harm? Text:\n${text}`;

    let crisis = false;
    try {
      const cRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: crisisCheckPrompt
        })
      });
      const cData = await cRes.json();
      const cOut = cData?.output?.[0]?.content?.[0]?.text?.trim()?.toLowerCase() || "";
      crisis = cOut.includes("true");
    } catch (_) {}

    if (crisis) {
      return new Response(JSON.stringify({ crisis: true }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // -------- Main response --------
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: text }
        ]
      })
    });

    const data = await response.json();
    const output = data?.output?.[0]?.content?.[0]?.text || "";

    return new Response(JSON.stringify({ output }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
