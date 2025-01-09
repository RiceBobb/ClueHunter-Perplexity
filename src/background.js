import { clueHunt } from "@rice-bobb/cluehunter";
import { env } from "@xenova/transformers";

// Due to a bug in onnxruntime-web, we must disable multithreading for now.
// See https://github.com/microsoft/onnxruntime/issues/14445 for more information.
env.backends.onnx.wasm.numThreads = 1;

chrome.webRequest.onCompleted.addListener(
  (details) => {
    console.log("Perplexity Conversation Answer Done");
    // Send message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "runPerplexityMain" });
    });
  },
  { urls: ["*://*.perplexity.ai/rest/thread/*"] }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "elementClicked") {
    console.log("Element clicked:", message.data);

    if (message.data.isCitation) {
      console.log("Citation clicked:", message.data.answer);
      chrome.storage.local.set({
        perplexity_cluehunter_recent: {
          url: message.data.href,
          answer: message.data.answer,
        },
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "webPageLoaded") {
    const currentUrl = message.data.url;
    console.log("Web page loaded:", currentUrl);

    chrome.storage.local.get(
      ["perplexity_cluehunter_recent"],
      async (result) => {
        const recent = result["perplexity_cluehunter_recent"];

        if (recent && compareURLs(recent.url, currentUrl)) {
          const parsedText = message.data.text;
          const answer = recent.answer;
          const highlightedText = await clueHunt(answer, parsedText);

          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "highlightCitation",
              data: highlightedText,
            });
          });
        }
      }
    );
  }
});

function compareURLs(url1, url2) {
  const parseURL = (urlString) => {
    // Remove protocol if exists
    const withoutProtocol = urlString.replace(/^(?:https?:)?(?:\/\/)?/, '');
    
    // Split into hostname and path
    const [hostname, ...pathParts] = withoutProtocol.split('/');
    const path = pathParts.length > 0 ? '/' + pathParts.join('/') : '/';
    
    return {
      hostname: hostname.replace(/^www\./, ''),
      pathname: path.replace(/\/$/, '')
    };
  };

  const normalizeURL = (url) => {
    const parsed = parseURL(url);
    return `${parsed.hostname}${parsed.pathname}`;
  };

  return normalizeURL(url1) === normalizeURL(url2);
}
