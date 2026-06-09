// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global state
let currentPdfData = null;
let currentRole = 'Student';

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
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const pageTexts = {};
        let fullText = '';

        // Extract text from all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            pageTexts[pageNum] = pageText;
            fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
        }

        return {
            fullText: fullText,
            pageTexts: pageTexts,
            totalPages: pdf.numPages
        };
    } catch (error) {
        showError('Failed to read PDF. Please ensure it\'s a valid PDF file.');
        console.error('PDF extraction error:', error);
        throw error;
    }
}

// ===== GET KEY POINTS FROM ANTHROPIC API =====
async function getKeyPoints(pdfData, role, apiKey) {
    if (!apiKey.trim()) {
        showError('Please enter your Gemini API key.');
        return null;
    }

    const prompt = `You are analyzing a PDF document for a ${role}.

Here is the full document text:
${pdfData.fullText}

Extract the 5 to 8 most important key points relevant to a ${role}.
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
Page numbers must be integers between 1 and ${pdfData.totalPages}.
Return only the JSON array, nothing else.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
        keyPointsList.innerHTML = '<p style="color: var(--text-light);">No key points found.</p>';
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
}

// ===== ASK QUESTION FUNCTION =====
async function askQuestion(question, pdfText, apiKey) {
    if (!question.trim()) {
        showError('Please type a question.');
        return;
    }

    if (!apiKey.trim()) {
        showError('Please enter your Anthropic API key.');
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
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

        responseText.textContent = answer;
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
        showError('Please enter your Anthropic API key first.');
        return;
    }

    showLoading();
    errorMessage.style.display = 'none';

    try {
        // Extract text from PDF
        currentPdfData = await extractTextFromPDF(file);

        // Get key points
        const keyPoints = await getKeyPoints(currentPdfData, currentRole, apiKey);

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
        if (currentPdfData) {
            showLoading();
            const apiKey = apiKeyInput.value;
            getKeyPoints(currentPdfData, currentRole, apiKey).then(keyPoints => {
                if (keyPoints) {
                    renderKeyPoints(keyPoints);
                    resultsSection.style.display = 'block';
                }
                hideLoading();
            });
        }
    });
});

// Copy all points button
copyAllBtn.addEventListener('click', copyAllPoints);

// Send question button
sendBtn.addEventListener('click', () => {
    if (currentPdfData) {
        askQuestion(questionInput.value, currentPdfData.fullText, apiKeyInput.value);
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
