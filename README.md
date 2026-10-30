# Last Orbit — The Next Chapter

An offline iPhone space-survival game with original pixel art inspired by the supplied reference: cyan suits, oversized cyan glasses, magenta hair buns, stepped silhouettes, and thick dark outlines.

## Play

Open web/index.html in a browser, or build the bundled SwiftUI iPhone app using Xcode on a Mac. No web server or network is required to play.

Pack six supplies in 60 seconds. The pod launches at zero. Survive twelve daily decisions while managing food, oxygen, scrap, hull integrity, morale, and trust. The packing timer pauses when you leave the app or use Save & Menu.

Each day you can perform **one optional crew task** before making the daily log decision: build an upgrade, patch the hull, craft medicine, treat or rest a crew member, or send an expedition. Making the event decision advances the day.

## What is new

- **Autosave and resume:** supplies, timer, crew health and stress, relationships, story branches, upgrades, chosen course, expedition outcome, and journal are saved after actions. Saves remain on this device. Ending discoveries are collected separately.
- **Crew personalities:** Mira worries when oxygen is low; Juno brings extra expedition scrap; Bean restores morale at dawn; Sol grows extra food. Each run starts with Mira and two of the other three. Traits stop helping while their owner is away.
- **Relationships and branching events:** fair treatment builds trust; favoritism and orders can damage it. A courier's crate can bring help or theft depending on trust. With enough trust, invite Nix aboard as a fourth survivor. Four crew consume two rations and two oxygen daily before upgrade effects.
- **Expeditions:** send a healthy, rested crew member to a freighter, garden moon, or research relay for one or two days. Choose no equipment, a safer tether, or a scanner for extra scrap. Injury returns yield only one scrap. Risks are decided at departure and saved, so reloading cannot reroll them.
- **Crafting:** the recycler removes oxygen costs on even days; the garden grows one ration per day; the antenna adds signal to transmission choices; the cargo rack raises storage from 18 to 28 and adds two expedition rations. Repairs and medical charges use the same scrap.
- **Visible consequences:** supply shelves empty, hull cracks spread, upgrades appear in the cabin, injured crew wear bandages, exhausted crew look tired, and absent explorers leave an empty place.
- **Varied runs:** seeded starting conditions, shuffled supply positions, crew combinations, and randomized event decks.
- **Four winning endings:** rescue at home, a colony on the garden moon, life with the caravan, or broadcasting the truth about the station. The Course tab shows requirements and lets you plan your route. Requirements are checked after the final daily costs.

Food and oxygen can reach zero safely, but falling below zero ends the run. Zero hull also ends the run. Injured crew need treatment before an expedition; stress of five or more also prevents departure. Crew can rest without consuming medical charges. Each upgrade can be installed once; repairs and medical crafting can be repeated on later days.

Use Save & Menu to pause and return to the briefing. Start a new run there; replacing an active save asks first. Ending collections survive replacing a run. No cloud saves or multiplayer are included.

## Build for iPhone

1. On a Mac, install Xcode and XcodeGen (brew install xcodegen).
2. Run xcodegen generate in this folder and open LastOrbit.xcodeproj.
3. Select your signing team and bundle identifier.
4. Choose an iPhone simulator or connected device and run.

The same offline game is bundled inside a persistent WKWebView. Native simulator tests verify launch, daily decisions, and save recovery after terminating and relaunching the app.

## Tests and downloads

Run node tests/game.test.cjs for fifteen simulation suites, including 32 complete seeded rescue campaigns and complete campaigns for all four endings.

For browser tests, install playwright@1.56.1, run npx playwright install chromium webkit, then node tests/browser.test.cjs. Tests exercise phone layouts, packing, upgrades, expeditions, saves, recruitment, timer pausing, invalid-save recovery, and rescue through visible controls. Screenshots are written to test-results.

GitHub Actions runs gameplay and mobile Chromium/WebKit checks, then compiles and tests on an iPhone simulator. It builds the iPhone device app and publishes LastOrbit-unsigned.ipa only after tests pass. Screenshots and native test results are attached to the run.

**The IPA is unsigned.** Sign it with your own Apple credentials through a suitable sideloading tool before installation. Tapping a download link in Safari does not install it. No signing certificates or Apple credentials are included. App Store/TestFlight distribution needs a separately configured signed build.
