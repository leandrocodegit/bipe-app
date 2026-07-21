package org.owntracks.android.ui.map

import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.net.http.SslError
import android.os.Bundle
import android.os.IBinder
import android.webkit.JavascriptInterface
import android.webkit.SslErrorHandler
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.GeolocationPermissions
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import org.owntracks.android.preferences.types.MonitoringMode
import dagger.hilt.android.AndroidEntryPoint
import org.owntracks.android.R
import org.owntracks.android.databinding.UiMapBinding
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.services.BackgroundService
import org.owntracks.android.support.AuthManager
import org.owntracks.android.ui.DrawerProvider
import org.owntracks.android.ui.auth.LoginActivity
import org.owntracks.android.ui.auth.PermissionActivity
import org.owntracks.android.ui.waypoints.WaypointsActivity
import org.owntracks.android.ui.mixins.AppBarInsetHandler
import org.owntracks.android.ui.mixins.ServiceStarter
import org.owntracks.android.ui.mixins.WorkManagerInitExceptionNotifier
import org.owntracks.android.ui.preferences.PreferencesActivity
import timber.log.Timber
import javax.inject.Inject

@AndroidEntryPoint
class MapActivity :
    AppCompatActivity(),
    WorkManagerInitExceptionNotifier by WorkManagerInitExceptionNotifier.Impl(),
    ServiceStarter by ServiceStarter.Impl(),
    AppBarInsetHandler by AppBarInsetHandler.Impl() {

    private lateinit var binding: UiMapBinding
    private var service: BackgroundService? = null

    @Inject lateinit var preferences: Preferences
    @Inject lateinit var drawerProvider: DrawerProvider
    @Inject lateinit var authManager: AuthManager
    @Inject lateinit var requirementsChecker: org.owntracks.android.support.RequirementsChecker
    @Inject lateinit var webRTCManager: org.owntracks.android.support.WebRTCManager

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            this@MapActivity.service = (service as BackgroundService.LocalBinder).service
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            service = null
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        super.onCreate(savedInstanceState)

        if (!preferences.setupCompleted || !authManager.isAuthorized()) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        binding = DataBindingUtil.setContentView<UiMapBinding>(this, R.layout.ui_map).apply {
            lifecycleOwner = this@MapActivity

            appbar.toolbar.run {
                setSupportActionBar(this)
                supportActionBar?.setDisplayShowTitleEnabled(false)

                // Remove navigation icon (sandwich/settings)
                navigationIcon = null

                // Keep it slim as a spacer for status bar
                layoutParams.height = 0
            }

            applyAppBarEdgeToEdgeInsets(drawerLayout, appbar.root, navigationView)
            drawerLayout.setDrawerLockMode(androidx.drawerlayout.widget.DrawerLayout.LOCK_MODE_LOCKED_CLOSED)
        }

        setupWebView()
        setupBackPressed()
        startService(this)
        notifyOnWorkManagerInitFailure(this)
    }

    private fun setupBackPressed() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        WebView.setWebContentsDebuggingEnabled(true)
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(binding.webView, true)

        binding.webView.apply {
            webChromeClient = object : WebChromeClient() {
                override fun onGeolocationPermissionsShowPrompt(
                    origin: String?,
                    callback: GeolocationPermissions.Callback?
                ) {
                    callback?.invoke(origin, true, false)
                }

                override fun onConsoleMessage(consoleMessage: android.webkit.ConsoleMessage?): Boolean {
                    consoleMessage?.let {
                        Timber.d("JS Console: ${it.message()} -- From line ${it.lineNumber()} of ${it.sourceId()}")
                    }
                    return true
                }
            }

            webViewClient = object : WebViewClient() {
                override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                    handler?.proceed()
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    super.onPageFinished(view, url)
                    Timber.d("WebView finished loading: $url")
                }

                override fun onReceivedError(
                    view: WebView?,
                    errorCode: Int,
                    description: String?,
                    failingUrl: String?
                ) {
                    Timber.e("WebView Error ($errorCode): $description for $failingUrl")
                }
            }
            
            addJavascriptInterface(AndroidBridge(), "Android")

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                databaseEnabled = true
                allowFileAccess = true
                allowContentAccess = true
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                cacheMode = WebSettings.LOAD_DEFAULT
                loadWithOverviewMode = true
                useWideViewPort = true
            }
            
            loadUrl("http://192.168.15.171:5500")
        }
    }

    override fun onResume() {
        super.onResume()
        
        // Auto-switch to MOVE mode when in foreground
        preferences.monitoring = MonitoringMode.Move

        if (!authManager.isAuthorized()) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }
        
        // Check permissions and redirect if not granted
        val hasLocation = requirementsChecker.hasLocationPermissions()
        val hasBackground = requirementsChecker.hasBackgroundLocationPermission()
        val hasNotifications = (getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager).areNotificationsEnabled()

        if (!hasLocation || !hasBackground || !hasNotifications) {
            startActivity(Intent(this, PermissionActivity::class.java))
            finish()
            return
        }
    }

    override fun onPause() {
        super.onPause()
        // Auto-switch to SIGNIFICANT mode when in background
        preferences.monitoring = MonitoringMode.Significant
    }

    override fun onStart() {
        super.onStart()
        bindService(
            Intent(this, BackgroundService::class.java),
            serviceConnection,
            Context.BIND_AUTO_CREATE,
        )
    }

    override fun onStop() {
        super.onStop()
        unbindService(serviceConnection)
    }

    inner class AndroidBridge {
        @JavascriptInterface
        fun openSettings() {
            startActivity(Intent(this@MapActivity, PreferencesActivity::class.java))
        }

        @JavascriptInterface
        fun openPermissions() {
            startActivity(Intent(this@MapActivity, PermissionActivity::class.java))
        }

        @JavascriptInterface
        fun openWaypoints() {
            startActivity(Intent(this@MapActivity, WaypointsActivity::class.java))
        }

        @JavascriptInterface
        fun logout() {
            runOnUiThread {
                authManager.logout()
                preferences.setupCompleted = false
                startActivity(Intent(this@MapActivity, LoginActivity::class.java))
                finish()
            }
        }

        @JavascriptInterface
        fun startVoiceCall() {
            runOnUiThread {
                webRTCManager.startCall()
            }
        }

        @JavascriptInterface
        fun stopVoiceCall() {
            runOnUiThread {
                webRTCManager.stopCall()
            }
        }

        @JavascriptInterface
        fun getUserConfig(): String {
            return """
                {
                    "deviceId": "${preferences.deviceId}",
                    "username": "${preferences.username}",
                    "color": "${preferences.markerColor}",
                    "icon": "${preferences.face}",
                    "token": "${authManager.getAccessToken()}"
                }
            """.trimIndent()
        }
    }
}
