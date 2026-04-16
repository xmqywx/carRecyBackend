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
   * Send a multimodal chat request with a base64 image and return the parsed JSON response.
   *
   * SECURITY: This method implements a sanitized error boundary (spec §14 mitigation #1).
   * The base64 image payload must never appear in error logs or exception objects.
   * All caught errors are re-thrown as fresh CoolCommException with only status + message.
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
        `${this.baseUrl}/api/v3/chat/completions`,
        {
          model: this.model,
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: userText },
                { type: 'image_url', image_url: { url: imageBase64DataUri } },
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

      content = response?.data?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string') {
        throw new CoolCommException('VolcArk returned an empty response');
      }
    } catch (err: any) {
      // SANITIZED ERROR BOUNDARY: construct a fresh exception with ONLY the status code
      // and a safe message. Never attach err.config, err.request, or err.response.config
      // (all of which may contain the full base64 payload in the request body).
      if (err instanceof CoolCommException) {
        throw err;
      }
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.error?.message;
      const safeMsg = serverMsg
        ? `VolcArk API error (${status}): ${String(serverMsg).slice(0, 200)}`
        : `VolcArk API request failed (${status ?? 'network error'})`;
      throw new CoolCommException(safeMsg);
    }

    // REFUSAL SENTINEL: non-JSON content becomes a friendly signal instead of an error.
    const trimmed = content.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      return { __refusal: true, message: trimmed.slice(0, 500) };
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      // Attempt to extract a JSON object if wrapped in extra text
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(trimmed.slice(start, end + 1));
        } catch {
          // Fall through to refusal
        }
      }
      return { __refusal: true, message: trimmed.slice(0, 500) };
    }
  }
}
