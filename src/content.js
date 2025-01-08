if (isPerplexity(window.location.href)) {
    perplexity_main();
} else {
    console.log(document.body.innerText); // Parsing
}

function isPerplexity(url) {
    return url.startsWith('https://www.perplexity.ai/search');
}

function perplexity_main() {
    // Set up mutation observer to track dynamic content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                extractPerplexityContent();
            }
        });
    });

    // Start observing the main content area
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial content extraction
    extractPerplexityContent();
}

function extractPerplexityContent() {
    try {
        // Extract question/prompt
        const firstQuestionNode = document.querySelector('h1.text-3xl.font-display');
        const firstQuestion = firstQuestionNode ? firstQuestionNode.textContent.trim() : '';
        const nextQuestionsNode = document.querySelectorAll('div.text-3xl.font-display');
        const nextQuestionElems = Array.from(nextQuestionsNode).map(elem => elem.textContent.trim());
        const questionList = [firstQuestion, ...nextQuestionElems];

        // Extract answer
        const answerElement = document.querySelector('[class*="markdown prose"]');
        const answer = answerElement ? answerElement.textContent.trim() : '';

        // Extract sources if available
        const sources = Array.from(document.querySelectorAll('[class*="cite-source"]'))
            .map(source => source.textContent.trim());

        const content = {
            questionList,
            answer,
            sources,
            timestamp: new Date().toISOString()
        };

        console.log('Extracted Perplexity content:', content);

        // Optional: Send to background script
        chrome.runtime.sendMessage({
            action: 'saveContent',
            content: content
        });
    } catch (error) {
        console.error('Error extracting content:', error);
    }
}

function extractQuery() {

}
