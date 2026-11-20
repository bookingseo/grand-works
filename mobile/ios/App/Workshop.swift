import UIKit
import WebKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let screen = UIWindow(frame: UIScreen.main.bounds)
        screen.rootViewController = WorkshopController()
        screen.makeKeyAndVisible()
        window = screen
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        (window?.rootViewController as? WorkshopController)?.pauseGame()
    }
}

final class WorkshopController: UIViewController, WKNavigationDelegate {
    private let game = WKWebView()
    private let content = Bundle.main.resourceURL!.appendingPathComponent("www", isDirectory: true)
    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.95, green: 0.93, blue: 0.87, alpha: 1)
        game.navigationDelegate = self
        game.allowsBackForwardNavigationGestures = true
        game.scrollView.contentInsetAdjustmentBehavior = .never
        game.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(game)
        let safe = view.safeAreaLayoutGuide
        NSLayoutConstraint.activate([
            game.topAnchor.constraint(equalTo: safe.topAnchor), game.bottomAnchor.constraint(equalTo: safe.bottomAnchor),
            game.leadingAnchor.constraint(equalTo: safe.leadingAnchor), game.trailingAnchor.constraint(equalTo: safe.trailingAnchor)
        ])
        game.loadFileURL(content.appendingPathComponent("games/iron-shift/index.html"), allowingReadAccessTo: content)
    }

    func pauseGame() {
        game.evaluateJavaScript("window.dispatchEvent(new Event('workshop-pause'))")
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = action.request.url, url.isFileURL,
              url.standardizedFileURL.path.hasPrefix(content.standardizedFileURL.path + "/") else {
            decisionHandler(.cancel)
            return
        }
        decisionHandler(.allow)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) { webView.reload() }
}
