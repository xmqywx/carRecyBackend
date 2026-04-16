import axios from 'axios';
import { VolcArkService } from '../../src/modules/ai/service/volcArk';
import { CoolCommException } from '@cool-midway/core';

jest.mock('axios');

const mockedPost = axios.post as jest.MockedFunction<typeof axios.post>;

function makeService(apiKey = 'test-key') {
  const svc = new VolcArkService();
  process.env.ARK_API_KEY = apiKey;
  return svc;
}

afterEach(() => {
  jest.resetAllMocks();
  delete process.env.ARK_API_KEY;
});

describe('VolcArkService', () => {
  // Test 1: Sanitized error boundary — canary base64 must NOT appear in the thrown exception
  it('sanitized error boundary: does not leak base64 payload in thrown exception', async () => {
    const svc = makeService();
    const canary = 'CANARY_BASE64_PAYLOAD_' + 'A'.repeat(40);
    const fakeDataUri = `data:image/jpeg;base64,${canary}`;

    // Mock axios to reject with an error that has err.config.data containing the canary
    const axiosError: any = new Error('Request failed with status 400');
    axiosError.config = { data: JSON.stringify({ messages: [{ content: [{ image_url: { url: fakeDataUri } }] }] }) };
    axiosError.response = {
      status: 400,
      data: { error: { message: 'Bad request' } },
      config: { data: axiosError.config.data },
    };
    axiosError.request = { path: '/api/v3/chat/completions', data: axiosError.config.data };
    mockedPost.mockRejectedValueOnce(axiosError);

    let thrown: any;
    try {
      await svc.chatJsonWithImage('sys', 'user text', fakeDataUri);
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeDefined();
    expect(thrown).toBeInstanceOf(CoolCommException);

    // The serialized exception must NOT contain the canary
    const serialized = JSON.stringify(thrown);
    expect(serialized).not.toContain(canary);
    // Also confirm neither config nor request leaked through
    expect(thrown.config).toBeUndefined();
    expect(thrown.request).toBeUndefined();
  });

  // Test 2: Refusal sentinel — plain text response returns { __refusal: true, message: ... }
  it('refusal sentinel: returns { __refusal: true } for non-JSON text response', async () => {
    const svc = makeService();
    mockedPost.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: "I'm sorry, I can't process that image.",
            },
          },
        ],
      },
    });

    const result = await svc.chatJsonWithImage('sys', 'user text', 'data:image/jpeg;base64,abc');
    expect(result).toEqual({
      __refusal: true,
      message: "I'm sorry, I can't process that image.",
    });
  });

  // Test 3: Happy path — valid JSON in choices[0].message.content returns parsed object
  it('happy path: returns parsed JSON object from valid response', async () => {
    const svc = makeService();
    const payload = {
      customer: { firstName: 'Alice', surname: 'Smith', phone: '0411111111' },
      vehicle: { rego: 'ABC123', brand: 'Toyota' },
    };
    mockedPost.mockResolvedValueOnce({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify(payload),
            },
          },
        ],
      },
    });

    const result = await svc.chatJsonWithImage('sys', 'user text', 'data:image/jpeg;base64,abc');
    expect(result).toEqual(payload);
    expect(result.customer.firstName).toBe('Alice');
    expect(result.vehicle.rego).toBe('ABC123');
  });
});
