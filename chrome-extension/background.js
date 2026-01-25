// Background Service Worker for PromptCraft Chrome Extension

const API_ENDPOINT = 'https://njzzp0serg.execute-api.us-east-1.amazonaws.com/prod/generate-prompt';

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'enhanceWithPromptCraft',
        title: 'Enhance with PromptCraft',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'enhanceWithPromptCraft') {
        const selectedText = info.selectionText;
        
        // Open popup or send to content script
        enhanceTextInPlace(selectedText, tab.id);
    }
});

// Handle keyboard shortcut command
chrome.commands.onCommand.addListener((command) => {
    if (command === 'enhance-prompt') {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'enhanceSelection'});
        });
    }
});

// Enhance text and show notification
async function enhanceTextInPlace(text, tabId) {
    try {
        // Show loading notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PromptCraft',
            message: 'Enhancing your prompt...'
        });
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: text,
                options: {
                    tone: 'professional',
                    length: 'balanced'
                }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        
        // Copy enhanced prompt to clipboard
        chrome.tabs.sendMessage(tabId, {
            action: 'copyToClipboard',
            text: data.enhancedPrompt
        });
        
        // Show success notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PromptCraft ✅',
            message: 'Enhanced prompt copied to clipboard!'
        });
        
    } catch (error) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PromptCraft ❌',
            message: 'Failed to enhance prompt. Please try again.'
        });
    }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'enhance') {
        enhanceText(request.text).then(sendResponse);
        return true; // Will respond asynchronously
    }
});

async function enhanceText(text) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: text,
                options: {
                    tone: 'professional',
                    length: 'balanced'
                }
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return { success: true, enhanced: data.enhancedPrompt };
        
    } catch (error) {
        if (error.name === 'AbortError') {
            return { success: false, error: 'Request timeout' };
        }
        return { success: false, error: error.message };
    }
}
