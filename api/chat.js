export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
    });
  }

  const { messages, systemPrompt } = req.body;

  // Validate messages
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: 'Invalid request body',
    });
  }

  try {
    // Get API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'API key not configured',
      });
    }

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: msg.content,
        },
      ],
    }));

    // Send request to Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiMessages,

          systemInstruction: {
            parts: [
              {
                text:
                  systemPrompt ||
                  "You are Fredrick's AI assistant for his portfolio website.",
              },
            ],
          },

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await response.json();

    // Debug logs
    console.log('Gemini response:', data);

    // Handle API errors
    if (!response.ok) {
      console.error('Gemini API error:', data);

      return res.status(500).json({
        error: data?.error?.message || 'AI service error',
      });
    }

    // Extract AI reply
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate a response.';

    // Return reply
    return res.status(200).json({
      reply,
    });

  } catch (error) {
    console.error('Server error:', error);

    return res.status(500).json({
      error: 'Internal server error',
    });
  }
}
