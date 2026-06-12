// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

// Initialize theme from localStorage or system preference
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let theme = savedTheme || (prefersDark ? 'dark' : 'light');
    
    htmlElement.setAttribute('data-theme', theme);
    themeToggle.checked = theme === 'dark';
}

// Toggle theme
function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.checked = newTheme === 'dark';
}

themeToggle.addEventListener('change', toggleTheme);

// Initialize theme on page load
initializeTheme();

// Global state
let currentPdfData = null;
let currentRole = 'Student';
let pdfPageTexts = {};
let totalPages = 0;
let currentPageStart = 1;
let currentFileName = '';

// DOM Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const uploadBtn = document.getElementById('uploadBtn');
const pdfUpload = document.getElementById('pdfUpload');
const roleButtons = document.querySelectorAll('.role-btn');
const resultsSection = document.getElementById('resultsSection');
const keyPointsList = document.getElementById('keyPointsList');
const loadingSpinner = document.getElementById('loadingSpinner');
const copyAllBtn = document.getElementById('copyAllBtn');
const questionInput = document.getElementById('questionInput');
const sendBtn = document.getElementById('sendBtn');
const chatResponse = document.getElementById('chatResponse');
const responseText = document.getElementById('responseText');
const errorMessage = document.getElementById('errorMessage');

// ===== EXTRACT TEXT FROM PDF =====
async function extractTextFromPDF(file) {
    try {
        currentFileName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        totalPages = pdf.numPages;
        const pageTexts = {};
        let fullText = '';

        // Extract text from all pages sequentially to maintain order
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join(' ');
            pageTexts[i] = text;
            fullText += text + ' ';
        }

        // Sort pageTexts by page number
        const sortedPageTexts = {};
        Object.keys(pageTexts)
            .sort((a, b) => Number(a) - Number(b))
            .forEach(key => {
                sortedPageTexts[key] = pageTexts[key];
            });

        pdfPageTexts = sortedPageTexts;

        return {
            fullText: fullText.trim(),
            pageTexts: sortedPageTexts,
            totalPages: pdf.numPages
        };
    } catch (error) {
        showError('Failed to read PDF. Please ensure it\'s a valid PDF file.');
        console.error('PDF extraction error:', error);
        throw error;
    }
}

// ===== GET PAGE RANGE TEXT =====
function getPageRangeText(startPage, endPage) {
    let text = '';
    for (let i = startPage; i <= endPage; i++) {
        if (pdfPageTexts[i]) {
            text += `\n\n--- Page ${i} ---\n${pdfPageTexts[i]}`;
        }
    }
    return text;
}

// ===== GET KEY POINTS FROM GEMINI API =====
async function getKeyPoints(startPage, endPage, role, apiKey) {
    if (!apiKey.trim()) {
        showError('Please enter your Gemini API key.');
        return null;
    }

    // Build text for the current page range
    const rangeText = getPageRangeText(startPage, endPage);

    const prompt = `You are analyzing a PDF document for a ${role}.

Here is the document text from pages ${startPage} to ${endPage}:
${rangeText}

Extract the 5 to 8 most important key points relevant to a ${role} from these pages.
For each key point, identify the approximate page number from the context.

Return ONLY a JSON array with no other text. No markdown. No explanation. Format exactly like this:
[
  {
    "point": "The main argument of the document is...",
    "page": 3,
    "priority": "high"
  },
  {
    "point": "Another key finding is...",
    "page": 5,
    "priority": "medium"
  }
]

Priority must be one of: "high", "medium", "low"
Page numbers must be integers between ${startPage} and ${endPage}.
Return only the JSON array, nothing else.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                showError('Invalid API key. Please check and try again.');
            } else {
                showError(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }
            console.error('API Error:', errorData);
            return null;
        }

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text.trim();

        // Parse JSON response
        const keyPoints = JSON.parse(resultText);
        return keyPoints;
    } catch (error) {
        if (error instanceof SyntaxError) {
            showError('Failed to parse API response. Please try again.');
        } else {
            showError('API request failed. Please check your connection and API key.');
        }
        console.error('API Error:', error);
        return null;
    }
}

// ===== RENDER KEY POINTS =====
function renderKeyPoints(keyPoints) {
    keyPointsList.innerHTML = '';

    if (!keyPoints || keyPoints.length === 0) {
        keyPointsList.innerHTML = '<p style="color: var(--text-muted);">No key points found.</p>';
        return;
    }

    keyPoints.forEach((kp, index) => {
        const card = document.createElement('div');
        card.className = 'key-point-card';

        const priorityClass = `badge-${kp.priority || 'medium'}`;
        const priorityLabel = (kp.priority || 'medium').charAt(0).toUpperCase() + (kp.priority || 'medium').slice(1);

        card.innerHTML = `
            <p class="key-point-text">${escapeHtml(kp.point)}</p>
            <div class="key-point-badges">
                <span class="badge badge-page">Page ${kp.page}</span>
                <span class="badge ${priorityClass}">${priorityLabel}</span>
            </div>
        `;

        keyPointsList.appendChild(card);
    });

    // Add pagination controls if PDF has more than 50 pages
    if (totalPages > 50) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'pagination-controls';
        paginationDiv.style.marginTop = '30px';
        paginationDiv.style.textAlign = 'center';

        // Page range info
        const pageEndInfo = Math.min(currentPageStart + 49, totalPages);
        const rangeInfo = document.createElement('p');
        rangeInfo.style.marginBottom = '16px';
        rangeInfo.style.color = 'var(--text-muted)';
        rangeInfo.style.fontSize = '0.9rem';
        rangeInfo.textContent = `Showing pages ${currentPageStart}-${pageEndInfo} of ${totalPages}`;
        paginationDiv.appendChild(rangeInfo);

        // Buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '12px';
        buttonsDiv.style.justifyContent = 'center';
        buttonsDiv.style.flexWrap = 'wrap';

        // Previous button
        if (currentPageStart > 1) {
            const prevBtn = document.createElement('button');
            prevBtn.className = 'btn btn-secondary';
            prevBtn.textContent = '← Previous 50 Pages';
            prevBtn.addEventListener('click', () => {
                currentPageStart = Math.max(1, currentPageStart - 50);
                loadPageRange();
            });
            buttonsDiv.appendChild(prevBtn);
        }

        // Next button
        if (pageEndInfo < totalPages) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'btn btn-secondary';
            nextBtn.textContent = 'Next 50 Pages →';
            nextBtn.addEventListener('click', () => {
                currentPageStart += 50;
                loadPageRange();
            });
            buttonsDiv.appendChild(nextBtn);
        }

        paginationDiv.appendChild(buttonsDiv);
        keyPointsList.parentElement.appendChild(paginationDiv);
    }
}

// ===== LOAD PAGE RANGE =====
async function loadPageRange() {
    showLoading();
    const apiKey = apiKeyInput.value;
    const pageEnd = Math.min(currentPageStart + 49, totalPages);

    const keyPoints = await getKeyPoints(currentPageStart, pageEnd, currentRole, apiKey);

    if (keyPoints) {
        renderKeyPoints(keyPoints);
        resultsSection.style.display = 'block';
        hideLoading();
        // Scroll to top of results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        hideLoading();
    }
}

// ===== FORMAT CHAT RESPONSE =====
function formatChatResponse(text) {
    // Escape HTML entities first
    let html = escapeHtml(text);

    // Convert bold **text** to <strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert headings # Heading to <h2>
    html = html.replace(/^# (.*?)$/gm, '<h2 style="margin: 16px 0 12px 0; font-size: 1.3rem;">$1</h2>');

    // Convert subheadings ## Heading to <h3>
    html = html.replace(/^## (.*?)$/gm, '<h3 style="margin: 12px 0 10px 0; font-size: 1.1rem;">$1</h3>');

    // Convert list items - item to <li>
    const lines = html.split('\n');
    let inList = false;
    let formattedLines = [];

    for (let line of lines) {
        if (line.match(/^\s*[-•]\s+/)) {
            if (!inList) {
                formattedLines.push('<ul style="margin: 12px 0; padding-left: 24px;">');
                inList = true;
            }
            line = line.replace(/^\s*[-•]\s+/, '');
            formattedLines.push(`<li>${line}</li>`);
        } else {
            if (inList && line.trim() !== '') {
                formattedLines.push('</ul>');
                inList = false;
            }
            formattedLines.push(line);
        }
    }

    if (inList) {
        formattedLines.push('</ul>');
    }

    html = formattedLines.join('\n');

    // Convert double newlines to paragraph breaks
    html = html.replace(/\n\n+/g, '</p><p style="margin: 12px 0;">');

    // Convert single newlines to <br>
    html = html.replace(/\n/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!html.includes('<p>')) {
        html = `<p style="margin: 0;">${html}</p>`;
    }

    return html;
}

// ===== ASK QUESTION FUNCTION =====
async function askQuestion(question, pdfText, apiKey) {
    if (!question.trim()) {
        showError('Please type a question.');
        return;
    }

    if (!apiKey.trim()) {
        showError('Please enter your Gemini API key.');
        return;
    }

    const prompt = `You are a document assistant. Answer the user's question using ONLY the content from the document below. If the answer is not in the document, say: "I couldn't find that in the document."

Document:
${pdfText}

User Question: ${question}`;

    try {
        chatResponse.style.display = 'none';
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 401) {
                showError('Invalid API key. Please check and try again.');
            } else {
                showError(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }
            return;
        }

        const data = await response.json();
        const answer = data.candidates[0].content.parts[0].text;

        // Format and display the response
        responseText.innerHTML = formatChatResponse(answer);
        chatResponse.style.display = 'block';
        questionInput.value = '';
    } catch (error) {
        showError('Failed to get answer. Please try again.');
        console.error('Question Error:', error);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send';
    }
}

// ===== COPY ALL POINTS =====
function copyAllPoints() {
    const points = Array.from(document.querySelectorAll('.key-point-text'))
        .map(el => el.textContent.trim())
        .join('\n\n');

    if (!points) {
        showError('No points to copy.');
        return;
    }

    navigator.clipboard.writeText(points).then(() => {
        const originalText = copyAllBtn.textContent;
        copyAllBtn.textContent = '✓ Copied!';
        setTimeout(() => {
            copyAllBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        showError('Failed to copy to clipboard.');
        console.error('Copy error:', error);
    });
}

// ===== UTILITY FUNCTIONS =====
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showLoading() {
    loadingSpinner.style.display = 'block';
    resultsSection.style.display = 'none';
}

// ===== EVENT LISTENERS =====

// Upload button
uploadBtn.addEventListener('click', () => {
    pdfUpload.click();
});

// PDF file selected
pdfUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const apiKey = apiKeyInput.value;
    if (!apiKey.trim()) {
        showError('Please enter your Gemini API key first.');
        return;
    }

    showLoading();
    errorMessage.style.display = 'none';

    try {
        // Extract text from PDF
        await extractTextFromPDF(file);

        // Reset pagination
        currentPageStart = 1;

        // Save to sessionStorage for chat.html
        const pdfContent = getPageRangeText(1, Math.min(50, totalPages));
        sessionStorage.setItem('pdfText', pdfContent);
        sessionStorage.setItem('fullPdfText', getPageRangeText(1, totalPages));
        sessionStorage.setItem('pdfFileName', currentFileName);
        sessionStorage.setItem('apiKey', apiKey);
        sessionStorage.setItem('pdfPageTexts', JSON.stringify(pdfPageTexts));
        sessionStorage.setItem('totalPages', totalPages);

        // Get key points for first 50 pages
        const pageEnd = Math.min(50, totalPages);
        const keyPoints = await getKeyPoints(1, pageEnd, currentRole, apiKey);

        if (keyPoints) {
            renderKeyPoints(keyPoints);
            resultsSection.style.display = 'block';
            hideLoading();
        } else {
            hideLoading();
        }
    } catch (error) {
        hideLoading();
        console.error('Upload error:', error);
    }
});

// Role buttons
roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        roleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRole = btn.getAttribute('data-role');

        // Re-extract key points with new role if PDF is loaded
        if (totalPages > 0) {
            currentPageStart = 1;
            loadPageRange();
        }
    });
});

// Copy all points button
copyAllBtn.addEventListener('click', copyAllPoints);

// Send question button
sendBtn.addEventListener('click', () => {
    if (totalPages > 0) {
        const fullPdfText = getPageRangeText(1, totalPages);
        askQuestion(questionInput.value, fullPdfText, apiKeyInput.value);
    } else {
        showError('Please upload a PDF first.');
    }
});

// Enter key in question input
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendBtn.click();
    }
});

// Chat with PDF button
const chatWithPdfBtn = document.getElementById('chatWithPdfBtn');
if (chatWithPdfBtn) {
    chatWithPdfBtn.addEventListener('click', () => {
        // Save data to sessionStorage
        const fullPdfText = getPageRangeText(1, totalPages);
        sessionStorage.setItem('pdfText', fullPdfText);
        sessionStorage.setItem('pdfFileName', currentFileName);
        sessionStorage.setItem('apiKey', apiKeyInput.value);
        sessionStorage.setItem('pdfPageTexts', JSON.stringify(pdfPageTexts));
        sessionStorage.setItem('totalPages', totalPages);
        
        // Redirect to chat.html
        window.location.href = 'chat.html';
    });
}
