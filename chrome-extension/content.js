// Content Script for PromptCraft Chrome Extension

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
        const selectedText = window.getSelection().toString().trim();
        sendResponse({ text: selectedText });
    }
    
    if (request.action === 'copyToClipboard') {
        copyToClipboard(request.text);
        sendResponse({ success: true });
    }
    
    if (request.action === 'enhanceSelection') {
        const selectedText = window.getSelection().toString().trim();
        if (selectedText) {
            enhanceAndReplace(selectedText);
        }
    }
});

// Copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

// Enhance selected text and show in modal
function enhanceAndReplace(text) {
    chrome.runtime.sendMessage(
        { action: 'enhance', text: text },
        (response) => {
            if (response.success) {
                showEnhancedModal(response.enhanced);
            } else {
                showErrorModal(response.error);
            }
        }
    );
}

// Show enhanced prompt in modal overlay
function showEnhancedModal(enhancedText) {
    // Remove existing modal if any
    const existing = document.getElementById('promptcraft-modal');
    if (existing) {
        existing.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'promptcraft-modal';
    modal.innerHTML = `
        <div class="promptcraft-overlay">
            <div class="promptcraft-modal-content">
                <div class="promptcraft-header">
                    <h3>✨ Enhanced Prompt - PromptCraft</h3>
                    <button class="promptcraft-close">&times;</button>
                </div>
                <div class="promptcraft-body">
                    <textarea readonly>${enhancedText}</textarea>
                </div>
                <div class="promptcraft-footer">
                    <button class="promptcraft-btn-copy">📋 Copy</button>
                    <button class="promptcraft-btn-close">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    const closeBtn = modal.querySelector('.promptcraft-close');
    const closeBtnFooter = modal.querySelector('.promptcraft-btn-close');
    const copyBtn = modal.querySelector('.promptcraft-btn-copy');
    const textarea = modal.querySelectasync () => {
        try {
            await navigator.clipboard.writeText(textarea.value);
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
            }, 2000);
        } catch (err) {
            // Fallback
            textarea.select();
            document.execCommand('copy');
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copy';
            }, 2000);
        }select();
        document.execCommand('copy');
        copyBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyBtn.textContent = '📋 Copy';
        }, 2000);
    });
    
    // Close on overlay click
    modal.querySelector('.promptcraft-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('promptcraft-overlay')) {
            modal.remove();
        }
    });
    
    // Auto-select text
    textarea.select();
}

function showErrorModal(error) {
    alert('PromptCraft: ' + error);
}
