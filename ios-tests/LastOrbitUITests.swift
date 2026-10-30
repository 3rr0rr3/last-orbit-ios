import XCTest

final class LastOrbitUITests: XCTestCase {
    func testLaunchPackAndSurvive() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let begin = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "BEGIN EVACUATION")).firstMatch
        XCTAssertTrue(begin.waitForExistence(timeout: 30), "Bundled game must load inside WKWebView")
        let intro = XCTAttachment(screenshot: app.screenshot())
        intro.name = "iPhone briefing"
        intro.lifetime = .keepAlways
        add(intro)
        begin.tap()
        let launch = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "LAUNCH ESCAPE POD")).firstMatch
        XCTAssertTrue(launch.waitForExistence(timeout: 5))
        // Scroll to the native WebView control if it falls below the small-screen fold.
        for _ in 0..<4 {
            if launch.isHittable { break }
            app.swipeUp()
        }
        launch.tap()
        let decision = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Let it drift")).firstMatch
        XCTAssertTrue(decision.waitForExistence(timeout: 5))
        for _ in 0..<4 {
            if decision.isHittable { break }
            app.swipeUp()
        }
        decision.tap()
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Seal the cabin")).firstMatch.waitForExistence(timeout: 5))
        let survival = XCTAttachment(screenshot: app.screenshot())
        survival.name = "iPhone survival day 2"
        survival.lifetime = .keepAlways
        add(survival)
        app.terminate()
        app.launch()
        let resume = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "RESUME SAVED RUN")).firstMatch
        XCTAssertTrue(resume.waitForExistence(timeout: 30), "Save must survive a native app relaunch")
        resume.tap()
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Seal the cabin")).firstMatch.waitForExistence(timeout: 10))
    }
}
