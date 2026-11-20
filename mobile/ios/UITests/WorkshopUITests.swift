import XCTest

final class WorkshopUITests: XCTestCase {
    func testOfflineOrderSurvivesRelaunchAndBothGamesOpen() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launch()

        // WebKit exposes ordinary buttons and aria-pressed toggles as different iOS control types.
        func item(_ label: String) -> XCUIElement {
            app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
        }
        func tap(_ label: String) {
            let control = item(label)
            XCTAssertTrue(control.waitForExistence(timeout: 45), label)
            control.tap()
        }
        tap("New shift")
        tap("Start again")
        tap("Zoom in")
        tap("Zoom out")
        tap("Build here")
        tap("Start line")
        XCTAssertTrue(item("The first smelt").waitForExistence(timeout: 60))
        let capture = XCTAttachment(screenshot: app.screenshot())
        capture.name = "Iron Shift on iPhone"
        capture.lifetime = .keepAlways
        add(capture)
        app.terminate()
        app.launch()
        XCTAssertTrue(item("The first smelt").waitForExistence(timeout: 45))
        XCTAssertTrue(item("Start line").exists)
        tap("Grand Works Studio")
        let crane = app.links["Night Crane"].firstMatch
        XCTAssertTrue(crane.waitForExistence(timeout: 30))
        crane.tap()
        tap("Release load")
        let result = NSPredicate(format: "label CONTAINS[c] %@ OR label CONTAINS[c] %@", "secured on deck", "missed the stack")
        XCTAssertTrue(app.descendants(matching: .any).matching(result).firstMatch.waitForExistence(timeout: 20))
    }
}
