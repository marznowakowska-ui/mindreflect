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

const replyLanguage = languageMap[lang] || "German";
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

Write the analysis with empathy and psychological depth.
Avoid generic advice and try to understand the emotional meaning behind the text.

Write interpretations carefully as hypotheses, not as diagnoses.
        
The response must be written completely in this language: ${replyLanguage}.

Consider the emotional context and possible patterns in the person's thoughts.
If previous reflections are available, take them into account to identify recurring themes or emotional dynamics.

Focus on understanding the deeper psychological meaning of the text rather than giving quick advice.

Structure the analysis as follows:
1. Language detection
2. Short summary
3. Emotional analysis
4. Freud analysis (Id, Ego, Superego)
5. Psychological interpretation
6. Cognitive analysis (CBT)
7. Suggestions
8. Inner child analysis
9. Psychological patterns
10. Reflection questions
Inner child analysis:
Explore whether the emotions in the text could relate to earlier
emotional experiences or unmet childhood needs.

Describe possible reactions of the "inner child", such as:
fear of rejection, need for safety, desire for approval,
or feelings of abandonment.

Write this carefully as a hypothesis, not as a diagnosis.
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
