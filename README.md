# Last Orbit — The Next Chapter

An offline iPhone space-survival game with chunky pixel art and five distinct crew designs: Mira in a navy captain jacket, Juno in orange mechanic overalls, Bean as a compact cream-and-orange robot, Sol in green botanical field gear, and Nix in a crimson courier jacket with a teal scarf.

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

Run node tests/game.test.cjs for eighteen simulation suites, including 32 complete seeded rescue campaigns and complete campaigns for all four endings.

For browser tests, install playwright@1.56.1, run npx playwright install chromium webkit, then node tests/browser.test.cjs. Tests exercise phone layouts, packing, upgrades, expeditions, saves, recruitment, timer pausing, invalid-save recovery, and rescue through visible controls. Screenshots are written to test-results.

GitHub Actions runs gameplay and mobile Chromium/WebKit checks, then compiles and tests on an iPhone simulator. It builds the iPhone device app and publishes LastOrbit-unsigned.ipa only after tests pass. Screenshots and native test results are attached to the run.

**The IPA is unsigned.** Sign it with your own Apple credentials through a suitable sideloading tool before installation. Tapping a download link in Safari does not install it. No signing certificates or Apple credentials are included. App Store/TestFlight distribution needs a separately configured signed build.

## Phone controls, title screen, and icon (1.2)

The game now opens on a title screen with Start Game, Continue (when a save exists), and Options. In-game decisions, supplies, and bottom navigation stay on screen. Longer story and journal text scroll inside their reading area; reaching a choice never requires scrolling the page.

Build and Course use compact grids. Crew profiles use Previous/Next controls. Expeditions use destination, crew, and equipment selectors with one launch button. Options offers persistent sound, larger text, reduced motion, and help. Opening Options pauses the packing clock; closing it resumes the same remaining time.

The new native app icon is in ios/Assets.xcassets/AppIcon.appiconset/AppIcon.png (1024 square, opaque RGB). A smaller copy is used on the title screen and for browser icons. The icon was created with the built-in image_gen tool; the final prompt and export details are in docs/icon-prompt.txt.

Browser checks explicitly verify that choices and task controls fit on 390×844, 375×667, and 320×568 screens, both with standard and larger text. Native iPhone tests reach Start Game, Launch, and daily choices without swipe gestures, then verify save recovery after relaunch.


## Living cabin update (1.3)

Crew react to decisions in the log and Report tab. Their latest decision or care memory and shared relationship appear in Crew; friendships strengthen with fair choices and arguments strain them. Working and resting crew have distinct poses, blinking and breathing animate the cabin, low oxygen tints and flickers the lighting, and garden plants grow through the run. Reduced Motion keeps these effects still.

Report shows the previous day's net resource changes, repairs, consumption, and explorer returns, with a short supply summary during the day transition. Four new encounters bring an abandoned liner, a luminous alien passenger, a stranded pilot, and a mysterious future transmission into new runs. Existing saved decks continue normally.

Options includes separate ambient audio (engine hum, radio static, low-supply alarms) and sound effects. Audio stops on the title screen and when the app is hidden. Difficulty applies to new games: Survival retains original costs; Relaxed starts with four extra food, four oxygen and two scrap, prevents radiation-shelter injury, and keeps four-crew daily consumption at one before upgrades. Expedition risks still apply.

Build an upgrade, reach day six, recruit Nix, or win an ending to earn four persistent achievements. Any achievement unlocks Starlight uniforms; day six or a winning ending unlocks hanging stars. Select earned cosmetics in Options. Rewards and ending discoveries survive starting a new run. Existing version-two saves remain supported.

Validation includes 128 expanded rescue campaigns across both difficulties, all four encounter types, reports and relationship persistence, old saves, unlock selection, audio settings, and phone controls at standard and larger text sizes.
