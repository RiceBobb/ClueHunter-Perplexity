chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "highlightCitation") {
    console.log("Highlighting citation:", message.data);
    // TODO: Highlight the citation
  }
});

chrome.runtime.sendMessage({
    action: "webPageLoaded",
    data: window.location.href,
  });

document.addEventListener("click", handleClick, true);

//   console.log(document.body.innerText); // Parsing

const searchText = "청소년 대표팀 시절부터 유망주로 주목받았으며, U리그를 대표하는 골키퍼로서 고려대학교에서 오랫동안 주전 골키퍼로 뛰어난 활약을 했다.";
const range = highlightText(searchText);
scrollToRange(range);



function isPerplexity(url) {
  return url.startsWith("https://www.perplexity.ai/search");
}

function getSessionName(url) {
  const urlParts = url.split("/");
  return urlParts[urlParts.length - 1];
}

function handleClick(event) {
  if (isPerplexity(window.location.href)) {
  const clickedElement = event.target;
  let answer = "";
  if (isCitation(clickedElement)) {
    // When the element is Citation, we need to extract the answer and citation
    const tempSpan = clickedElement.parentNode.parentNode.parentNode;
    let initialCitationSpan;
    if (
      tempSpan.classList &&
      tempSpan.classList.contains("whitespace-nowrap")
    ) {
      initialCitationSpan = tempSpan.parentNode;
    } else {
      initialCitationSpan = tempSpan;
    }
    console.log("Initial Citation Span:", initialCitationSpan);
    let i = -1;
    while (true) {
      const previousSibling = getNthSibling(initialCitationSpan, i);
      const extractedResult = extractSpan(previousSibling);
      if (extractedResult.type === spanTypes.SENTENCE) {
        answer = extractedResult.value;
        break;
      }
      i--;
    }
  }

  // Get element details
  const elementInfo = {
    tag: clickedElement.tagName,
    text: clickedElement.textContent,
    href: getHref(clickedElement),
    coordinates: {
      x: event.clientX,
      y: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
    },
    xpath: getXPath(clickedElement),
    currentUrl: window.location.href,
    isCitation: isCitation(clickedElement),
    answer: answer,
  };

  // Send to background script
  chrome.runtime.sendMessage({
    action: "elementClicked",
    data: elementInfo,
  });
}
}

function isCitation(element) {
  const possibleAnchorTag = element.parentNode.parentNode;
  return (
    possibleAnchorTag.tagName.toLowerCase() === "a" &&
    possibleAnchorTag.classList &&
    possibleAnchorTag.classList.contains("citation")
  );
}

function getHref(element) {
  if (isCitation(element)) {
    return element.parentNode.parentNode.href;
  }
  return element.href;
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

function getNthSibling(element, n) {
  if (!element || n === 0) return element;

  let current = element;
  let count = Math.abs(n);

  while (current && count > 0) {
    current =
      n > 0 ? current.nextElementSibling : current.previousElementSibling;
    count--;
  }

  return current;
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

function highlightText(searchText) {
  if (window.find && window.getSelection) {
    document.designMode = "on";
    var sel = window.getSelection();
    sel.collapse(document.body, 0);
    
    while (window.find(searchText)) {
      document.execCommand("HiliteColor", false, "blue");
      sel.collapseToEnd();
    }
    document.designMode = "off";
  }
}

function scrollToRange(range) {
  if (range) {
    const rect = range.getBoundingClientRect();
    window.scrollTo({
      top: rect.top + window.pageYOffset - 100,
      behavior: 'smooth'
    });
  }
}
