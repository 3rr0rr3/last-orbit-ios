import SwiftUI
import WebKit

@main
struct LastOrbitApp: App {
    var body: some Scene {
        WindowGroup {
            GameView()
                .background(Color(red: 17/255, green: 14/255, blue: 29/255))
                .preferredColorScheme(.dark)
        }
    }
}

struct GameView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let view = WKWebView()
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.bounces = false
        if let url = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "web") {
            view.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return view
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
