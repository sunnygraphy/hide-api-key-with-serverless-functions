const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // CORS 헤더는 netlify.toml에서 관리하므로, 여기서는 Content-Type만 지정합니다.
    const headers = {
        'Content-Type': 'application/json'
    };

    // POST 요청만 처리
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
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

        if (!geminiResponse.ok) throw new Error(`Gemini API error: ${geminiResponse.statusText}`);

        const data = await geminiResponse.json();
        const text = data.candidates[0].content.parts[0].text;

        return { statusCode: 200, headers, body: JSON.stringify({ text }) };
    } catch (error) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};
