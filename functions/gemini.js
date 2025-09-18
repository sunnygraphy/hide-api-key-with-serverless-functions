const fetch = require("node-fetch");

// Gemini API의 실제 엔드포인트 주소입니다.
const GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com";

exports.handler = async (event) => {
  // 클라이언트에서 허용할 Origin을 설정합니다.
  // Netlify 환경변수 HOST에 설정된 값을 사용합니다. (예: https://my-firebase-app.web.app)
  const headers = {
    "Access-Control-Allow-Origin": process.env.HOST,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };

  // OPTIONS 메서드 요청(preflight)에 대한 처리
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers,
      body: "",
    };
  }

  // POST 요청이 아닌 경우 에러 처리
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  // Netlify에 설정한 Gemini API 키를 가져옵니다.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "API key is not configured." }),
    };
  }

  // 클라이언트 요청 경로와 쿼리 파라미터를 조합하여 실제 Gemini API URL을 만듭니다.
  const url = new URL(event.path.replace(/^\/gemini/, ""), GEMINI_API_ENDPOINT);
  url.searchParams.set("key", apiKey);

  try {
    // 클라이언트의 요청 본문을 그대로 Gemini API로 전달합니다.
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: event.body,
    });

    // 응답 본문을 텍스트로 먼저 받은 후 JSON 파싱을 시도합니다.
    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // JSON 파싱 실패 시, 원본 텍스트를 그대로 body로 사용합니다.
      data = responseText;
    }

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error forwarding request to Gemini API:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Internal Server Error while fetching from Gemini API." }),
    };
  }
};