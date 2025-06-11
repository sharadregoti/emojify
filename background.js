chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "emojify",
    title: "Emojify",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "emojify") {
    const selectedText = info.selectionText;
    chrome.storage.sync.get('apiKey', (data) => {
      if (data.apiKey) {
        const apiKey = data.apiKey;
        const prompt = `You are a helpful assistant that enhances user messages by adding relevant emojis. Given a piece of text, return the same text but with appropriate emojis inserted naturally within or at the end. The emojis should match the meaning, tone, or subject of the message. For instance, if the message is about celebrating a birthday, include 🎉, 🎂, or 🥳. If it’s about travel, consider ✈️, 🏖️, or 🌍. Do not overuse emojis—use just enough to make the message feel expressive without overwhelming it. Maintain the original tone and clarity of the message.`;

        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${prompt}\n\n${selectedText}`
              }]
            }]
          })
        })
    .then(response => response.json())
    .then(data => {
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        const emojifiedText = data.candidates[0].content.parts[0].text;
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            const activeElement = document.activeElement;
            if (activeElement.isContentEditable || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
              activeElement.value = activeElement.value.substring(0, activeElement.selectionStart) + text + activeElement.value.substring(activeElement.selectionEnd);
            }
          },
          args: [emojifiedText]
        });
      } else {
        console.error("Error: Invalid response from Gemini API", data);
      }
    })
        .catch(error => console.error("Error:", error));
      } else {
        // Handle the case where the API key is not set
        console.error("API key not set.");
      }
    });
  }
});
