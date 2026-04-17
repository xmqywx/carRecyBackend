import { Provide } from '@midwayjs/decorator';
import { CoolCommException } from '@cool-midway/core';
import axios from 'axios';

@Provide()
export class VolcArkService {
  private get apiKey() {
    return process.env.ARK_API_KEY;
  }

  private get baseUrl() {
    return (process.env.ARK_BASE_URL || 'https://ark.cn-beijing.volces.com').replace(/\/$/, '');
  }

  private get model() {
    return process.env.ARK_MODEL || 'doubao-seed-2-0-pro-260215';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Send a multimodal request with a base64 image via the Volcengine Ark
   * Responses API (/api/v3/responses) and return the parsed JSON response.
   *
   * SECURITY: This method implements a sanitized error boundary (spec §14 mitigation #1).
   * The base64 image payload must never appear in error logs or exception objects.
   */
  async chatJsonWithImage(
    systemPrompt: string,
    userText: string,
    imageBase64DataUri: string,
  ): Promise<Record<string, any>> {
    if (!this.apiKey) {
      throw new CoolCommException('ARK_API_KEY is not configured on the server');
    }

    let content: string;
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v3/responses`,
        {
          model: this.model,
          temperature: 0.1,
          max_output_tokens: 1500,
          // Merge system prompt into the user message because the Volcengine
          // Ark Responses API may not support role:'system' in the input array.
          // The system prompt + user text are sent together as input_text.
          input: [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: `${systemPrompt}\n\n---\n\n${userText}` },
                { type: 'input_image', image_url: imageBase64DataUri },
              ],
            },
          ],
        },
        {
          timeout: 60000,
          maxBodyLength: 10485760,
          maxContentLength: 10485760,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Responses API returns:
      // { output: [
      //   { type: "reasoning", summary: [...] },          ← thinking/reasoning (skip)
      //   { type: "message", content: [{ type: "output_text", text: "..." }] }  ← actual output
      // ] }
      const data = response?.data;
      const outputItems: any[] = data?.output ?? [];
      // Find the "message" type output (skip "reasoning")
      const messageOutput = outputItems.find((item: any) => item.type === 'message');
      const outputContent = messageOutput?.content ?? [];
      // Find the "output_text" content item
      const textItem = outputContent.find((c: any) => c.type === 'output_text');
      content = textItem?.text ?? '';

      if (!content || typeof content !== 'string') {
        console.warn('[VolcArk] Could not extract text from response. Keys:', Object.keys(data || {}));
        console.warn('[VolcArk] Full response shape:', JSON.stringify(data).slice(0, 500));
        throw new CoolCommException('VolcArk returned an unrecognized response shape');
      }
    } catch (err: any) {
      // SANITIZED ERROR BOUNDARY
      if (err instanceof CoolCommException) {
        throw err;
      }
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error?.message
        ?? (typeof err?.response?.data === 'string' ? err.response.data.slice(0, 200) : undefined);
      const safeMsg = serverMsg
        ? `VolcArk API error (${status}): ${String(serverMsg).slice(0, 200)}`
        : `VolcArk API request failed (${status ?? 'network error'})`;
      throw new CoolCommException(safeMsg);
    }

    // REFUSAL SENTINEL
    const trimmed = content.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return { __refusal: true, message: trimmed.slice(0, 500) };
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(trimmed.slice(start, end + 1));
        } catch {
          // Fall through
        }
      }
      return { __refusal: true, message: trimmed.slice(0, 500) };
    }
  }
}
