# AiQ愛<7 Answer Engine Patch

This ZIP is a safe patch for the existing `QualiaRhythmMatrix` site.  
Do not overwrite the entire site with a new index.html. Keep your restored original site and only insert the files/snippets here.

## Frontend / GitHub Pages

Place these files in your `QualiaRhythmMatrix` repo:

- `aiq7-answer.css`
- `aiq7-answer.js`

Then edit your existing `index.html`:

### 1. Add CSS in `<head>`

```html
<link rel="stylesheet" href="aiq7-answer.css">
```

### 2. Add nav link after Hierarchy

```html
<a href="#hierarchy">Hierarchy</a>
<a href="#aiq7-answer">AiQ愛&lt;7</a>
<a href="#vibration">Vibration</a>
```

### 3. Insert section after Full Hierarchy

Copy the content from:

```txt
frontend/aiq7-section.html
```

and paste it immediately after:

```html
<section id="hierarchy">
  ...
</section>
```

### 4. Add JS before `</body>`

```html
<script src="aiq7-answer.js" defer></script>
```

### 5. Edit endpoint

In `aiq7-answer.js`, replace:

```js
const AIQ7_ANSWER_ENDPOINT = "https://YOUR-VERCEL-PROJECT.vercel.app/api/aiq7-answer";
```

with your real Vercel backend URL.

---

## Backend / Vercel

Create a Vercel project containing:

- `api/aiq7-answer.js`
- `package.json`

Set Vercel Environment Variables:

```txt
GEMINI_API_KEY=your Gemini key
GEMINI_MODEL=gemini-2.5-flash
DEEPSEEK_API_KEY=your DeepSeek key
DEEPSEEK_MODEL=deepseek-chat
```

The frontend user does not input any API key.
