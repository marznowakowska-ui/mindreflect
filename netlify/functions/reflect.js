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
        input: `Analysiere den folgenden Text tiefenpsychologisch.

Schritte der Analyse:

1. Sprache erkennen  
Bestimme zuerst die Sprache des Textes.

WICHTIG:
Die gesamte Analyse muss vollständig in dieser Sprache sein.
Wenn der Text Spanisch ist, antworte nur auf Spanisch.
Wenn der Text Polnisch ist, antworte nur auf Polnisch.
Wenn der Text Englisch ist, antworte nur auf Englisch.
Verwende niemals Deutsch, außer der Text ist Deutsch.
2. Kurze Zusammenfassung  
Fasse die Situation kurz zusammen.

3. Emotionale Analyse  
Welche Emotionen sind im Text erkennbar? (z.B. Angst, Wut, Traurigkeit, Schuld, Unsicherheit).

4. Analyse nach Freud  
- Es (Id): Welche Wünsche, Bedürfnisse oder Ängste wirken hier?
- Ich (Ego): Wie versucht die Person mit der Realität umzugehen?
- Über-Ich (Superego): Welche inneren Regeln, Schuldgefühle oder Erwartungen wirken?

5. Psychologische Interpretation  
Erkläre mögliche innere Konflikte, unbewusste Dynamiken und Spannungen zwischen Es, Ich und Über-Ich.

6. Kognitive Analyse (CBT)  
Welche Gedankenmuster oder Denkfehler könnten vorhanden sein?

7. Vorschläge  
Gib konkrete, hilfreiche psychologische Vorschläge zur Selbstreflexion und zum Umgang mit der Situation.

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
