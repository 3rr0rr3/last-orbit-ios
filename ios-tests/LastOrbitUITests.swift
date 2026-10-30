import XCTest

final class LastOrbitUITests: XCTestCase {
    func testPlayAndResumeWithoutScrolling() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let start = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "START GAME")).firstMatch
        XCTAssertTrue(start.waitForExistence(timeout: 30))
        XCTAssertTrue(start.isHittable, "Start is visible on the title screen")
        let title = XCTAttachment(screenshot: app.screenshot())
        title.name = "Title screen"
        title.lifetime = .keepAlways
        add(title)
        start.tap()
        let launch = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "LAUNCH ESCAPE POD")).firstMatch
        XCTAssertTrue(launch.waitForExistence(timeout: 20))
        XCTAssertTrue(launch.isHittable, "Launch is reachable without scrolling")
        XCTAssertLessThanOrEqual(launch.frame.maxY, app.frame.maxY)
        launch.tap()
        let decision = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Let it drift")).firstMatch
        XCTAssertTrue(decision.waitForExistence(timeout: 20))
        XCTAssertTrue(decision.isHittable, "Daily choices must be on-screen")
        XCTAssertLessThanOrEqual(decision.frame.maxY, app.frame.maxY)
        let play = XCTAttachment(screenshot: app.screenshot())
        play.name = "Daily choices without scrolling"
        play.lifetime = .keepAlways
        add(play)
        decision.tap()
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Seal the cabin")).firstMatch.waitForExistence(timeout: 20))
        app.terminate()
        app.launch()
        let resume = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "CONTINUE")).firstMatch
        XCTAssertTrue(resume.waitForExistence(timeout: 30), "Save must survive relaunch")
        resume.tap()
        let next = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Seal the cabin")).firstMatch
        XCTAssertTrue(next.waitForExistence(timeout: 10))
        XCTAssertTrue(next.isHittable)
    }
}
