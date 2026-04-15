import axios from 'axios';

const baseURL = process.env.LEAD_ASSISTANT_SMOKE_BASE_URL || 'http://127.0.0.1:8001';
const username = process.env.LEAD_ASSISTANT_SMOKE_USERNAME || 'admin';
const passwordCandidates = process.env.LEAD_ASSISTANT_SMOKE_PASSWORD
  ? [process.env.LEAD_ASSISTANT_SMOKE_PASSWORD]
  : ['111111', '123456'];
const departmentId = Number(process.env.LEAD_ASSISTANT_SMOKE_DEPARTMENT_ID || 1);
const intakeText =
  process.env.LEAD_ASSISTANT_SMOKE_TEXT ||
  `Smoke Lead ${Date.now()} 0412345678 white Hilux Parramatta tomorrow afternoon`;

async function login(password) {
  const response = await axios.post(
    `${baseURL}/admin/base/open/login`,
    { username, password },
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (response.data?.code !== 1000) {
    throw new Error(response.data?.message || 'Login failed');
  }
  const payload = response.data?.data || response.data;
  if (!payload?.token) {
    throw new Error('Login succeeded without token payload');
  }
  return payload.token;
}

async function startSession(token) {
  const response = await axios.post(
    `${baseURL}/admin/base/comm/lead-assistant/session/start`,
    { departmentId },
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }
  );
  if (response.data?.code !== 1000) {
    throw new Error(response.data?.message || 'Session start failed');
  }
  return response.data?.data || response.data;
}

async function submitIntake(token, sessionId) {
  const response = await axios.post(
    `${baseURL}/admin/base/comm/lead-assistant/session/intake`,
    {
      id: sessionId,
      departmentId,
      intakeText,
    },
    {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    }
  );
  if (response.data?.code !== 1000) {
    throw new Error(response.data?.message || 'Intake failed');
  }
  return response.data?.data || response.data;
}

async function run() {
  let lastError;

  for (const password of passwordCandidates) {
    try {
      const token = await login(password);
      const session = await startSession(token);

      let intake;
      let intakeError = null;
      try {
        intake = await submitIntake(token, session.id);
      } catch (error) {
        intakeError = error;
      }

      console.log(
        JSON.stringify(
          {
            baseURL,
            username,
            passwordUsed: password,
            departmentId,
            auth: 'ok',
            sessionId: session.id,
            sessionStart: 'ok',
            intake: intakeError ? 'failed' : 'ok',
            intakeStatus: intake?.status || null,
            extractedDraftKeys: Object.keys(intake?.extractedDraft || {}),
            intakeError:
              intakeError?.response?.data?.message ||
              intakeError?.message ||
              null,
          },
          null,
          2
        )
      );
      return;
    } catch (error) {
      lastError = error;
    }
  }

  const message =
    lastError?.response?.data?.message ||
    lastError?.message ||
    'Lead assistant live smoke failed';
  throw new Error(message);
}

run().catch(error => {
  console.error(`[lead-assistant-live-smoke] ${error.message}`);
  process.exitCode = 1;
});
