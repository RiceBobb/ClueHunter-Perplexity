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
        const conversationNodes = getConversationNodes(document);
        const dataList = conversationNodes.map(extractData);
        console.log("Perplexity data:", dataList);

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

        // Optional: Send to background script
        chrome.runtime.sendMessage({
            action: 'saveContent',
            content: content
        });
    } catch (error) {
        console.error('Error extracting content:', error);
    }
}

function extractData(node) {
    const question = extractQuestion(node);

    return {
        'question': question,
        'answer_citations': extractAnswerCitations(node)
    }
}

function extractQuestion(node) {
    const firstQuestionNode = node.querySelector('h1.text-3xl.font-display');
    if (firstQuestionNode) {
        return firstQuestionNode.textContent.trim();
    }
    const nextQuestionNode = node.querySelector('div.text-3xl.font-display');
    if (!nextQuestionNode) {
        console.error('No question found in node:', node);
        return;
    }
    return nextQuestionNode.textContent.trim();
}

function getConversationNodes(doc) {
    // Pass DOM document as input.
    // Returns list of conversation nodes.
    const nodeList = doc.querySelectorAll('.pb-lg.border-borderMain\\/50.ring-borderMain\\/50.divide-borderMain\\/50.dark\\:divide-borderMainDark\\/50.dark\\:ring-borderMainDark\\/50.dark\\:border-borderMainDark\\/50.bg-transparent');
    return Array.from(nodeList);
}

function extractAnswerCitations(node) {
    const selector = '.prose.dark\\:prose-invert.inline.leading-normal.break-words.min-w-0.\\[word-break\\:break-word\\]';
    const answerCitationNode = node.querySelector(selector); // Contains all answer and citations under this question
    const spanNodes = Array.from(answerCitationNode.querySelectorAll('span'));
    const extractedSpans = spanNodes.map(extractSpan).filter(span => span.value !== null);
    // Now need to make an answer-citation pairs
    let currentIdx = -1;
    let answerCitationPairs = [];
    for (let i = 0; i < extractedSpans.length; i++) {
        if (extractedSpans[i].type === spanTypes.SENTENCE && extractedSpans[i+1].type === spanTypes.CITATION) {
            currentIdx++;
            answerCitationPairs[currentIdx] = {
                'answer': extractedSpans[i].value,
                'citation': []
            }
        }
        if (extractedSpans[i].type === spanTypes.CITATION) {
            answerCitationPairs[currentIdx].citation.push(extractedSpans[i].value);
        }
    }
    return answerCitationPairs;
}

const spanTypes = Object.freeze({
    SENTENCE: 'SENTENCE',
    CITATION: 'CITATION',
    OTHER: 'OTHER',

    // Helper method to check if value is valid
    isValid(value) {
        return Object.values(this).includes(value);
    },

    // Get all values
    values() {
        return Object.values(this).filter(value => typeof value !== 'function');
    }
});

function extractSpan(spanNode) {
    const extractedText = spanNode.textContent.trim();
    if (spanNode.childElementCount === 0) {
        if (extractedText.length >= 4) {
            return { type: spanTypes.SENTENCE, value: extractedText };
        }
    }
    if (hasDirectAnchorChild(spanNode)) {
        const citationLink = spanNode.querySelector('a').getAttribute('href');
        return { type: spanTypes.CITATION, value: citationLink };
    }
    return { type: spanTypes.OTHER, value: null };
}

function hasDirectAnchorChild(node) {
    const firstElement = Array.from(node.children)[0];
    return firstElement && firstElement.tagName.toLowerCase() === 'a';
}
