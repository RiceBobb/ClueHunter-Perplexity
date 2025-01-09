if (isPerplexity(window.location.href)) {
  perplexity_main();
} else {
  console.log(document.body.innerText); // Parsing
}

function isPerplexity(url) {
  return url.startsWith("https://www.perplexity.ai/search");
}

function getSessionName(url) {
  const urlParts = url.split("/");
  return urlParts[urlParts.length - 1];
}

function handleClick(event) {
  const clickedElement = event.target;

  // Get element details
  const elementInfo = {
    tag: clickedElement.tagName,
    text: clickedElement.textContent,
    coordinates: {
      x: event.clientX,
      y: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
    },
    xpath: getXPath(clickedElement),
    url: window.location.href,
    isCitation: isCitation(clickedElement),
  };

  // Send to background script
  chrome.runtime.sendMessage({
    action: "elementClicked",
    data: elementInfo,
  });
}

function isCitation(element) {
    const possibleAnchorTag = element.parentNode.parentNode;
    return possibleAnchorTag.tagName.toLowerCase() === "a" && possibleAnchorTag.classList && possibleAnchorTag.classList.contains("citation");
}

function getXPath(element) {
  if (element.id !== "") {
    return `//*[@id="${element.id}"]`;
  }
  if (element === document.body) {
    return "/html/body";
  }

  let ix = 0;
  const siblings = element.parentNode.childNodes;

  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return (
        getXPath(element.parentNode) +
        "/" +
        element.tagName.toLowerCase() +
        "[" +
        (ix + 1) +
        "]"
      );
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "runPerplexityMain") {
    perplexity_main();
  }
});

function perplexity_main() {
  //   // Set up mutation observer to track dynamic content
  //   const observer = new MutationObserver((mutations) => {
  //     mutations.forEach((mutation) => {
  //       if (mutation.addedNodes.length) {
  //         extractPerplexityContent();
  //       }
  //     });
  //   });

  //   // Start observing the main content area
  //   observer.observe(document.body, {
  //     childList: true,
  //     subtree: true,
  //   });

  document.addEventListener("click", handleClick, true);

  // Initial content extraction
  extractPerplexityContent();
}

function extractPerplexityContent() {
  try {
    const conversationNodes = getConversationNodes(document);
    const dataList = conversationNodes.map(extractData);
    console.log("Perplexity data:", dataList);

    // Optional: Send to background script
    chrome.runtime.sendMessage({
      action: "saveContent",
      session: getSessionName(window.location.href),
      content: dataList,
    });
  } catch (error) {
    console.error("Error extracting content:", error);
  }
}

function extractData(node) {
  const question = extractQuestion(node);

  return {
    question: question,
    answer_citations: extractAnswerCitations(node),
  };
}

function extractQuestion(node) {
  const firstQuestionNode = node.querySelector("h1.text-3xl.font-display");
  if (firstQuestionNode) {
    return firstQuestionNode.textContent.trim();
  }
  const nextQuestionNode = node.querySelector("div.text-3xl.font-display");
  if (!nextQuestionNode) {
    console.error("No question found in node:", node);
    return;
  }
  return nextQuestionNode.textContent.trim();
}

function getConversationNodes(doc) {
  // Pass DOM document as input.
  // Returns list of conversation nodes.
  const nodeList = doc.querySelectorAll(
    ".pb-lg.border-borderMain\\/50.ring-borderMain\\/50.divide-borderMain\\/50.dark\\:divide-borderMainDark\\/50.dark\\:ring-borderMainDark\\/50.dark\\:border-borderMainDark\\/50.bg-transparent"
  );
  return Array.from(nodeList);
}

function extractAnswerCitations(node) {
  const selector =
    ".prose.dark\\:prose-invert.inline.leading-normal.break-words.min-w-0.\\[word-break\\:break-word\\]";
  const answerCitationNode = node.querySelector(selector); // Contains all answer and citations under this question
  const spanNodes = Array.from(answerCitationNode.querySelectorAll("span"));
  const extractedSpans = spanNodes
    .map(extractSpan)
    .filter((span) => span.value !== null);
  // Now need to make an answer-citation pairs
  let currentIdx = -1;
  let answerCitationPairs = [];
  for (let i = 0; i < extractedSpans.length; i++) {
    if (
      extractedSpans[i].type === spanTypes.SENTENCE &&
      extractedSpans[i + 1].type === spanTypes.CITATION
    ) {
      currentIdx++;
      answerCitationPairs[currentIdx] = {
        answer: extractedSpans[i].value,
        citation: [],
      };
    }
    if (extractedSpans[i].type === spanTypes.CITATION) {
      answerCitationPairs[currentIdx].citation.push(extractedSpans[i].value);
    }
  }
  return answerCitationPairs;
}

const spanTypes = Object.freeze({
  SENTENCE: "SENTENCE",
  CITATION: "CITATION",
  OTHER: "OTHER",

  // Helper method to check if value is valid
  isValid(value) {
    return Object.values(this).includes(value);
  },

  // Get all values
  values() {
    return Object.values(this).filter((value) => typeof value !== "function");
  },
});

function extractSpan(spanNode) {
  const extractedText = spanNode.textContent.trim();
  if (spanNode.childElementCount === 0) {
    if (extractedText.length >= 4) {
      return { type: spanTypes.SENTENCE, value: extractedText };
    }
  }
  if (hasDirectAnchorChild(spanNode)) {
    const citationLink = spanNode.querySelector("a").getAttribute("href");
    return { type: spanTypes.CITATION, value: citationLink };
  }
  return { type: spanTypes.OTHER, value: null };
}

function hasDirectAnchorChild(node) {
  const firstElement = Array.from(node.children)[0];
  return firstElement && firstElement.tagName.toLowerCase() === "a";
}
