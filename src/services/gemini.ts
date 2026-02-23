const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-3-flash-preview';

const WORKER_BASE = 'https://api.neobrowser.app';
const WORKER_API_KEY = 'd73dfdc0125262f3e1e6fd5f59be8cde31968056e579937283f3e3dc46b67de4';

export type AIMode = 'byok' | 'pro';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface BrowserAction {
  type: 'navigate' | 'click' | 'type' | 'scroll' | 'extract' | 'summarize' | 'search' | 'wait';
  target?: string;
  value?: string;
  description: string;
}

export interface GeminiResponse {
  text: string;
  actions?: BrowserAction[];
  done: boolean;
  thought?: string;
}

const AGENT_PROMPT = `You are NeoBrowser Agent, an autonomous AI browser agent powered by Gemini 3 Flash. You can browse the web, interact with pages, and complete multi-step tasks for the user.

You operate in an observe-act loop:
1. You receive the current page state (URL, title, visible text, interactive elements with CSS selectors)
2. You decide what action to take next
3. The action is executed, and you receive the updated page state
4. You continue until the task is complete

Available actions:
- navigate: Go to a URL. value = the URL
- search: Search the web. value = search query
- click: Click an element. target = CSS selector from the page context
- type: Type text into a field. target = CSS selector, value = text to type
- scroll: Scroll the page. value = "up" or "down"
- extract: Extract content from the page. target = what to extract
- summarize: Summarize the current page content
- wait: Wait for page to load. value = milliseconds (default 1000)

IMPORTANT RULES:
- Only return ONE action at a time. After each action, you'll get updated page context.
- Use the CSS selectors provided in the page context for click/type actions.
- If you need to navigate somewhere, use the navigate or search action.
- After typing in a search field, you often need to click a submit button or use a separate action.
- Set "done": true when the task is fully complete or you have the answer for the user.
- Set "done": false when you need to take more steps.
- Keep "thought" brief - it shows the user what you're thinking.
- Keep "text" for the final response to the user (shown when done=true). For intermediate steps, keep text short.

Respond ONLY in this JSON format:
{
  "thought": "Brief reasoning about what to do next",
  "text": "Message to show the user",
  "action": { "type": "click", "target": "#search-btn", "value": "", "description": "Clicking search" },
  "done": false
}

When done (no more actions needed):
{
  "thought": "Task complete",
  "text": "Here's what I found for you: ...",
  "done": true
}

Be fast, precise, and autonomous. Complete tasks in as few steps as possible.`;

async function callWorker(
  systemPrompt: string,
  contents: any[],
  generationConfig: any
): Promise<any> {
  const response = await fetch(`${WORKER_BASE}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': WORKER_API_KEY,
    },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error (${response.status}): Check your subscription status.`);
  }

  return response;
}

export async function sendToGemini(
  apiKey: string,
  messages: GeminiMessage[],
  pageContext?: string,
  mode: AIMode = 'byok'
): Promise<GeminiResponse> {
  const contextPart = pageContext
    ? `\n\n[PAGE STATE]\n${pageContext.slice(0, 8000)}`
    : '';

  const contents = messages.map((msg) => ({
    role: msg.role,
    parts: msg.parts.map((p) => ({
      text: p.text + (msg === messages[messages.length - 1] ? contextPart : ''),
    })),
  }));

  const generationConfig = {
    temperature: 0.4,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  };

  let response: Response;

  if (mode === 'pro') {
    response = await callWorker(AGENT_PROMPT, contents, generationConfig);
  } else {
    response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: AGENT_PROMPT }],
          },
          contents,
          generationConfig,
        }),
      }
    );
  }

  if (!response.ok) {
    throw new Error(`Gemini API error (${response.status}): Check your API key and try again.`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    const parsed = JSON.parse(rawText);
    const actions: BrowserAction[] | undefined = parsed.action
      ? [parsed.action]
      : parsed.actions || undefined;

    return {
      text: parsed.text || rawText,
      actions,
      done: parsed.done !== false,
      thought: parsed.thought,
    };
  } catch {
    return { text: rawText, done: true };
  }
}

// Simple Gemini call without agent prompt - for general queries like YouTube search
export async function queryGemini(
  apiKey: string,
  prompt: string,
  mode: AIMode = 'byok'
): Promise<string> {
  const contents = [{ role: 'user', parts: [{ text: prompt }] }];
  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: 2048,
  };

  let response: Response;

  if (mode === 'pro') {
    response = await callWorker('', contents, generationConfig);
  } else {
    response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig,
        }),
      }
    );
  }

  if (!response.ok) {
    throw new Error(`Gemini API error (${response.status})`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// Streaming variant for the AI agent's final responses
// Uses Gemini's streamGenerateContent endpoint
// onChunk is called with accumulated text as each chunk arrives
export async function sendToGeminiStreaming(
  apiKey: string,
  messages: GeminiMessage[],
  pageContext?: string,
  onChunk?: (text: string) => void,
  mode: AIMode = 'byok'
): Promise<GeminiResponse> {
  const contextPart = pageContext
    ? `\n\n[PAGE STATE]\n${pageContext.slice(0, 8000)}`
    : '';

  const contents = messages.map((msg) => ({
    role: msg.role,
    parts: msg.parts.map((p) => ({
      text: p.text + (msg === messages[messages.length - 1] ? contextPart : ''),
    })),
  }));

  const generationConfig = {
    temperature: 0.4,
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  };

  let response: Response;

  if (mode === 'pro') {
    // Pro mode: use worker (non-streaming, parse same as non-streaming)
    response = await callWorker(AGENT_PROMPT, contents, generationConfig);

    if (!response.ok) {
      throw new Error(`API error (${response.status}): Check your subscription status.`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (onChunk) {
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.text) onChunk(parsed.text);
      } catch {}
    }

    try {
      const parsed = JSON.parse(rawText);
      const actions: BrowserAction[] | undefined = parsed.action
        ? [parsed.action]
        : parsed.actions || undefined;
      return {
        text: parsed.text || rawText,
        actions,
        done: parsed.done !== false,
        thought: parsed.thought,
      };
    } catch {
      return { text: rawText, done: true };
    }
  }

  // BYOK mode: stream directly from Gemini
  response = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:streamGenerateContent?key=${apiKey}&alt=sse`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: AGENT_PROMPT }],
        },
        contents,
        generationConfig,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error (${response.status}): Check your API key and try again.`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response stream available');
  }

  const decoder = new TextDecoder();
  let accumulated = '';
  let lastReportedText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // SSE format: lines starting with "data: " contain JSON
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          accumulated += text;

          // Try to extract partial "text" field from the accumulated JSON for streaming display
          if (onChunk) {
            const textMatch = accumulated.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
            if (textMatch) {
              const partialText = textMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
              if (partialText !== lastReportedText) {
                lastReportedText = partialText;
                onChunk(partialText);
              }
            }
          }
        } catch {}
      }
    }
  }

  // Parse the full accumulated JSON response
  try {
    const parsed = JSON.parse(accumulated);
    const actions: BrowserAction[] | undefined = parsed.action
      ? [parsed.action]
      : parsed.actions || undefined;

    return {
      text: parsed.text || accumulated,
      actions,
      done: parsed.done !== false,
      thought: parsed.thought,
    };
  } catch {
    return { text: accumulated, done: true };
  }
}
