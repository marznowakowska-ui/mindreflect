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
        model: "gpt-4.1-mini",
        input: `Bitte reflektiere diesen Text empathisch:\n\n${text}`
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
