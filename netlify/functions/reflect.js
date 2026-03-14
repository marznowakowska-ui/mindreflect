export default async (req) => {
  try {
const { text, lang, mode, topic, history } = await req.json();
    const languageMap = {
  de: "German",
  en: "English",
  pl: "Polish",
  ru: "Russian",
  es: "Spanish",
  zh: "Chinese"
};
    const TOPIC_LABELS = {
  de: {
    self_reflection: "Selbstreflexion",
    self_awareness: "Selbstwahrnehmung",
    self_esteem: "Selbstwertgefühl",
    relationship: "Beziehung / Paar",
    freud: "Freud: Es–Ich–Über-Ich"
  },
  en: {
    self_reflection: "Self-reflection",
    self_awareness: "Self-awareness",
    self_esteem: "Self-esteem",
    relationship: "Relationship / Couple",
    freud: "Freud: Id–Ego–Superego"
  }
};

function getTopicLabel(topic, lang = "de") {
  return (TOPIC_LABELS[lang] && TOPIC_LABELS[lang][topic]) ||
         (TOPIC_LABELS.de[topic]) ||
         topic ||
         "Fokus";
}

function extractQuotedAnchors(text, max = 3) {
  if (!text) return [];
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  let parts = cleaned
    .split(/[.!?\n,;:]/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => s.length >= 4 && s.length <= 60);

  if (parts.length < max) {
    const words = cleaned
      .split(/\s+/)
      .map(w => w.replace(/[^\p{L}\p{N}\-äöüÄÖÜß]/gu, ""))
      .filter(Boolean)
      .filter(w => w.length >= 4);

    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`.trim();
      if (phrase.length >= 6 && phrase.length <= 40) parts.push(phrase);
      if (parts.length >= max * 3) break;
    }
  }

  const unique = [];
  for (const p of parts) {
    const norm = p.toLowerCase();
    if (!unique.some(x => x.toLowerCase() === norm)) unique.push(p);
    if (unique.length >= max) break;
  }

  return unique.slice(0, max);
}

function nextStyleVariant(lang = "de") {
  const variants = {
    de: [
      "Formuliere ruhig, präzise und warm. Vermeide Pathos.",
      "Schreibe reflektiert, konkret und psychologisch differenziert.",
      "Antworte textnah, individuell und ohne Standardfloskeln.",
      "Schreibe empathisch, aber nicht belehrend oder schematisch."
    ],
    en: [
      "Write calmly, precisely, and warmly. Avoid pathos.",
      "Write reflectively, concretely, and with psychological nuance.",
      "Respond closely to the text, individually, and without stock phrases.",
      "Write empathetically, but not in a preachy or formulaic way."
    ]
  };

  const list = variants[lang] || variants.de;
  return list[Math.floor(Math.random() * list.length)];
}

function buildJournalPrompt(text, lang = "de") {
  const anchors = extractQuotedAnchors(text, 3);
  const quoted = anchors.length
    ? anchors.map(a => `- "${a}"`).join("\n")
    : '- Keine klaren Schlüsselphrasen gefunden';

  const styleVariant = nextStyleVariant(lang);

  if (lang === "de") {
    return `
Du bist ein tiefenpsychologisch und emotional sensibler Reflexionsassistent für eine psychologische App.

Analysiere den folgenden Tagebuchtext ausschließlich anhand der konkret genannten Situation. Bleibe nah am Wortlaut und an den emotionalen Signalen im Text. Vermeide allgemeine Standardfloskeln, Wiederholungen und lehrbuchhafte Phrasen.

Wichtige Regeln:
- Beziehe dich auf die konkreten Inhalte dieses Textes, nicht auf allgemeine Theorien.
- Nenne nur Beobachtungen, die sich wirklich aus dem Text ableiten lassen.
- Wenn etwas unklar ist, formuliere es als vorsichtige Hypothese, nicht als Tatsache.
- Keine moralische Bewertung, keine Belehrung.
- Formuliere jede Antwort sprachlich neu und vermeide austauschbare Standardsätze.
- Wiederhole nicht dieselben Satzanfänge oder dieselbe Standardstruktur wie in früheren Antworten.
- Zitiere 1 bis 3 kurze Schlüsselwörter oder Formulierungen aus dem Text und beziehe deine Analyse daran.
- ${styleVariant}

Diese Formulierungen aus dem Text sind besonders wichtig:
${quoted}

Struktur:
1. Kurze individuelle Spiegelung in 2–4 Sätzen
2. Emotionale Dynamik
3. Innere Widersprüche oder Konflikte
4. Tiefere Bedeutung
5. 3 sehr spezifische Reflexionsfragen

Text:
"""${text}"""
`.trim();
  }

  return `
You are a psychologically sensitive reflection assistant for a mental wellness app.

Analyze the following journal text strictly on the basis of the concrete situation described. Stay close to the wording and emotional signals in the text. Avoid generic stock phrases, repetition, and textbook-style wording.

Rules:
- Focus on the specific content of this text.
- Only mention observations that can truly be inferred from the text.
- If something is unclear, phrase it as a cautious hypothesis.
- No moral judgment, no lecturing.
- Write each answer in a fresh way and avoid interchangeable standard phrases.
- Do not repeat the same sentence openings or the same response structure as before.
- Quote 1 to 3 short keywords or formulations from the text and connect your analysis to them.
- ${styleVariant}

Important phrases from the text:
${quoted}

Structure:
1. Short individualized reflection
2. Emotional dynamics
3. Inner contradictions or conflicts
4. Deeper meaning
5. 3 highly specific reflection questions

Text:
"""${text}"""
`.trim();
}

function buildFocusPrompt(text, topic, lang = "de") {
  const anchors = extractQuotedAnchors(text, 3);
  const quoted = anchors.length
    ? anchors.map(a => `- "${a}"`).join("\n")
    : '- Keine klaren Schlüsselphrasen gefunden';

  const styleVariant = nextStyleVariant(lang);
  const topicLabel = getTopicLabel(topic, lang);

  if (lang === "de") {
    return `
Du bist ein präziser psychologischer Analyseassistent in einer Reflexions-App.

Analysiere den Text nur aus Sicht des ausgewählten Fokusbereichs: ${topicLabel}.

Wichtige Regeln:
- Bleibe eng beim gewählten Fokusmodul.
- Vermeide allgemeine Rundum-Analysen.
- Nutze konkrete Formulierungen aus dem Text.
- Wenn Informationen fehlen, erfinde nichts.
- Formuliere jede Antwort sprachlich neu und vermeide austauschbare Standardsätze.
- Wiederhole nicht dieselben Satzanfänge oder dieselbe Standardstruktur wie in früheren Antworten.
- Zitiere 1 bis 3 kurze Schlüsselwörter oder Formulierungen aus dem Text und beziehe deine Analyse daran.
- ${styleVariant}

Diese Formulierungen aus dem Text sind besonders wichtig:
${quoted}

Struktur:
1. Kurze textnahe Einordnung
2. Was ist in Bezug auf ${topicLabel} besonders auffällig?
3. Welche psychologischen Muster oder Dynamiken könnten eine Rolle spielen?
4. Was wäre ein hilfreicher nächster Reflexionsschritt?
5. 3 kurze, gezielte Fragen passend zu diesem Fokus

Text:
"""${text}"""
`.trim();
  }

  return `
You are a precise psychological analysis assistant in a reflection app.

Analyze the text only from the perspective of the selected focus area: ${topicLabel}.

Rules:
- Stay close to the selected focus module.
- Avoid broad all-purpose analyses.
- Use concrete wording from the text.
- If information is missing, do not invent anything.
- Write each answer in a fresh way and avoid interchangeable standard phrases.
- Do not repeat the same sentence openings or the same response structure as before.
- Quote 1 to 3 short keywords or formulations from the text and connect your analysis to them.
- ${styleVariant}

Important phrases from the text:
${quoted}

Structure:
1. Short text-based framing
2. What is especially noticeable here in relation to ${topicLabel}?
3. Which psychological patterns or dynamics might be relevant?
4. What could be a helpful next reflection step?
5. 3 short, targeted questions matching this focus

Text:
"""${text}"""
`.trim();
}

const replyLanguage = languageMap[lang] || "German";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_output_tokens: 1800,
       input: mode === "journal_reflect"
  ? buildJournalPrompt(text, lang || "de")
  : buildFocusPrompt(text, topic || "self_reflection", lang || "de"),
      })
        
})
    });

    const data = await response.json();

    console.log("OpenAI full response:", JSON.stringify(data));

    let outputText = "Keine Antwort erhalten.";

    if (data.output && data.output.length > 0) {
      const first = data.output[0];
      if (first.content && first.content.length > 0) {
        outputText = first.content[0].text;
      }
    }

    return new Response(JSON.stringify({ output: outputText }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Server error:", error);
    return new Response(JSON.stringify({ error: "Server error", details: String(error) }), {
      status: 500
    });
  }
};
