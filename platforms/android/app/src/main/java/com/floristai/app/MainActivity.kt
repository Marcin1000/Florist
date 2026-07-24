package com.floristai.app

import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.URLUtil
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.core.content.FileProvider
import java.io.File

class MainActivity : Activity() {

    private lateinit var web: WebView
    private var filePathCallback: ValueCallback<Array<Uri>>? = null
    private var cameraImageUri: Uri? = null

    private val reqFile = 1001
    private val reqCameraPerm = 2001

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this)
        setContentView(web)

        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // localStorage (historia wycen, klucz, jezyk)
            databaseEnabled = true
            allowFileAccess = true
            allowContentAccess = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
            // pozwala stronie file:// wolac OpenAI (https) bez blokady CORS
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = true
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = true
        }

        web.addJavascriptInterface(DownloadBridge(), "Android")

        web.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                view?.evaluateJavascript(DOWNLOAD_HOOK, null)
            }
        }

        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                callback: ValueCallback<Array<Uri>>?,
                params: FileChooserParams?
            ): Boolean {
                filePathCallback?.onReceiveValue(null)
                filePathCallback = callback
                openChooser()
                return true
            }
        }

        // pobieranie zdalnych plikow (gdy obraz wraca jako URL http, a nie base64)
        web.setDownloadListener { url, _, contentDisposition, mimetype, _ ->
            if (url.startsWith("http")) {
                try {
                    val req = DownloadManager.Request(Uri.parse(url))
                    req.setMimeType(mimetype)
                    val name = URLUtil.guessFileName(url, contentDisposition, mimetype)
                    req.setNotificationVisibility(
                        DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED
                    )
                    req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name)
                    (getSystemService(DOWNLOAD_SERVICE) as DownloadManager).enqueue(req)
                    toast("Pobieranie: $name")
                } catch (e: Exception) {
                    toast("Nie udalo sie pobrac")
                }
            }
        }

        if (checkSelfPermission(android.Manifest.permission.CAMERA)
            != PackageManager.PERMISSION_GRANTED
        ) {
            requestPermissions(arrayOf(android.Manifest.permission.CAMERA), reqCameraPerm)
        }

        if (savedInstanceState == null) {
            web.loadUrl("file:///android_asset/index.html")
        } else {
            web.restoreState(savedInstanceState)
        }
    }

    private fun openChooser() {
        val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
            type = "image/*"
            addCategory(Intent.CATEGORY_OPENABLE)
        }
        val extra = ArrayList<Intent>()
        val hasCam = packageManager.hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY) &&
            checkSelfPermission(android.Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
        if (hasCam) {
            try {
                val img = File.createTempFile("cam_", ".jpg", cacheDir)
                cameraImageUri = FileProvider.getUriForFile(
                    this, "$packageName.fileprovider", img
                )
                val cam = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
                    putExtra(MediaStore.EXTRA_OUTPUT, cameraImageUri)
                    addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                }
                extra.add(cam)
            } catch (e: Exception) {
                cameraImageUri = null
            }
        }
        val chooser = Intent.createChooser(contentIntent, getString(R.string.chooser_title))
        if (extra.isNotEmpty()) {
            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, extra.toTypedArray())
        }
        try {
            startActivityForResult(chooser, reqFile)
        } catch (e: Exception) {
            filePathCallback?.onReceiveValue(null)
            filePathCallback = null
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == reqFile) {
            val cb = filePathCallback ?: return
            var result: Array<Uri>? = null
            if (resultCode == Activity.RESULT_OK) {
                val picked = data?.data
                result = when {
                    picked != null -> arrayOf(picked)
                    cameraImageUri != null -> arrayOf(cameraImageUri!!)
                    else -> null
                }
            }
            cb.onReceiveValue(result)
            filePathCallback = null
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (web.canGoBack()) web.goBack() else super.onBackPressed()
    }

    inner class DownloadBridge {
        @JavascriptInterface
        fun saveFile(dataUrl: String, name: String) {
            runOnUiThread { saveDataUrl(dataUrl, name) }
        }
    }

    private fun saveDataUrl(dataUrl: String, nameIn: String) {
        try {
            val comma = dataUrl.indexOf(',')
            if (comma < 0 || !dataUrl.startsWith("data:")) return
            val meta = dataUrl.substring(5, comma)
            val mime = meta.substringBefore(';').ifEmpty { "application/octet-stream" }
            val bytes = Base64.decode(dataUrl.substring(comma + 1), Base64.DEFAULT)
            val name = if (nameIn.isBlank()) "plik" else nameIn
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, name)
                put(MediaStore.Downloads.MIME_TYPE, mime)
                put(MediaStore.Downloads.IS_PENDING, 1)
            }
            val resolver = contentResolver
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            if (uri == null) {
                toast("Nie udalo sie zapisac")
                return
            }
            resolver.openOutputStream(uri)?.use { it.write(bytes) }
            values.clear()
            values.put(MediaStore.Downloads.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            toast("Zapisano w Pobranych: $name")
        } catch (e: Exception) {
            toast("Blad zapisu pliku")
        }
    }

    private fun toast(m: String) = Toast.makeText(this, m, Toast.LENGTH_SHORT).show()

    companion object {
        // Przechwytuje pobieranie obrazow i CSV (data:/blob:) i oddaje je do natywnego zapisu.
        // Obejmuje klikniecia uzytkownika oraz programowe a.click() (eksport CSV).
        private const val DOWNLOAD_HOOK = """
            (function(){
              if(window.__dlHook) return; window.__dlHook=1;
              function save(href, name){
                fetch(href).then(function(r){return r.blob();}).then(function(b){
                  var fr=new FileReader();
                  fr.onload=function(){ try{ Android.saveFile(fr.result, name||'plik'); }catch(e){} };
                  fr.readAsDataURL(b);
                }).catch(function(){});
              }
              document.addEventListener('click', function(e){
                var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
                if(!a) return;
                var href = a.getAttribute('href')||'';
                if(href.indexOf('data:')!==0 && href.indexOf('blob:')!==0) return;
                e.preventDefault();
                save(href, a.getAttribute('download'));
              }, true);
              var origClick = HTMLAnchorElement.prototype.click;
              HTMLAnchorElement.prototype.click = function(){
                try{
                  var href = this.getAttribute('href')||'';
                  var dl = this.getAttribute('download');
                  if(dl!=null && (href.indexOf('data:')===0 || href.indexOf('blob:')===0)){
                    save(href, dl); return;
                  }
                }catch(e){}
                return origClick.apply(this, arguments);
              };
            })();
        """
    }
}
