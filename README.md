# Last Orbit

An original, playable space survival prototype for iPhone, inspired by timed scavenging and daily survival decisions. Hand-drawn canvas pixel art uses the supplied reference's purple, cyan, heavy outlines, and tiny expressive characters.

## Play now

Open `web/index.html` in a browser. No installation, server, network connection, or dependencies are needed. On Windows: `Start-Process web/index.html`.

Pack up to six items within 60 seconds, then launch. The pod starts with 4 rations, 5 oxygen, and 1 part. Every day costs 1 ration and 1 oxygen. Zero supplies can last until the next daily cost; a negative balance ends the run. Keep the hull above zero and build at least 8 signal by the end of day 12 to rescue all three crew members. Buttons show exact decision costs and rewards. Sound is optional.

## Build the iPhone app

The native SwiftUI app bundles the same offline game in a WKWebView. A Mac with Xcode and XcodeGen is required:

1. Install XcodeGen using `brew install xcodegen`.
2. Run `xcodegen generate` in this folder.
3. Open `LastOrbit.xcodeproj` in Xcode.
4. Select a signing team and your own bundle identifier under Signing & Capabilities.
5. Choose an iPhone simulator or connected iPhone and run.

The iOS shell is source-only and has not been compiled on this Windows machine. This is a first prototype: no persistence, App Store icons, or distribution signing yet. Reloading starts a new run. The evacuation clock runs while the page is active; this prototype is not designed for background play.

## GitHub builds and IPA downloads

The `Test and build iPhone game` workflow runs on every push to `main` and can also be started manually. It tests survival rules with Node, plays rescue and failure runs in mobile Chromium and WebKit, and uses a macOS runner to compile and exercise the actual iOS app in an iPhone simulator. Only after these pass does it compile an iPhone device build and publish a prerelease containing `LastOrbit-unsigned.ipa` and its SHA-256 checksum. Browser screenshots and native test results are attached to the workflow run.

The published IPA is **unsigned**. It needs signing with your own Apple credentials through a suitable sideloading tool before installation. Tapping its download link in Safari does not install it. No Apple credentials or certificates are stored in this repository. App Store/TestFlight distribution requires a separately configured signed build.

## Checks

Run `node tests/game.test.cjs` for simulation checks covering packing limits, duplicate items, launch, daily resource consumption, insufficient supplies, rescue, and loss conditions.

To run browser checks locally, install `playwright@1.56.1`, run `npx playwright install chromium webkit`, then `node tests/browser.test.cjs`. Run commands from the repository root. Native simulator checks run through the generated Xcode scheme's Test action.
