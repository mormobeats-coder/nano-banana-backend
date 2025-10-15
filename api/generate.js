// Vercel Serverless Function для генерации изображений
// Деплоится на серверах Vercel за границей

export default async function handler(req, res) {
  // CORS для доступа с любого сайта
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-goog-api-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, action, body } = req.body;
    const apiKey = req.headers['x-goog-api-key'] || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        hint: 'Добавьте API ключ в заголовок x-goog-api-key или в переменные окружения Vercel'
      });
    }

    // Определяем URL для Gemini API
    let geminiUrl;
    if (action === 'generateImages') {
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImages`;
    } else if (action === 'generateContent') {
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    console.log('🎨 Запрос к Gemini:', geminiUrl);

    // Делаем запрос к Gemini API
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Ошибка от Gemini:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('✅ Успешная генерация!');
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Ошибка сервера:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

