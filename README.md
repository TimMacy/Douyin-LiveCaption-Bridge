# Douyin Live Caption Bridge

A Chrome extension that helps Chrome's built-in Live Caption recognize audio from Douyin livestreams.

If a Douyin livestream plays without triggering Live Caption, click the extension to open a bridge tab. It captures the source tab's audio, passes it through a local WebRTC connection, and plays it back so Chrome can detect it for captioning.

Chrome generates the captions and optional live translation. The extension doesn't create, save, or export transcripts.

## Requirements

- Chrome 116 or later.
- Live Caption enabled in Chrome's accessibility settings, with the supported live caption language installed and selected.

The extension was developed for use on macOS. Other environments haven't been verified.

## Install from source

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`.

**Douyin Live Caption Bridge** can be pinned to Chrome's toolbar from the extensions menu.

## Use

1. Open Chrome's **Settings > Accessibility** and turn on **Live Caption**. Add and select Chinese under **Supported Live Caption languages**.
2. Open a Douyin livestream and start playback. Keep the source tab unmuted.
3. While viewing the Douyin tab, click **Douyin Live Caption Bridge** in Chrome's toolbar or extensions menu.
4. Keep the new bridge tab open. If its audio player doesn't start automatically, click **Play** once.
5. Return to Douyin. Chrome's Live Caption bubble should appear when it detects supported speech.

The audio plays through the bridge tab while capture is active, and its audio controls allow playback volume adjustments.

To start a new bridge, click the extension icon from a Douyin tab. To stop it, click **Stop bridge** or close the bridge tab.

For Chrome's caption and language settings, see [Manage captions and translations in Chrome](https://support.google.com/chrome/answer/10538231?hl=en).

## Privacy and permissions

The extension processes captured audio in memory for playback. It doesn't record audio to files, store transcripts, use analytics, or send captured audio to an external service. It doesn't request microphone, camera, or screen capture.

It uses the following permissions: `activeTab` and `tabCapture`.

Capture starts only when the extension is invoked from a Douyin tab.

Google documents Live Caption as processing audio and captions locally. Chrome's optional **Live Translate** feature can send captions to Google for translation; that is a separate browser setting. See [Google's caption and translation documentation](https://support.google.com/chrome/answer/10538231?hl=en).

## Troubleshooting

| Problem | What to check |
| --- | --- |
| No captions appear | Confirm Live Caption is enabled, the spoken language is available and selected, and the livestream contains audible speech. |
| A Play prompt appears | Click the bridge audio player's Play button once. |
| Audio becomes silent | Check the bridge player's volume and playback state. Close the bridge tab to stop capture, then retry from the playing Douyin tab. |
| A capture error appears | Close the bridge tab and any other bridge for the same source, then invoke the extension again from Douyin. |
| The bridge stops after closing the source tab | Open a livestream and start a new bridge from that tab. |

## Limitations

- The bridge tab must remain open while capture is active.
- Caption availability, supported languages, accuracy, and translation depend on Chrome.
- The extension cannot enable Live Caption or force Chrome to display its caption bubble.
- Capture includes audio from the selected tab, including other sounds playing in it.
- Changes to Chrome or Douyin may affect whether the workaround continues to work.

## License

Licensed under the MIT License.