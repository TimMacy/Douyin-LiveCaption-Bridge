const params = new URLSearchParams(location.search);
const sourceTabId = Number(params.get('sourceTabId'));
const status = document.querySelector('#status');
const audio = document.querySelector('#audio');
const stop = document.querySelector('#stop');
let capturedStream;
let remoteStream;
let sender;
let receiver;
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
    remoteStream?.getTracks().forEach(track => track.stop());
    sender?.close();
    receiver?.close();
    audio.srcObject = null;
};

const startLoopback = stream => {
    if (stopped) {
        stream.getTracks().forEach(track => track.stop());
        return;
    }

    capturedStream = stream;
    sender = new RTCPeerConnection({ iceServers: [] });
    receiver = new RTCPeerConnection({ iceServers: [] });

    sender.onicecandidate = event => {
        if (stopped || !event.candidate) return;
        receiver.addIceCandidate(event.candidate).then(null, error => fail(error.message));
    };

    receiver.onicecandidate = event => {
        if (stopped || !event.candidate) return;
        sender.addIceCandidate(event.candidate).then(null, error => fail(error.message));
    };

    receiver.ontrack = event => {
        if (stopped) return;
        remoteStream = event.streams[0] || new MediaStream([event.track]);
        audio.srcObject = remoteStream;

        audio.play().then(() => {
            if (stopped) return;
            status.textContent = 'Bridge running. Chrome Live Caption should open from this tab. Keep it open and return to Douyin.';
        }, () => {
            if (stopped) return;
            status.textContent = 'Click Play on the audio control once. Chrome Live Caption should then open.';
        });
    };

    sender.onconnectionstatechange = receiver.onconnectionstatechange = () => {
        if (sender.connectionState === 'failed' || receiver.connectionState === 'failed') fail('WebRTC connection failed.');
    };

    stream.getAudioTracks().forEach(track => sender.addTrack(track, stream));

    sender.createOffer().then(offer => {
        return sender.setLocalDescription(offer).then(() => receiver.setRemoteDescription(offer));
    }).then(() => {
        return receiver.createAnswer();
    }).then(answer => {
        return receiver.setLocalDescription(answer).then(() => sender.setRemoteDescription(answer));
    }).then(null, error => fail(error.message));

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

stop.addEventListener('click', () => {
    stopBridge();
    window.close();
});

window.addEventListener('beforeunload', stopBridge);