# AI Gateway

## Required Environment Variables

Set these on the backend server:

```bash
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

## Available Endpoints

### `POST /admin/ai/gateway/execute`

Accepts:

```json
{
  "prompt": "John tomorrow afternoon white Hilux not drivable, Parramatta, 0412345678",
  "departmentId": 2
}
```

Returns one of:

- booking draft
- vehicle status result
- parts summary result
- operations filter result

### `POST /admin/ai/gateway/commitLead`

Accepts:

```json
{
  "draft": {
    "sourceText": "raw intake text",
    "mappedForm": {}
  },
  "departmentId": 2
}
```

Creates:

- customer if needed
- car if needed
- lead order
- order action log

## Supported Prompt Patterns

- messy booking intake text
- vehicle status lookup by rego / stock / VIN / customer keyword
- parts summary lookup
- booked vehicles without drivers today

## Notes

- Frontend defaults to live backend mode and falls back to mock data if the AI gateway is unavailable.
- Write actions still require explicit user confirmation in the UI.
