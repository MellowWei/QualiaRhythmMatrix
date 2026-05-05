# AiQ愛<7 Answer Engine

Files:
- `index.html` — based on your uploaded HTML, with AiQ愛<7 added as an answer engine.
- `api/aiq7-answer.js` — optional Vercel backend for Gemini + DeepSeek deep answer.
- `package.json` — minimal Vercel package metadata.

## Frontend only
Replace your current `index.html` with this `index.html`. The local answer engine works without backend.

## Deep answer backend
Deploy to Vercel and set Environment Variables:

```txt
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-1.5-pro
DEEPSEEK_API_KEY=...
DEEPSEEK_MODEL=deepseek-chat
```

Then paste your deployed endpoint into the site:

```txt
https://your-project.vercel.app/api/aiq7-answer
```
