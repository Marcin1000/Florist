import SwiftUI
import WebKit
import UIKit

// Schemat aplikacji daje stabilny origin, dzieki czemu localStorage jest trwaly
// (file:// w WKWebView bywa zawodny dla localStorage). Wszystkie zasoby sa w pakiecie.
private let appScheme = "appres"
private let entryFile = "index.html"

struct WebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.setURLSchemeHandler(context.coordinator, forURLScheme: appScheme)

        let ucc = WKUserContentController()
        ucc.add(context.coordinator, name: "bridge")
        ucc.addUserScript(WKUserScript(source: Coordinator.bridgeJS,
                                       injectionTime: .atDocumentEnd,
                                       forMainFrameOnly: false))
        config.userContentController = ucc

        if #available(iOS 14.0, *) {
            config.defaultWebpagePreferences.allowsContentJavaScript = true
        }
        config.allowsInlineMediaPlayback = true

        let web = WKWebView(frame: .zero, configuration: config)
        web.uiDelegate = context.coordinator
        web.navigationDelegate = context.coordinator
        web.scrollView.bounces = false
        web.allowsBackForwardNavigationGestures = false
        web.backgroundColor = UIColor(red: 0.957, green: 0.949, blue: 0.918, alpha: 1)
        web.isOpaque = true
        context.coordinator.web = web

        if let url = URL(string: "\(appScheme)://app/\(entryFile)") {
            web.load(URLRequest(url: url))
        }
        return web
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKURLSchemeHandler, WKScriptMessageHandler, WKUIDelegate, WKNavigationDelegate {
        weak var web: WKWebView?

        // Mostek JS: zapis grafik i CSV (link download) oraz kopiowanie przez natywny schowek.
        // Obejmuje klikniecia uzytkownika i programowe a.click() - tak samo jak wersja Android.
        static let bridgeJS = """
        (function(){
          if(window.__dlHook) return; window.__dlHook=1;
          function bridge(msg){ try{ window.webkit.messageHandlers.bridge.postMessage(msg); return true; }catch(e){ return false; } }
          function save(href, name){
            if(href.indexOf('data:')===0){ bridge({action:'save', url:href, name:name||'plik'}); return; }
            // blob: nie istnieje poza WebView, wiec zamieniamy go na data URI przed wyslaniem do Swifta
            fetch(href).then(function(r){ return r.blob(); }).then(function(b){
              var fr=new FileReader();
              fr.onload=function(){ bridge({action:'save', url:fr.result, name:name||'plik'}); };
              fr.readAsDataURL(b);
            }).catch(function(){});
          }
          document.addEventListener('click', function(e){
            var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
            if(!a) return;
            var href = a.getAttribute('href')||'';
            if(href.indexOf('data:')!==0 && href.indexOf('blob:')!==0) return;
            e.preventDefault();
            save(href, a.getAttribute('download')||'obraz.png');
          }, true);
          // Eksport CSV tworzy oderwany element <a> i wola a.click(). Takie klikniecie nie
          // przechodzi przez document, wiec bez podmiany metody nigdy nie trafiloby tutaj.
          var origClick = HTMLAnchorElement.prototype.click;
          HTMLAnchorElement.prototype.click = function(){
            try{
              var href = this.getAttribute('href')||'';
              var dl = this.getAttribute('download');
              if(dl!=null && (href.indexOf('data:')===0 || href.indexOf('blob:')===0)){
                save(href, dl||'plik'); return;
              }
            }catch(e){}
            return origClick.apply(this, arguments);
          };
          window.copyText = function(text, ok, fail){
            if(bridge({action:'copy', text:String(text)})){ if(window.toast) window.toast(ok); }
            else if(window.toast){ window.toast(fail); }
          };
        })();
        """

        // Serwowanie zasobow z pakietu dla schematu appres://
        func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
            guard let url = task.request.url else {
                task.didFailWithError(NSError(domain: appScheme, code: 0)); return
            }
            var name = url.lastPathComponent
            if name.isEmpty || name == "/" { name = entryFile }
            let base = (name as NSString).deletingPathExtension
            var ext = (name as NSString).pathExtension
            if ext.isEmpty { ext = "html" }

            guard let fileURL = Bundle.main.url(forResource: base, withExtension: ext),
                  let data = try? Data(contentsOf: fileURL) else {
                task.didFailWithError(NSError(domain: appScheme, code: 404)); return
            }
            let mime: String
            switch ext {
            case "html": mime = "text/html"
            case "js": mime = "application/javascript"
            case "css": mime = "text/css"
            case "png": mime = "image/png"
            case "svg": mime = "image/svg+xml"
            case "woff2": mime = "font/woff2"
            default: mime = "application/octet-stream"
            }
            let headers = ["Content-Type": "\(mime); charset=utf-8",
                           "Access-Control-Allow-Origin": "*"]
            let resp = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1", headerFields: headers)!
            task.didReceive(resp)
            task.didReceive(data)
            task.didFinish()
        }

        func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}

        // Odbior wiadomosci z JS
        func userContentController(_ uc: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
            switch action {
            case "copy":
                if let text = body["text"] as? String { UIPasteboard.general.string = text }
            case "save":
                guard let urlStr = body["url"] as? String else { return }
                let name = (body["name"] as? String) ?? "obraz.png"
                if urlStr.hasPrefix("data:"), let comma = urlStr.firstIndex(of: ",") {
                    let meta = urlStr[urlStr.startIndex..<comma]
                    let payload = String(urlStr[urlStr.index(after: comma)...])
                    if meta.contains("base64"),
                       let data = Data(base64Encoded: payload.removingPercentEncoding ?? payload) {
                        saveAndShare(data: data, name: name)
                    }
                } else if let u = URL(string: urlStr) {
                    share(items: [u])
                }
            default: break
            }
        }

        private func saveAndShare(data: Data, name: String) {
            let tmp = FileManager.default.temporaryDirectory.appendingPathComponent(name)
            do { try data.write(to: tmp); share(items: [tmp]) } catch { }
        }

        private func share(items: [Any]) {
            DispatchQueue.main.async {
                guard let web = self.web,
                      let root = web.window?.rootViewController else { return }
                var top = root
                while let presented = top.presentedViewController { top = presented }
                let av = UIActivityViewController(activityItems: items, applicationActivities: nil)
                if let pop = av.popoverPresentationController {
                    pop.sourceView = web
                    pop.sourceRect = CGRect(x: web.bounds.midX, y: web.bounds.midY, width: 1, height: 1)
                    pop.permittedArrowDirections = []
                }
                top.present(av, animated: true)
            }
        }
    }
}
