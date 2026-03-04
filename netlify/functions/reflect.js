export default async (req) => {
  try {
const { text, lang, mode, topic, history } = await req.json();
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        max_output_tokens: 3000,
        input: `Analyze the following text with deep psychological reflection.

The response must be written completely in this language: ${lang}.

Structure the analysis as follows:
1. Language detection
2. Short summary
3. Emotional analysis
4. Freud analysis (Id, Ego, Superego)
5. Psychological interpretation
6. Cognitive analysis (CBT)
7. Suggestions
8. Psychological patterns
9. Reflection questions

Text:
${text}
`
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
