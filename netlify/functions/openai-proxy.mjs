const RELAY_URL = "https://new.fastaicode.top/v1/chat/completions";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders(),
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders(),
      body: JSON.stringify({ error: { message: "Method not allowed" } }),
    };
  }

  const authorization = event.headers.authorization || event.headers.Authorization;
  if (!authorization) {
    return {
      statusCode: 401,
      headers: corsHeaders(),
      body: JSON.stringify({ error: { message: "Missing Authorization header" } }),
    };
  }

  try {
    const upstream = await fetch(RELAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: event.body || "{}",
    });

    const body = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: {
        ...corsHeaders(),
        "Content-Type": upstream.headers.get("content-type") || "application/json",
      },
      body,
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "Relay request failed",
        },
      }),
    };
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
