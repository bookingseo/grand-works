package studio.grandworks.mobile;

import android.app.Activity;
import android.graphics.Color;
import android.widget.FrameLayout;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;

public final class WorkshopActivity extends Activity {
    private static final String HOST = "grandworks.invalid";
    private static final String START = "https://" + HOST + "/games/iron-shift/index.html";
    private WebView game;

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(242, 237, 221));
        game.getSettings().setJavaScriptEnabled(true);
        game.getSettings().setDomStorageEnabled(true);
        game.getSettings().setAllowFileAccess(false);
        game.getSettings().setAllowContentAccess(false);
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !isLocal(request.getUrl());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (isLocal(url) && "GET".equals(request.getMethod())) {
                    String path = url.getPath();
                    if (path != null && path.matches("/(?:[a-zA-Z0-9._-]+/)*[a-zA-Z0-9._-]+") && !path.contains("/..")) {
                        try {
                            InputStream data = getAssets().open(path.substring(1));
                            String mime = URLConnection.guessContentTypeFromName(path);
                            if (path.endsWith(".js")) mime = "application/javascript";
                            if (path.endsWith(".css")) mime = "text/css";
                            if (path.endsWith(".webp")) mime = "image/webp";
                            return new WebResourceResponse(mime == null ? "application/octet-stream" : mime, null, data);
                        } catch (IOException missing) { /* Missing assets use the same offline 404. */ }
                    }
                }
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", null, new ByteArrayInputStream(new byte[0]));
            }
        });
        FrameLayout screen = new FrameLayout(this);
        screen.setBackgroundColor(Color.rgb(242, 237, 221));
        screen.addView(game);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            screen.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        setContentView(screen);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(0, this::leavePage);
        }
        if (saved == null || game.restoreState(saved) == null) game.loadUrl(START);
    }
    private static boolean isLocal(Uri url) {
        return "https".equals(url.getScheme()) && HOST.equals(url.getAuthority());
    }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); game.saveState(out); }
    @Override protected void onPause() { game.evaluateJavascript("window.dispatchEvent(new Event('workshop-pause'))", null); game.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); game.onResume(); }
    private void leavePage() {
        if (game.canGoBack()) game.goBack(); else finish();
    }
    @Override public void onBackPressed() { leavePage(); }
}
