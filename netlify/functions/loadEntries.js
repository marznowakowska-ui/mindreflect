exports.handler = async (event) => {
  const entries = [];

  return {
    statusCode: 200,
    body: JSON.stringify({ entries })
  };
};
