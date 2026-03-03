export default async (req) => {
  try {
    const { text, lang } = await req.json();

    const languageMap = {
      de: "Deutsch",
      en: "English",
      pl: "Polski",
      es: "Español",
      ru: "Русский",
      zh: "中文"
    };

    const selectedLanguage = languageMap[lang] || "Deutsch";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `Bitte reflektiere folgenden Text empathisch und professionell in ${selectedLanguage}:

${text}`
      })
    });

    const data = await response.json();

    return new Response(
      JSON.stringify({
        output: data.output?.[0]?.content?.[0]?.text || "Keine Antwort erhalten."
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
};
