exports.handler = async (event) => {

  let text = "No text provided";

  try {
    if (event.body) {
      const data = JSON.parse(event.body);
      text = data.text || text;
    }
  } catch (e) {
    console.log("JSON error", e);
  }

  const apiKey = process.env.OPENAI_API_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Du bist ein psychologischer Reflexionsassistent. Analysiere Texte nach Emotion → Bedürfnis → Perspektive."
        },
        {
          role: "user",
          content: text
        }
      ]
    })
  });

  const data = await response.json();

  const analysis =
    data.choices?.[0]?.message?.content || "Keine Analyse erhalten.";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      analysis
    })
  };
};
