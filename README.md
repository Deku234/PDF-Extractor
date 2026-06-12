# 📄 PDF KeyPoint Extractor

![HTML](https://img.shields.io/badge/HTML-E34C26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

Upload any PDF and instantly get role-based key points with page numbers powered by AI.

---

## 🎯 Problem Statement

Reading long PDFs is frustrating and time-consuming. Different professionals—students, researchers, and business analysts—need different information from the same document, but existing tools don't provide:

- **Role-based extraction** tailored to your needs
- **Exact page references** so you know where to find information
- **Priority scoring** to identify what matters most

**PDF KeyPoint Extractor** solves this with AI-powered, intelligent document analysis.

---

## ✨ Features

- 🎓 **Role-Based Extraction** - Get key points customized for Student, Professional, or Researcher roles
- 📍 **Page Number References** - Know exactly where each key point appears in the document
- 🎯 **Priority Scoring** - Identify high, medium, and low priority points at a glance
- 💬 **Ask the PDF** - Chat interface to ask questions directly about your document
- � **Smart Pagination** - Large PDFs (50+ pages) are processed in batches of 50 pages with Previous/Next navigation so the app never gets overloaded
- 💬 **Dedicated Chat Page** - A full chat interface on a separate page (chat.html) for deep conversation with your PDF, with professional chat bubbles and formatted AI responses
- �📋 **Copy All Points** - Export all key points to clipboard with one click
- 🚀 **100% Browser-Based** - No backend, no server, no database needed
- 🔒 **Privacy First** - Your API key stays in your browser, never stored or logged

---

## 🛠️ Tech Stack

| Component                    | Technology                    |
|------------------------------|-------------------------------|
| **Frontend**                 | HTML, CSS, Vanilla JavaScript |
| **AI Engine**                | Google Gemini API (Free Tier) |
| **PDF Processing**           | PDF.js (Mozilla)              |
| **Hosting**                  | GitHub Pages (Static)         |
| **Browser APIs**             | Fetch API, Clipboard API      |

---

## 🚀 How to Use

### Step 1: Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **"Get API Key"** and create a new key
4. Copy the API key

### Step 2: Open the App
Visit: [PDF KeyPoint Extractor Live Demo](https://Deku234.github.io/PDF-Extractor)

### Step 3: Paste API Key
Paste your Gemini API key into the **"Paste your Gemini API key"** field

### Step 4: Upload PDF
Click **"📄 Upload PDF"** and select any PDF file from your computer

### Step 5: Select Your Role
Choose one:
- 🎓 **Student** - Focused on learning concepts, theory, and educational value
- 💼 **Professional** - Focused on practical applications, actionable insights, and business value
- 🔬 **Researcher** - Focused on citations, methodology, data, and findings

### Step 6: Get Instant Key Points
The AI analyzes your PDF and returns 5-8 key points with:
- 📄 Page number for each point
- 🎯 Priority level (High/Medium/Low)

### Step 7: Ask Questions
Use the **"Ask the PDF"** chat box to ask any question about your document. The AI answers based only on the document content.

### Step 8: Navigate Large PDFs
If your PDF has more than 50 pages:
- The app processes first 50 pages automatically
- Click **"Next 50 Pages →"** to analyze the next batch
- Click **"← Previous 50 Pages"** to go back
- A page counter shows: "Showing pages 1-50 of 120"

### Step 9: Open Full Chat Page
- Click **"💬 Chat with PDF"** button in results section
- A dedicated chat page opens with full conversation interface
- Chat bubbles show your questions and AI answers professionally
- AI responses include headings, paragraphs and emojis
- Click **"← Back"** to return to main page

---

## 💡 GitHub Copilot Usage

This project was built entirely with GitHub Copilot:

- **Copilot Chat** - Used to generate the three core files (`index.html`, `style.css`, `app.js`)
- **Autocomplete** - Copilot provided intelligent code suggestions for CSS styling and JavaScript logic
- **Debugging** - Copilot helped identify and fix API integration issues
- **API Migration** - Copilot assisted in migrating from Anthropic API to Google Gemini API with minimal changes
- **Function Generation** - Used Copilot to implement `extractTextFromPDF()`, `getKeyPoints()`, and `askQuestion()` functions
- **Pagination Logic** - Copilot wrote the complete 50-page batch processing and navigation system
- **Chat Page** - Copilot generated entire chat.html and chat.js with professional bubble UI
- **Response Formatting** - Copilot helped implement markdown-to-HTML parser for AI chat responses

---

## 🎬 Live Demo

🔗 **[Open PDF KeyPoint Extractor](https://Deku234.github.io/PDF-Extractor)**

---

## 📸 Screenshots

### Hero Section
![Upload Interface](screenshots/hero.png)

### Key Points Display
![Key Points Results](screenshots/results.png)

### Chat Interface
![Ask the PDF Chat](screenshots/chat.png)

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

---

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

## 🏆 Hackathon Requirements Fulfilled

| Requirement                  | How it's met                                                                                |
|------------------------------|--------------------------------------------------------------------------------------------|
| **GitHub Copilot Usage**     | Used to generate all 3 core files (index.html, style.css, app.js),autocomplete for CSS, debugging API issues, pagination logic, chat page generation, and response formatting |
| **Microsoft IQ Integration** | Planned future integration with Microsoft Foundry IQ |
| **Creative Application**     | Role-based PDF analysis with 50-page smart pagination, dedicated chat page with professional formatting, and priority scoring |
| **Security**                 | API key stored in sessionStorage only, never hardcoded or logged |
| **No Backend Knowledge**     | 100% frontend — HTML, CSS, and Vanilla JavaScript only |

---

**Made with ❤️ using GitHub Copilot** 
