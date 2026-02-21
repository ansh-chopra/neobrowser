const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-2.0-flash';

export interface BuilderResult {
  html: string;
  title: string;
  description: string;
}

const BUILDER_PROMPT = `You are an agentic AI app builder powered by Claude with MCP (Model Context Protocol) tools. You build complete, production-ready single-page web applications.

When the user describes an app, you generate a COMPLETE, working single-file HTML application with inline CSS and JavaScript. The app must be fully functional and beautiful.

Design principles:
- Modern, clean UI with smooth animations
- Mobile-responsive by default
- Use CSS custom properties for theming
- Include subtle micro-interactions
- Dark/light mode aware (prefers-color-scheme)
- Professional typography and spacing

Technical requirements:
- Everything in a single HTML file (inline CSS + JS)
- No external dependencies unless absolutely necessary (you may use CDN links for major libs like Chart.js, Three.js, etc.)
- Use modern ES6+ JavaScript
- Semantic HTML5
- Accessible (ARIA labels, keyboard nav)

Respond ONLY with valid JSON in this exact format:
{
  "title": "Short app name",
  "description": "One sentence describing the app",
  "html": "<!DOCTYPE html>...(complete HTML file)..."
}

Make sure the HTML is complete and runnable. The app should look polished and professional, like a real product. Include a small watermark at the bottom: "Built with NeoBrowser AI".`;

export async function buildApp(
  apiKey: string,
  prompt: string
): Promise<BuilderResult> {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: BUILDER_PROMPT }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Build this app: ${prompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error (${response.status}): Check your API key and try again.`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    const parsed = JSON.parse(rawText);
    return {
      html: parsed.html || '',
      title: parsed.title || 'Untitled App',
      description: parsed.description || '',
    };
  } catch {
    throw new Error('Failed to generate app. Try again.');
  }
}
