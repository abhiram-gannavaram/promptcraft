// PromptCraft Chrome Extension - Popup Script

const API_ENDPOINT = 'https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt';

// DOM Elements
const promptInput = document.getElementById('promptInput');
const toneSelect = document.getElementById('toneSelect');
const lengthSelect = document.getElementById('lengthSelect');
const enhanceBtn = document.getElementById('enhanceBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const newBtn = document.getElementById('newBtn');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const outputSection = document.getElementById('outputSection');
const enhancedPrompt = document.getElementById('enhancedPrompt');
const stats = document.getElementById('stats');
const tokensUsed = document.getElementById('tokensUsed');
const costAmount = document.getElementById('costAmount');
const processingTime = document.getElementById('processingTime');

// Check if there's selected text on the page
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getSelectedText'}, (response) => {
        if (response && response.text) {
            promptInput.value = response.text;
        }
    });
});

// Load saved options
chrome.storage.sync.get(['tone', 'length'], (result) => {
    if (result.tone) toneSelect.value = result.tone;
    if (result.length) lengthSelect.value = result.length;
});

// Save options when changed
toneSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ tone: toneSelect.value });
});

lengthSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ length: lengthSelect.value });
});

// Enhance button click
enhanceBtn.addEventListener('click', enhancePrompt);

// Clear button click
clearBtn.addEventListener('click', () => {
    promptInput.value = '';
    promptInput.focus();
    hideOutput();
    hideError();
});

// Copy button click
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(enhancedPrompt.textContent).then(() => {
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
        }, 2000);
        
        // Track usage
        trackUsage();
    });
});

// New prompt button
newBtn.addEventListener('click', () => {
    hideOutput();
    promptInput.value = '';
    promptInput.focus();
});

// Allow Enter key to enhance (Ctrl+Enter)
promptInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        enhancePrompt();
    }
});

// Main enhance function
async function enhancePrompt() {
    const inputText = promptInput.value.trim();
    
    if (!inputText) {
        showError('Please enter a prompt first');
        promptInput.focus();
        return;
    }
    
    if (inputText.length < 3) {
        showError('Prompt too short. Please enter at least 3 characters.');
        return;
    }
    
    if (inputText.length > 2000) {
        showError('Prompt too long. Please limit to 2000 characters.');
        return;
    }
    
    // Show loading, hide previous output
    showLoading();
    hideOutput();
    hideError();
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: inputText,
                options: {
                    tone: toneSelect.value,
                    length: lengthSelect.value
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Display enhanced prompt
        enhancedPrompt.textContent = data.enhancedPrompt || 'No response generated';
        
        // Display stats if available
        if (data.metadata) {
            const totalTokens = (data.metadata.tokens?.input || 0) + (data.metadata.tokens?.output || 0);
            tokensUsed.textContent = totalTokens;
            costAmount.textContent = data.metadata.cost ? `$${data.metadata.cost.toFixed(6)}` : '--';
            processingTime.textContent = data.metadata.processingTime || '--';
            stats.style.display = 'flex';
        }
        
        hideLoading();
        showOutput();
        
        // Save to history
        saveToHistory(inputText, data.enhancedPrompt);
        
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to enhance prompt. Please try again.');
        console.error('Enhancement error:', error);
    }
}

// UI Helper Functions
function showLoading() {
    loading.classList.add('show');
    enhanceBtn.disabled = true;
}

function hideLoading() {
    loading.classList.remove('show');
    enhanceBtn.disabled = false;
}

function showOutput() {
    outputSection.classList.add('show');
}

function hideOutput() {
    outputSection.classList.remove('show');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

// Save to local history
function saveToHistory(original, enhanced) {
    chrome.storage.local.get(['history'], (result) => {
        const history = result.history || [];
        history.unshift({
            original,
            enhanced,
            timestamp: Date.now(),
            tone: toneSelect.value,
            length: lengthSelect.value
        });
        
        // Keep only last 50 items
        if (history.length > 50) {
            history.pop();
        }
        
        chrome.storage.local.set({ history });
    });
}

// Track usage statistics
function trackUsage() {
    chrome.storage.local.get(['usageStats'], (result) => {
        const stats = result.usageStats || {
            totalEnhancements: 0,
            totalCopies: 0,
            lastUsed: null
        };
        
        stats.totalCopies++;
        stats.lastUsed = Date.now();
        
        chrome.storage.local.set({ usageStats: stats });
    });
}

// Update usage count on enhance
function updateUsageStats() {
    chrome.storage.local.get(['usageStats'], (result) => {
        const stats = result.usageStats || {
            totalEnhancements: 0,
            totalCopies: 0,
            lastUsed: null
        };
        
        stats.totalEnhancements++;
        stats.lastUsed = Date.now();
        
        chrome.storage.local.set({ usageStats: stats });
    });
}

// Call updateUsageStats when enhancement succeeds
const originalEnhance = enhancePrompt;
enhancePrompt = async function() {
    await originalEnhance.call(this);
    if (outputSection.classList.contains('show')) {
        updateUsageStats();
    }
};
