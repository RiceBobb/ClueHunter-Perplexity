chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveContent') {
        console.log('Received content:', message);
        const storageKey = `perplexity_${message.session}`;
        
        // Required for async response
        return true;
    }
});
