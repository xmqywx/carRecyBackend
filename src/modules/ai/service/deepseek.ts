import { Provide } from '@midwayjs/decorator';
import { CoolCommException } from '@cool-midway/core';
import axios from 'axios';

function extractJsonObject(raw: string) {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  throw new Error('AI response did not include a JSON object');
}

@Provide()
export class DeepseekService {
  private get apiKey() {
    return process.env.DEEPSEEK_API_KEY;
  }

  private get baseUrl() {
    return (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com').replace(/\/$/, '');
  }

  private get model() {
    return process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async chatJson(systemPrompt: string, userPrompt: string) {
    if (!this.apiKey) {
      throw new CoolCommException('DEEPSEEK_API_KEY is not configured on the server');
    }

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      },
      {
        timeout: 45000,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new CoolCommException('DeepSeek returned an empty response');
    }

    try {
      return JSON.parse(extractJsonObject(content));
    } catch (error) {
      throw new CoolCommException(`Unable to parse DeepSeek JSON response: ${error?.message || error}`);
    }
  }
}
