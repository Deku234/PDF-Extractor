# 📄 PDF KeyPoint Extractor — Project Instructions for GitHub Copilot

## 🧠 Project Overview

Build a **multi-page web application** where a user can upload a PDF file
and instantly get:
- The **key points** extracted from the document
- The **page number** where each key point is found
- A **role-based filter** (Student / Professional / Researcher) that changes which points are highlighted
- A **pagination system** for large PDFs (50 pages per batch)
- A **dedicated chat page** (chat.html) to have a full conversation with the PDF

This is a **frontend-only project** — no backend, no server, no database.
Everything runs in the browser using JavaScript.

---

## 🛠️ Tech Stack

| Layer        | Technology                               |
|--------------|--------------------------------------    |
| Language     | HTML + CSS + Vanilla JavaScript          |
| PDF Reading  | `pdf.js` (Mozilla's open-source library) |
| AI API       | Google Gemini API (`gemini-2.5-flash`)   |
| Styling      | Plain CSS (no frameworks needed)         |
| Hosting      | GitHub Pages (free, static hosting)      |

> ✅ No Node.js. No backend. No database. Just HTML + JS files opened in a browser.

---

## 📁 Project File Structure

```
PDF-Extractor/
│
├── index.html          ← Main page (upload UI + results + pagination)
├── chat.html           ← Dedicated chat page for PDF conversation
├── style.css           ← All styling for index.html
├── chat.css            ← Styling for chat.html
├── app.js              ← All JavaScript logic for index.html
├── chat.js             ← All JavaScript logic for chat.html
├── .gitignore          ← Must include .env
└── README.md           ← Project description
```

---

## 🔑 API Key Handling (Important — Security)

- The user will **paste their Google Gemini API key** into an input field on the page
- The key is stored in `sessionStorage` so chat.html can reuse it without asking again
- **Never hardcode** the API key in any file
- Add a note in the UI: *"Your API key is never stored or sent anywhere except Google Gemini"*

---

## 🌐 Gemini API Call Format

Use this exact fetch structure for ALL API calls in both app.js and chat.js:

```javascript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: YOUR_PROMPT_HERE }]
      }]
    })
  }
);

const data = await response.json();
const resultText = data.candidates[0].content.parts[0].text;
```

> ✅ No Anthropic headers. No x-api-key. No anthropic-version. Gemini only.

---

## 🖥️ Page 1 — index.html Layout

### Step 1 — Hero / Upload Section
- App title: **"PDF KeyPoint Extractor"**
- Subtitle: *"Upload any PDF. Get the key points instantly."*
- An **API Key input field** (type=password, placeholder="Paste your Gemini API key")
- A **PDF upload button** (accepts `.pdf` files only)
- A **Role Selector** with 3 buttons:
  - 🎓 Student
  - 💼 Professional
  - 🔬 Researcher

### Step 2 — Loading State
- While the PDF is being processed, show a simple spinner or loading text:
  *"Reading your PDF... extracting key points..."*

### Step 3 — Results Section (shown after processing)
- A **pagination info bar** at the top: *"Showing pages 1–50 of 120"*
- A **list of key points** (5 to 10 points max per batch)
- Each key point shows:
  - The point text
  - A small badge showing **"Page X"** where it was found
  - A priority badge: 🔴 High / 🟡 Medium / 🟢 Low
- A **"Copy All Points"** button
- A **"💬 Chat with PDF"** button — redirects to chat.html
- Pagination buttons at the bottom:
  - **"← Previous 50 Pages"** (hidden on first batch)
  - **"Next 50 Pages →"** (hidden on last batch)

---

## ⚙️ Core JavaScript Functions — app.js

### 1. `extractTextFromPDF(file)`
- Use `pdf.js` to read the uploaded PDF file
- Loop through ALL pages and extract text from each
- Store everything in global variables for pagination use

```javascript
// Global variables needed
let currentBatchStart = 1;
let totalPages = 0;
let pdfPageTexts = {};
let fullPdfText = "";
let currentRole = "Student";
let currentApiKey = "";

// Expected output format:
{
  fullText: "entire document text...",
  pageTexts: {
    1: "text from page 1...",
    2: "text from page 2...",
    // etc.
  },
  totalPages: 120
}
```

### 2. `getKeyPoints(pageTexts, role, apiKey, startPage, endPage)`
- Call Gemini API with only the text from startPage to endPage
- Pass the selected role in the prompt
- Ask Gemini to return key points in JSON format

**Prompt template:**
```
You are analyzing a PDF document for a ${role}.

Here is the document text from pages ${startPage} to ${endPage}:
${batchText}

Extract the 5 to 8 most important key points relevant to a ${role}.
For each key point identify the approximate page number.

Return ONLY a JSON array. No explanation. No markdown. Example:
[
  {
    "point": "The main argument of the document is...",
    "page": 3,
    "priority": "high"
  }
]

Priority must be one of: "high", "medium", "low"
```

### 3. `loadBatch(startPage)`
- Called when page first loads OR when pagination buttons are clicked
- Calculate endPage = min(startPage + 49, totalPages)
- Extract text only for pages startPage to endPage
- Call getKeyPoints() with that batch
- Call renderKeyPoints() with results
- Update pagination info bar text
- Show/hide Previous and Next buttons based on current position

### 4. `renderKeyPoints(keyPoints)`
- Clear previous results
- Loop through JSON array and create HTML cards
- Show point text, page badge, priority badge
- Append into results div

### 5. `askQuestion(question, pdfText, apiKey)`
- Used only if there is an inline chat — otherwise handled by chat.js

### 6. `copyAllPoints()`
- Collect all key point texts from DOM
- Join with newlines
- Use `navigator.clipboard.writeText()` to copy
- Show brief "Copied!" confirmation

### 7. On "💬 Chat with PDF" button click:
```javascript
sessionStorage.setItem('pdfText', fullPdfText);
sessionStorage.setItem('pdfFileName', fileName);
sessionStorage.setItem('apiKey', currentApiKey);
window.location.href = 'chat.html';
```

---

## 📄 Pagination Logic (Important)

```
If totalPages <= 50:
  → Process all pages at once
  → Hide pagination buttons
  → Show "Showing all X pages"

If totalPages > 50:
  → Process pages 1-50 first
  → Show "Showing pages 1-50 of X"
  → Show "Next 50 Pages →" button
  → Hide "← Previous 50 Pages" button

When "Next 50 Pages →" is clicked:
  → currentBatchStart += 50
  → Load new batch
  → Replace previous key points with new ones
  → Show "← Previous 50 Pages" button
  → Hide "Next 50 Pages →" if last batch reached

When "← Previous 50 Pages" is clicked:
  → currentBatchStart -= 50
  → Load previous batch
  → Replace key points
  → Hide "← Previous" if back to page 1
```

---

## 🗨️ Page 2 — chat.html Layout

### On Page Load:
```javascript
const pdfText = sessionStorage.getItem('pdfText');
const pdfFileName = sessionStorage.getItem('pdfFileName');
const apiKey = sessionStorage.getItem('apiKey');

// If no PDF data found, redirect back
if (!pdfText) window.location.href = 'index.html';
```

### Layout:
- **Header bar** with:
  - Back button (←) on left → goes back to index.html
  - Title: *"Chat with PDF"*
  - Filename shown in smaller text below title
- **Chat messages area** (scrollable, takes most of screen height)
- **Input area at bottom**:
  - Text input: *"Ask anything about this document..."*
  - Send button

### First Message (auto shown on load):
```
🤖 Hi! I have read your PDF "${pdfFileName}". 
Ask me anything about it!
```

---

## ⚙️ Core JavaScript Functions — chat.js

### 1. `sendMessage(question)`
- Add user message bubble to chat area (right aligned)
- Show typing indicator
- Call Gemini API with question + pdfText
- Remove typing indicator
- Add AI response bubble to chat area (left aligned)
- Scroll to bottom

### 2. Gemini prompt for chat:
```
You are a document assistant. Answer the user's question using ONLY 
the content from the document below.

Format your response professionally:
- Start with a relevant emoji and bold heading
- Write the answer in clear paragraphs with proper spacing
- Use subheadings with emojis where needed
- End with: 💡 Tip: [one useful tip related to the answer]
- If the answer is not in the document say:
  "❌ I couldn't find that in the document."

Document:
${pdfText}

User Question: ${question}
```

### 3. `renderMessage(text, sender)`
- sender is either "user" or "ai"
- For AI messages parse the response:
  - Convert **text** to <strong>text</strong>
  - Convert # Heading to <h3> tags
  - Convert lines starting with - to <li> items wrapped in <ul>
  - Convert \n\n to </p><p> paragraph breaks
  - Convert \n to <br>
- Insert as innerHTML so formatting renders properly

### 4. Chat bubble CSS rules:
```
User bubble:
- Right aligned
- Background: #06b6d4 (cyan)
- Color: white
- Border radius: 18px 18px 4px 18px
- Padding: 12px 16px
- Max width: 75%
- Font size: 15px
- Line height: 1.8

AI bubble:
- Left aligned
- Background: #1e293b (card color)
- Color: white
- Border radius: 18px 18px 18px 4px
- Padding: 12px 16px
- Max width: 80%
- Font size: 15px
- Line height: 1.8

AI bubble headings (h3):
- Font size: 16px
- Font weight: 600
- Margin: 12px 0 6px 0
- Color: #06b6d4

AI bubble paragraphs (p):
- Margin: 8px 0

AI bubble lists (ul, li):
- Margin: 6px 0
- Padding left: 20px
```

---

## 🎨 Design Style (Both Pages)

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

---

## ✅ Feature Checklist (Build in this order)

- [ ] index.html structure with upload, results, pagination sections
- [ ] style.css dark theme
- [ ] PDF upload and full text extraction with pdf.js
- [ ] Role selector (3 buttons, one active at a time)
- [ ] Pagination logic (50 pages per batch)
- [ ] Gemini API call for key points as JSON
- [ ] Render key points with page number and priority badges
- [ ] Pagination buttons (Previous / Next) with correct show/hide logic
- [ ] Copy All Points button
- [ ] "💬 Chat with PDF" button that saves data to sessionStorage
- [ ] Loading spinner during API calls
- [ ] Error messages for wrong API key or failed PDF load
- [ ] chat.html with full page chat interface
- [ ] chat.js with sendMessage, renderMessage functions
- [ ] Professional chat bubble styling
- [ ] AI response formatting (headings, paragraphs, lists)
- [ ] Auto scroll to latest message in chat
- [ ] Back button in chat.html to return to index.html

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

1. *"Write the extractTextFromPDF function using pdf.js that stores all pages globally"*
2. *"Write the loadBatch function that handles 50-page pagination logic"*
3. *"Write the getKeyPoints function that calls Gemini API and parses the JSON response"*
4. *"Create chat.html with full page chat interface using dark theme"*
5. *"Write the renderMessage function that converts AI text to formatted HTML"*
6. *"Help me add error handling to the Gemini API call"*

---

## 🏆 Hackathon Requirements Fulfilled

| Requirement                  | How it's met                                           |
|------------------------------|--------------------------------------------------------|
| GitHub Copilot Usage         | Used throughout to write all JS functions and CSS      |
| Microsoft IQ Integration     | Planned future integration with Microsoft Foundry IQ   |
| Creative Application         | Role-based PDF analysis with pagination and chat page  |
| Security                     | API key stored in sessionStorage only, never hardcoded |
| No backend knowledge needed  | 100% frontend — HTML + CSS + JS only                   |