// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.

// Example usage:
// const message = {
//     action: 'classify',
//     text: 'text to classify',
// }
// chrome.runtime.sendMessage(message, (response) => {
//     console.log('received user data', response)
// });
// Get current URL
console.log(`Is Perplexity? : ${isPerplexity(window.location.href)}`);

// Listen for visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        if (isPerplexity(window.location.href)) {
            perplexity_main();
        } else {
            console.log('Not Perplexity');
        }
    }
});

function isPerplexity(url) {
    return url.startsWith('https://www.perplexity.ai/search');
}

function perplexity_main() {
    // Main Function to run the perplexity script
    console.log("JAX!");
}
