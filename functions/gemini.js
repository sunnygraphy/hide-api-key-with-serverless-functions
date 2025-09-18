const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // CORS 헤더를 여기서 직접 관리하여 netlify.toml 의존성을 줄일 수 있습니다.
    // README.md에 HOST 환경변수를 사용하도록 안내되어 있으므로, 그 방식을 따르는 것이 좋습니다.
    const headers = {
        'Access-Control-Allow-Origin': process.env.HOST || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // POST 요청만 처리
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    // 브라우저의 preflight 요청(OPTIONS)에 대한 처리
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // No Content
            headers,
        };
    }
    try {
        const { prompt } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        // Gemini API에서 에러가 발생한 경우, 해당 상태 코드와 메시지를 클라이언트에 전달합니다.
        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.json();
            console.error('Gemini API Error:', errorBody);
            return {
                statusCode: geminiResponse.status, // 500 대신 Gemini의 상태 코드(예: 429)를 그대로 반환
                headers,
                body: JSON.stringify({ error: `Gemini API error: ${errorBody.error.message || geminiResponse.statusText}` })
            };
        }

        const data = await geminiResponse.json();
        const text = data.candidates[0].content.parts[0].text;

        return { statusCode: 200, headers, body: JSON.stringify({ text }) };
    } catch (error) {
        console.error('Serverless Function Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
