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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'webPageLoaded') {
    const currentUrl = message.data;
    console.log('Web page loaded:', currentUrl);
    
    chrome.storage.local.get('perplexity_cluehunter_recent', (result) => {
      const recent = result['perplexity_cluehunter_recent'];
      if (recent && compareURLs(recent.url,currentUrl)) {
        console.log('Found recent:', recent);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'highlightCitation',
            data: recent.answer
          });
        });
      }
    });
  }
});

function compareURLs(url1, url2) {
  const parseURL = (url) => {
    try {
      return new URL(url);
    } catch {
      // If parsing fails, try adding a protocol
      return new URL(`http://${url}`);
    }
  };

  const normalizeURL = (url) => {
    const parsedURL = parseURL(url);
    let hostname = parsedURL.hostname.replace(/^www\./, '');
    let pathname = parsedURL.pathname.replace(/\/$/, '');
    return `${hostname}${pathname}`;
  };

  return normalizeURL(url1) === normalizeURL(url2);
}
