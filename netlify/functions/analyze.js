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

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      analysis: "Reflection example: " + text
    })
  };

};
