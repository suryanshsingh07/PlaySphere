export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  temperature?: number;
  max_tokens?: number;
}

/**
 * Calls a hosted LLM API that provides an OpenAI-compatible /chat/completions endpoint.
 * Requires LLM_API_URL, LLM_API_KEY, and LLM_MODEL in environment variables.
 */
export async function callLLM(messages: ChatMessage[], options?: LLMOptions): Promise<string> {
  const apiUrl = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'llama-3.1-8b-instant';

  if (!apiUrl || !apiKey) {
    throw new Error('LLM_API_URL or LLM_API_KEY is not configured in environment variables.');
  }

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.max_tokens ?? 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);


      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LLM API Error (${response.status}):`, errorText);

        // Only retry on rate-limit (429) or server errors (5xx)
        const isRetryable = response.status === 429 || response.status >= 500;
        if (isRetryable && attempt < maxRetries) {
          const delay = response.status === 429 ? 2000 : 1000;
          console.warn(`[callLLM] HTTP ${response.status}. Retrying attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new Error(`LLM API failed with status ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (attempt >= maxRetries) {
        console.error('Error calling LLM after max retries:', error);
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new Error('LLM request timed out after 30 seconds.');
        }
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('LLM API failed after maximum retries');
}
