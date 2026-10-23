const isDouyinTab = tab => /^https:\/\/(?:[a-z0-9-]+\.)*douyin\.com(?:[/?#]|$)/i.test(tab.url || '');

chrome.action.onClicked.addListener(tab => {
    if (!Number.isSafeInteger(tab.id) || tab.id <= 0) return;

    const url = new URL(chrome.runtime.getURL('bridge.html'));
    if (isDouyinTab(tab)) url.searchParams.set('sourceTabId', tab.id);

    chrome.tabs.create({ url: url.href });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== 'get-stream-id') return;

    if (!Number.isSafeInteger(sender.tab?.id) || sender.tab.id <= 0 || !Number.isSafeInteger(message.sourceTabId) || message.sourceTabId <= 0) {
        sendResponse({ error: 'Missing or invalid source or bridge tab ID.' });
        return;
    }

    chrome.tabs.get(message.sourceTabId).then(tab => {
        if (!isDouyinTab(tab)) {
            sendResponse({ error: 'Open a Douyin tab and click the extension to start the bridge.' });
            return;
        }

        return chrome.tabCapture.getMediaStreamId({
            targetTabId: message.sourceTabId,
            consumerTabId: sender.tab.id
        }).then(streamId => {
            sendResponse({ streamId });
        });
    }).then(null, error => {
        sendResponse({ error: error.message });
    });

    return true;
});