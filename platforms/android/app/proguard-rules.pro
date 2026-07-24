# Keep the JavaScript interface used for in-app downloads
-keepclassmembers class com.floristai.app.MainActivity$DownloadBridge {
    public *;
}
-keepattributes JavascriptInterface
