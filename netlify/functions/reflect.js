export default async (req) => {
  try {
    const { text } = await req.json();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        max_output_tokens: 2000,
        input: `Analysiere den folgenden Text tiefenpsychologisch nach dem Modell von Freud.

Struktur der Antwort:

1. Kurze Zusammenfassung der Situation.

2. Analyse nach Freud:
- Es (Id): Welche Wünsche, Bedürfnisse oder Ängste könnten hier wirken?
- Ich (Ego): Wie versucht die Person mit der Realität umzugehen?
- Über-Ich (Superego): Welche inneren Regeln, Schuldgefühle oder Erwartungen könnten eine Rolle spielen?

3. Psychologische Interpretation:
Erkläre mögliche innere Konflikte, Emotionen und unbewusste Dynamiken.

4. Vorschläge:
Gib konkrete, hilfreiche psychologische Vorschläge zur Selbstreflexion oder zum Umgang mit der Situation.

Antworte in der gleichen Sprache wie der Text.

Text:
${text}`
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
