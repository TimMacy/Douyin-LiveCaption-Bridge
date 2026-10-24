const params = new URLSearchParams(location.search);
const sourceTabId = Number(params.get('sourceTabId'));
const status = document.querySelector('#status');
const playback = document.querySelector('#playback');
const volume = document.querySelector('#volume');
const stop = document.querySelector('#stop');
let capturedStream;
let audioContext;
let audioSource;
let audioGain;
let stopped = false;

const fail = message => {
    if (stopped) return;
    stopBridge();
    status.textContent = `Error: ${message}`;
};

const stopBridge = () => {
    if (stopped) return;
    stopped = true;
    capturedStream?.getTracks().forEach(track => track.stop());
    audioSource?.disconnect();
    audioGain?.disconnect();
    if (audioContext && audioContext.state !== 'closed') audioContext.close();
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.setActionHandler('play', null);
    navigator.mediaSession.setActionHandler('pause', null);
    playback.disabled = true;
    volume.disabled = true;
};

const updatePlaybackState = () => {
    if (stopped) return;
    const playing = audioContext.state === 'running';
    playback.textContent = playing ? 'Pause' : 'Play';
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
    status.textContent = playing
        ? "Bridge is running. Live Caption and Live Translate are available from Chrome's toolbar media controls. Keep this tab open and return to the 抖音直播 tab."
        : 'Playback paused. Click Play to resume.';
};

const resumePlayback = () => {
    if (stopped || !audioContext) return;
    audioContext.resume().then(updatePlaybackState, error => fail(error.message));
};

const pausePlayback = () => {
    if (stopped || !audioContext) return;
    audioContext.suspend().then(updatePlaybackState, error => fail(error.message));
};

const startLoopback = stream => {
    if (stopped) {
        stream.getTracks().forEach(track => track.stop());
        return;
    }

    capturedStream = stream;
    audioContext = new AudioContext({ latencyHint: 'interactive' });
    audioSource = audioContext.createMediaStreamSource(stream);
    audioGain = audioContext.createGain();
    audioGain.gain.value = Number(volume.value);
    audioSource.connect(audioGain);
    audioGain.connect(audioContext.destination);

    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Douyin Live Caption Bridge',
        artist: 'Douyin Live'
    });
    navigator.mediaSession.setActionHandler('play', resumePlayback);
    navigator.mediaSession.setActionHandler('pause', pausePlayback);
    audioContext.onstatechange = updatePlaybackState;
    playback.disabled = false;
    volume.disabled = false;
    status.textContent = 'Click Play once if playback does not start automatically.';
    resumePlayback();

    stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        if (stopped) return;
        stopBridge();
        status.textContent = 'Bridge stopped.';
    });
};

if (!Number.isSafeInteger(sourceTabId) || sourceTabId <= 0) {
    fail('Open a Douyin tab and click the extension to start the bridge.');
} else {
    chrome.runtime.sendMessage({
        type: 'get-stream-id',
        sourceTabId
    }).then(response => {
        if (stopped) return;
        if (!response || response.error) {
            fail(response?.error || 'No response from the extension service worker.');
            return;
        }

        navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: response.streamId
                }
            },
            video: false
        }).then(startLoopback).then(null, error => {
            fail(`Capture failed: ${error.name}: ${error.message}`);
        });
    }, error => {
        fail(error.message);
    });
}

playback.addEventListener('click', () => {
    if (audioContext?.state === 'running') pausePlayback();
    else resumePlayback();
});

volume.addEventListener('input', () => {
    if (audioGain) audioGain.gain.value = Number(volume.value);
});

stop.addEventListener('click', () => {
    stopBridge();
    window.close();
});

window.addEventListener('beforeunload', stopBridge);
