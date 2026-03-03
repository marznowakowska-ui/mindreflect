export default async (req) => {
  try {
    const { text, lang = "de", mode = "journal_reflect", topic = "self_reflection" } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
    }

    const languageName = {
      de: "Deutsch",
      en: "English",
      pl: "Polski",
      ru: "Русский",
      es: "Español",
      zh: "中文",
    }[lang] || "Deutsch";

    // --- Safety: crisis quick check (simple heuristic) ---
    // (keine Diagnose, nur Hinweis + Ressourcen)
    const crisisKeywords = [
      "suizid", "suizidal", "ich will nicht mehr leben", "ich bringe mich um", "selbstmord",
      "kill myself", "suicide", "end my life",
      "zabić się", "samobójstwo",
      "покончить с собой", "суицид",
      "matarme", "suicidio",
      "自杀", "结束生命"
    ];
    const lower = text.toLowerCase();
    const crisis = crisisKeywords.some(k => lower.includes(k));

    const crisis_message = crisis
      ? ({
          de: "Wenn du akut in Gefahr bist oder daran denkst, dir etwas anzutun: Bitte rufe sofort den Notruf (112) oder wende dich an einen Krisendienst in deinem Land. Wenn du möchtest, sag mir: Wo bist du (Land/Stadt)? Dann kann ich dir passende Anlaufstellen nennen. Du bist nicht allein.",
          en: "If you feel in immediate danger or might harm yourself: please call your local emergency number right now. If you want, tell me your country/city and I’ll suggest crisis resources. You are not alone.",
          pl: "Jeśli jesteś w bezpośrednim zagrożeniu: zadzwoń na lokalny numer alarmowy. Jeśli chcesz, podaj kraj/miasto – podam odpowiednie wsparcie kryzysowe. Nie jesteś sam/sama.",
          ru: "Если есть риск причинить себе вред: пожалуйста, срочно позвоните в местную службу экстренной помощи. Если скажете страну/город, подскажу ресурсы помощи. Вы не одни.",
          es: "Si estás en peligro inmediato o podrías hacerte daño: llama ahora al número de emergencia local. Si me dices país/ciudad, te sugiero recursos. No estás solo/a.",
          zh: "如果你有立即危险或可能伤害自己：请立刻拨打当地紧急电话。如果你告诉我国家/城市，我可以给你危机支持资源。你不是一个人。"
        }[lang] || null)
      : null;

    // --- Professional system prompts (A) ---
    const baseProfessionalStyle = `
Du bist ein psychologisch geschulter Reflexionsassistent.
Stil: professionell, warm, nicht wertend, klar strukturiert.
WICHTIG:
- keine Diagnosen, keine Therapie-Versprechen, keine medizinische Rechtsberatung
- keine moralische Verurteilung, keine Schuldzuweisung
- arbeite mit offenen Fragen, Ressourcen, und nächsten kleinen Schritten
- schreibe in ${languageName}
Struktur (wenn passend):
1) Kurz-Zusammenfassung (1–2 Sätze)
2) Gefühle/Bedürfnisse (validierend)
3) Muster/Trigger (hypothesenhaft)
4) Perspektivwechsel / neue Deutung
5) Konkrete nächste Schritte (3–6 Bulletpoints)
6) 2–4 sanfte Fragen zum Weiterdenken
`;

    function topicPrompt(t) {
      switch (t) {
        case "self_reflection":
          return `Schwerpunkt: Selbstreflexion. Hilf der Person, innere Prozesse zu klären, ohne zu überfordern.`;
        case "self_awareness":
          return `Schwerpunkt: Selbstwahrnehmung. Arbeite körper- und wahrnehmungsnah: Was genau wurde gespürt, gedacht, gefühlt?`;
        case "self_worth":
          return `Schwerpunkt: Selbstwertgefühl. Arbeite mit innerem Kritiker, Scham/Schuld, Selbstmitgefühl und realistischen Standards.`;
        case "pair_conflict":
          return `Schwerpunkt: Paarkonflikte. Analysiere Eskalationsmuster, Bedürfnisse beider Seiten, Grenzen, Deeskalation, faire Regeln.`;
        case "pair_comms":
          return `Schwerpunkt: Paarkommunikation. Formuliere Ich-Botschaften, aktives Zuhören, konkrete Gesprächsstruktur (Zeit, Ziel, Bitte).`;
        case "pair_sexual":
          return `Schwerpunkt: Sexualität in Beziehung. Respektvoll, einvernehmlich, ohne explizite Details. Fokus: Bedürfnisse, Sicherheit, Kommunikation, Grenzen.`;
        case "freud_model":
          return `Schwerpunkt: Freud (Es–Ich–Über-Ich). Erkläre dynamisch: Es (Triebe), Ich (Vermittler), Über-Ich (Normen/Gewissen). Leite Konflikt, mögliche Kompromisse und reife Ich-Funktionen ab.`;
        case "cbt":
          return `Schwerpunkt: CBT. Nutze kognitive Umstrukturierung:
- Situation (Fakten)
- automatische Gedanken
- Emotionen (0–100)
- Denkfehler
- alternative, hilfreichere Gedanken
- Mini-Experiment / Verhalten
`;
        default:
          return `Schwerpunkt: Allgemeine Reflexion.`;
      }
    }

    function modePrompt(m) {
      switch (m) {
        case "journal_reflect":
          return `Aufgabe: empathische Tagebuch-Reflexion.`;
        case "focus_module":
          return `Aufgabe: Fokus-Analyse passend zum gewählten Schwerpunkt.`;
        case "cbt":
          return `Aufgabe: CBT-Übung (strukturierte Umformulierung + nächste Schritte).`;
        default:
          return `Aufgabe: Reflexion.`;
      }
    }

    const system = `${baseProfessionalStyle}\n${modePrompt(mode)}\n${topicPrompt(topic)}\n`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `${system}\nTEXT:\n${text}`
      })
    });

    const data = await response.json();

    // Robust text extraction
    const out =
      data?.output?.[0]?.content?.[0]?.text ??
      data?.output_text ??
      "";

    return new Response(JSON.stringify({
      output: out,
      crisis,
      crisis_message
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
