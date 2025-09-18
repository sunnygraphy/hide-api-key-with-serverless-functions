const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    // 허용할 출처(Origin) 목록
    // 실제 Firebase 앱 주소와 로컬 개발 주소를 포함합니다.
    const allowedOrigins = [
        'https://your-firebase-app-name.web.app', // 실제 Firebase 호스팅 주소로 꼭 변경해주세요.
        'http://localhost:7744',
        'http://127.0.0.1:7744'
    ];

    const origin = event.headers.origin;
    let headers = {
        'Content-Type': 'application/json'
    };

    // 요청의 출처가 허용 목록에 있는 경우, Access-Control-Allow-Origin 헤더를 설정합니다.
    if (allowedOrigins.includes(origin)) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers['Vary'] = 'Origin'; // 브라우저 캐싱 문제를 방지하기 위해 추가
    }

    // 브라우저가 보내는 preflight 요청(OPTIONS)에 대한 처리
    if (event.httpMethod === 'OPTIONS') {
        headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS';
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        return {
            statusCode: 204, // No Content
            headers: headers,
            body: ''
        };
    }

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
