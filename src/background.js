chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveContent") {
    console.log("Received content:", message);
    const storageKey = `perplexity_${message.session}`;

    // Required for async response
    return true;
  }
});

chrome.webRequest.onCompleted.addListener(
  (details) => {
      console.log("Perplexity Conversation Answer Done");
      // Send message to content script
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "runPerplexityMain"});
      });
  }, 
  {urls: ['*://*.perplexity.ai/rest/thread/*']},
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'elementClicked') {
    console.log('Element clicked:', message.data);
    
    if (message.data.isCitation) {
      console.log('Citation clicked:', message.data.answer);
      chrome.storage.local.set({
        'perplexity_cluehunter_recent': {
          url: message.data.href,
          answer: message.data.answer
        }
      });
    }
  }
});
