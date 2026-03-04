exports.handler = async (event) => {

  let text = "No text provided";

  if (event.body) {
    const data = JSON.parse(event.body);
    text = data.text || text;
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      analysis: "Reflection example: " + text
    })
  };
};
