# 📄 PDF KeyPoint Extractor — Project Instructions for GitHub Copilot

## 🧠 Project Overview

Build a **simple, single-page web application** where a user can upload a PDF file
and instantly get:
- The **key points** extracted from the document
- The **page number** where each key point is found
- A **role-based filter** (Student / Professional / Researcher) that changes which points are highlighted
- A simple **"Ask the PDF"** chat box to ask questions about the document

This is a **frontend-only project** — no backend, no server, no database.
Everything runs in the browser using JavaScript.

---

## 🛠️ Tech Stack

| Layer        | Technology                          |
|--------------|--------------------------------------|
| Language     | HTML + CSS + Vanilla JavaScript      |
| PDF Reading  | `pdf.js` (Mozilla's open-source library) |
| AI API       | Anthropic Claude API (`claude-sonnet-4-20250514`) |
| Styling      | Plain CSS (no frameworks needed)     |
| Hosting      | GitHub Pages (free, static hosting)  |

> ✅ No Node.js. No backend. No database. Just HTML + JS files opened in a browser.

---

## 📁 Project File Structure

```
pdf-keypoint-extractor/
│
├── index.html          ← Main page (upload UI + results display)
├── style.css           ← All styling
├── app.js              ← All JavaScript logic
├── .gitignore          ← Must include .env
└── README.md           ← Project description
```

---

## 🔑 API Key Handling (Important — Security)

- The user will **paste their Anthropic API key** into an input field on the page
- The key is stored only in browser memory (`const apiKey = ...`) — never saved to disk
- **Never hardcode** the API key in any file
- Add a note in the UI: *"Your API key is never stored or sent anywhere except Anthropic"*

---

## 🖥️ Page Layout (Step by Step)

### Step 1 — Hero / Upload Section
- App title: **"PDF KeyPoint Extractor"**
- Subtitle: *"Upload any PDF. Get the key points instantly."*
- An **API Key input field** (type=password, placeholder="Paste your Anthropic API key")
- A **PDF upload button** (accepts `.pdf` files only)
- A **Role Selector** with 3 buttons:
  - 🎓 Student
  - 💼 Professional
  - 🔬 Researcher

### Step 2 — Loading State
- While the PDF is being processed, show a simple spinner or loading text:
  *"Reading your PDF... extracting key points..."*

### Step 3 — Results Section (shown after processing)
- A **list of key points** (5 to 10 points max)
- Each key point shows:
  - The point text
  - A small badge showing **"Page X"** where it was found
  - A priority badge: 🔴 High / 🟡 Medium / 🟢 Low
- A **"Copy All Points"** button

### Step 4 — Ask the PDF (Chat Box)
- A simple text input: *"Ask anything about this document..."*
- A **Send** button
- The answer appears below, grounded only in the PDF content

---

## ⚙️ Core JavaScript Functions to Build

### 1. `extractTextFromPDF(file)`
- Use `pdf.js` to read the uploaded PDF file
- Loop through all pages and extract text from each
- Return an object: `{ pageNumber: text }` for all pages
- Also return the full combined text as one string

```javascript
// Expected output format:
{
  fullText: "entire document text...",
  pageTexts: {
    1: "text from page 1...",
    2: "text from page 2...",
    // etc.
  }
}
```

### 2. `getKeyPoints(pdfData, role, apiKey)`
- Call the Anthropic Claude API with the PDF text
- Pass the selected role (Student / Professional / Researcher) in the prompt
- Ask Claude to return key points in **JSON format**

**Prompt template to use:**
```
You are analyzing a PDF document for a ${role}.

Here is the full document text:
${pdfData.fullText}

Extract the 5 to 8 most important key points relevant to a ${role}.
For each key point, identify the approximate page number from this page map:
${JSON.stringify(pdfData.pageTexts)}

Return ONLY a JSON array. No explanation. No markdown. Example format:
[
  {
    "point": "The main argument of the document is...",
    "page": 3,
    "priority": "high"
  }
]

Priority must be one of: "high", "medium", "low"
```

### 3. `askQuestion(question, pdfText, apiKey)`
- Call the Anthropic Claude API with the question + PDF text
- Instruct Claude to answer ONLY from the document, not from general knowledge

**Prompt template:**
```
You are a document assistant. Answer the user's question using ONLY the content
from the document below. If the answer is not in the document, say:
"I couldn't find that in the document."

Document:
${pdfText}

User Question: ${question}
```

### 4. `renderKeyPoints(keyPoints)`
- Take the JSON array from `getKeyPoints()`
- Loop through and create HTML elements for each point
- Show the point text, page badge, and priority badge
- Append them into the results section div

### 5. `copyAllPoints()`
- Collect all key point texts from the DOM
- Join them with newlines
- Use `navigator.clipboard.writeText()` to copy to clipboard
- Show a brief "Copied!" confirmation message

---

## 🌐 Anthropic API Call Format

Use this exact fetch structure for all API calls:

```javascript
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true"
  },
  body: JSON.stringify({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      { role: "user", content: YOUR_PROMPT_HERE }
    ]
  })
});

const data = await response.json();
const resultText = data.content[0].text;
```

---

## 🎨 Design Style

- **Background:** Dark navy (`#0f172a`)
- **Card background:** Slightly lighter (`#1e293b`)
- **Accent color:** Bright cyan (`#06b6d4`)
- **Text:** White / light gray
- **Font:** System font stack (no Google Fonts needed)
- **Border radius:** `12px` on cards, `8px` on buttons
- **Priority colors:**
  - High → red badge (`#ef4444`)
  - Medium → yellow badge (`#f59e0b`)
  - Low → green badge (`#22c55e`)

Keep the design **clean and minimal** — no clutter.

---

## ✅ Feature Checklist (Build in this order)

- [ ] HTML structure with upload section, results section, chat section
- [ ] CSS styling (dark theme)
- [ ] PDF upload input and file reading with `pdf.js`
- [ ] Text extraction from all pages using `pdf.js`
- [ ] Role selector (3 buttons, one active at a time)
- [ ] API call to Claude to get key points as JSON
- [ ] Render key points with page number and priority badges
- [ ] Copy All Points button
- [ ] Ask the PDF chat box and answer display
- [ ] Loading spinner during API call
- [ ] Error message if API key is wrong or PDF fails to load

---

## 🚫 What NOT to Build (Keep it Simple)

- ❌ No user login or accounts
- ❌ No saving data to a database
- ❌ No backend server or Node.js
- ❌ No file storage
- ❌ No multiple file uploads at once
- ❌ No PDF preview/viewer

---

## 💬 GitHub Copilot Usage Tips

When using Copilot, use these chat prompts to get the best results:

1. *"Write the extractTextFromPDF function using pdf.js that returns page-wise text"*
2. *"Write the getKeyPoints function that calls Anthropic API and parses the JSON response"*
3. *"Create the renderKeyPoints function that builds HTML cards for each key point"*
4. *"Help me add error handling to the API call in case the response fails"*
5. *"Write CSS for a dark navy card component with cyan accent color"*

---

## 🏆 Hackathon Requirements Fulfilled

| Requirement                  | How it's met                                           |
|------------------------------|--------------------------------------------------------|
| GitHub Copilot Usage         | Used throughout to write all JS functions and CSS      |
| Microsoft IQ Integration     | Can connect to **Foundry IQ** for grounded PDF answers |
| Creative Application         | Role-based PDF analysis — unique angle on a real problem |
| Security                     | API key never stored, only in browser memory           |
| No backend knowledge needed  | 100% frontend — HTML + CSS + JS only                   |
