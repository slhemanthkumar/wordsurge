package ai.arena.wordsurge;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedDispatcher;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Offline WebView shell for WordSurge.
 *
 * The bundled web game is served from app assets under a private secure origin
 * (https://app.wordsurge.local). Every request for that host is answered locally in
 * {@link LocalContentClient}; the app never opens a network connection and declares no
 * INTERNET permission. Links to other hosts are handed to the system browser.
 */
public class MainActivity extends Activity {
    private static final String APP_HOST = "app.wordsurge.local";
    private static final String START_URL = "https://" + APP_HOST + "/index.html";
    private static final int SHORE_COLOR = Color.rgb(22, 63, 75);

    private WebView webView;

    @Override
    @SuppressLint("SetJavaScriptEnabled") // Required: the game is a JavaScript application.
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();

        webView = new WebView(this);
        webView.setBackgroundColor(SHORE_COLOR);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true); // localStorage holds the player's save.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setGeolocationEnabled(false);
        settings.setSaveFormData(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setUserAgentString(settings.getUserAgentString() + " WordSurge/" + BuildConfig.VERSION_NAME);

        CookieManager.getInstance().setAcceptCookie(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.setWebViewClient(new LocalContentClient());
        setContentView(webView);
        applyEdgeToEdgeInsets();
        registerBackHandler();

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void configureSystemBars() {
        if (Build.VERSION.SDK_INT >= 35) {
            // Edge-to-edge is enforced; the WebView is padded by the real insets below.
            getWindow().setNavigationBarContrastEnforced(false);
        } else {
            getWindow().setStatusBarColor(SHORE_COLOR);
            getWindow().setNavigationBarColor(SHORE_COLOR);
        }
    }

    private void applyEdgeToEdgeInsets() {
        if (Build.VERSION.SDK_INT < 35) return;
        webView.setOnApplyWindowInsetsListener((view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsets.CONSUMED;
        });
        webView.requestApplyInsets();
    }

    private void registerBackHandler() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
    }

    /** Lets the game close a sheet or return home before the activity itself finishes. */
    private void handleBack() {
        if (webView == null) {
            finish();
            return;
        }
        webView.evaluateJavascript(
            "window.handleNativeBack ? window.handleNativeBack() : false",
            result -> { if (!"true".equals(result)) finish(); });
    }

    @Override
    @SuppressWarnings("deprecation") // Still invoked on Android 12 and lower.
    public void onBackPressed() {
        handleBack();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.loadUrl("about:blank");
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    /** Serves bundled assets for the private app origin and routes everything else to the system. */
    private class LocalContentClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (APP_HOST.equals(uri.getHost())) return false;
            String scheme = uri.getScheme();
            if ("https".equals(scheme) || "http".equals(scheme) || "mailto".equals(scheme) || "market".equals(scheme)) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException error) {
                    if ("market".equals(scheme)) {
                        // No Play Store app (e.g. some tablets): fall back to the web listing.
                        Uri web = Uri.parse("https://play.google.com/store/apps/details?id=" + getPackageName());
                        try { startActivity(new Intent(Intent.ACTION_VIEW, web)); } catch (ActivityNotFoundException ignored) { }
                    }
                    // Otherwise no browser/mail app is installed; the game keeps running.
                }
            }
            return true;
        }

        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!APP_HOST.equals(uri.getHost())) return notFound();

            String path = uri.getPath();
            if (path == null || "/".equals(path)) path = "/index.html";
            if (path.contains("..")) return notFound();

            try {
                InputStream stream = getAssets().open("www" + path);
                Map<String, String> headers = new HashMap<>();
                headers.put("Cache-Control", "no-store");
                headers.put("Content-Security-Policy",
                    "default-src 'self' data: blob:; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'");
                headers.put("Referrer-Policy", "no-referrer");
                headers.put("X-Content-Type-Options", "nosniff");
                return new WebResourceResponse(mimeType(path), "UTF-8", 200, "OK", headers, stream);
            } catch (IOException error) {
                return notFound();
            }
        }

        private WebResourceResponse notFound() {
            return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", new HashMap<>(),
                new ByteArrayInputStream("Not Found".getBytes(StandardCharsets.UTF_8)));
        }

        private String mimeType(String path) {
            String lower = path.toLowerCase(Locale.US);
            if (lower.endsWith(".html")) return "text/html";
            if (lower.endsWith(".css")) return "text/css";
            if (lower.endsWith(".js")) return "application/javascript";
            if (lower.endsWith(".webmanifest") || lower.endsWith(".json")) return "application/json";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            return "application/octet-stream";
        }
    }
}
