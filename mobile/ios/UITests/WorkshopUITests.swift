import XCTest

final class WorkshopUITests: XCTestCase {
    func testOfflineOrderSurvivesRelaunchAndBothGamesOpen() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()
        let page = app.webViews.firstMatch
        let reset = page.buttons["New shift"]
        XCTAssertTrue(reset.waitForExistence(timeout: 30))
        reset.tap()
        page.buttons["Start again"].tap()
        page.buttons["Zoom in"].tap()
        page.buttons["Zoom out"].tap()
        page.buttons["Build here"].tap()
        page.buttons["Start line"].tap()
        XCTAssertTrue(page.staticTexts["The first smelt"].waitForExistence(timeout: 45))
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Iron Shift on iPhone"; capture.lifetime = .keepAlways
        add(capture)
        app.terminate()
        app.launch()
        XCTAssertTrue(page.staticTexts["The first smelt"].waitForExistence(timeout: 25))
        XCTAssertTrue(page.buttons["Start line"].exists)
        page.links["Grand Works Studio"].tap()
        let crane = page.links["Night Crane"]
        XCTAssertTrue(crane.waitForExistence(timeout: 15)); crane.tap()
        page.buttons["Release load"].tap()
        let outcome = page.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@ OR label CONTAINS[c] %@", "secured on deck", "missed the stack")).firstMatch
        XCTAssertTrue(outcome.waitForExistence(timeout: 15))
    }
}
