exports.handler = async (event) => {

  const data = JSON.parse(event.body);
  const text = data.text;

  return {
    statusCode: 200,
    body: JSON.stringify({
      analysis: "Reflection example: " + text
    })
  };
};
