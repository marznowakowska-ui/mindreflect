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

    return new Response(JSON.stringify({output:data.output[0].content[0].text }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
