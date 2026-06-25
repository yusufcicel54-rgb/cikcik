import { AppConfig } from "../types";

export function getAndroidManifest(config: AppConfig): string {
  const pkg = config.packageName || "com.webinapk.app";
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${pkg}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.WebInApk"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            ${config.options.fullscreen ? 'android:theme="@style/Theme.WebInApk.Fullscreen"' : ""}
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;
}

export function getMainActivityKotlin(config: AppConfig): string {
  const pkg = config.packageName || "com.webinapk.app";
  return `package ${pkg}

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.*
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import java.net.URL

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private val targetUrl = "${config.url}"
    private val lockToDomain = ${config.options.lockToDomain}
    private val enableAdBlocker = ${config.options.enableAdBlocker}

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        progressBar = findViewById(R.id.progressBar)
        swipeRefresh = findViewById(R.id.swipeRefresh)

        // Keep Screen On if configured
        if (${config.options.keepScreenOn}) {
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }

        setupWebView()
        setupSwipeRefresh()
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.builtInZoomControls = ${config.options.zoomControls}
        settings.displayZoomControls = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Custom User Agent if specified
        ${config.options.customUserAgent ? `settings.userAgentString = "${config.options.customUserAgent}"` : "// Standard User Agent"}

        webView.scrollBarStyle = View.SCROLLBARS_INSIDE_OVERLAY

        // Initialize AdBlocker list if active
        if (enableAdBlocker) {
            AdBlocker.init(this)
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                swipeRefresh.isRefreshing = false
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                
                if (lockToDomain) {
                    try {
                        val targetHost = URL(targetUrl).host
                        val currentHost = URL(url).host
                        
                        // Stay in WebView if host is the same or a subdomain
                        if (currentHost.endsWith(targetHost) || targetHost.endsWith(currentHost)) {
                            return false
                        }
                        
                        // Otherwise, launch an intent to open in external browser
                        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        return false
                    }
                }
                return false
            }

            // Native Ad-Blocker integration
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
                if (enableAdBlocker && request != null) {
                    val url = request.url.toString()
                    if (AdBlocker.isAd(url)) {
                        // Return empty response to block the ad request!
                        return WebResourceResponse("text/plain", "UTF-8", null)
                    }
                }
                return super.shouldInterceptRequest(view, request)
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
                if (newProgress == 100) {
                    progressBar.visibility = View.GONE
                }
            }
        }

        webView.loadUrl(targetUrl)
    }

    private fun setupSwipeRefresh() {
        swipeRefresh.isEnabled = ${config.options.pullToRefresh}
        swipeRefresh.setOnRefreshListener {
            webView.reload()
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
`;
}

export function getAdBlockerKotlin(config: AppConfig): string {
  const pkg = config.packageName || "com.webinapk.app";
  return `package ${pkg}

import android.content.Context
import java.net.URL

object AdBlocker {
    private val adHosts = HashSet<String>()

    fun init(context: Context) {
        // Lightweight ad hosts for adblocking without bloating memory
        val commonAdDomains = arrayOf(
            "doubleclick.net",
            "googleads.g.doubleclick.net",
            "adservice.google.com",
            "googlesyndication.com",
            "adnxs.com",
            "adtech.de",
            "openx.net",
            "pubmatic.com",
            "rubiconproject.com",
            "adroll.com",
            "outbrain.com",
            "taboola.com",
            "adzerk.net",
            "exponential.com",
            "popads.net",
            "popcash.net",
            "propellerads.com",
            "yandex.ru/clck",
            "scorecardresearch.com"
        )
        adHosts.addAll(commonAdDomains)
    }

    fun isAd(url: String): Boolean {
        try {
            val host = URL(url).host.lowercase()
            for (adHost in adHosts) {
                if (host == adHost || host.endsWith(".$adHost")) {
                    return true
                }
            }
        } catch (e: Exception) {
            // Ignore bad URLs
        }
        return false
    }
}
`;
}

export function getLayoutXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="4dp"
        android:indeterminate="false"
        android:max="100"
        android:progressDrawable="@android:drawable/progress_horizontal"
        app:layout_constraintTop_toTopOf="parent" />

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipeRefresh"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintTop_toBottomOf="@id/progressBar">

        <WebView
            android:id="@+id/webView"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

</androidx.constraintlayout.widget.ConstraintLayout>`;
}

export function getStringsXml(config: AppConfig): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${config.name}</string>
</resources>`;
}

export function getThemesXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Base application theme. -->
    <style name="Theme.WebInApk" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <!-- Primary brand color. -->
        <item name="colorPrimary">#2563EB</item>
        <item name="colorPrimaryVariant">#1D4ED8</item>
        <item name="colorOnPrimary">#FFFFFF</item>
        <!-- Secondary brand color. -->
        <item name="colorSecondary">#3B82F6</item>
        <item name="colorSecondaryVariant">#1E3A8A</item>
        <item name="colorOnSecondary">#FFFFFF</item>
        <!-- Status bar color. -->
        <item name="android:statusBarColor">?attr/colorPrimaryVariant</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>

    <style name="Theme.WebInApk.Fullscreen" parent="Theme.WebInApk">
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowContentOverlay">@null</item>
    </style>
</resources>`;
}

export function getBuildGradleApp(config: AppConfig): string {
  const pkg = config.packageName || "com.webinapk.app";
  return `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${pkg}'
    compileSdk 34

    defaultConfig {
        applicationId "${pkg}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'
}
`;
}

export function getBuildGradleProject(): string {
  return `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id 'com.android.application' version '8.2.2' apply false
    id 'com.android.library' version '8.2.2' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.22' apply false
}
`;
}

export function getSettingsGradle(): string {
  return `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "WebInApkNoAds"
include ':app'
`;
}

export function getProjectReadme(config: AppConfig): string {
  return `# ${config.name} - Android Projesi

Bu Android projesi **WebInApkNoAds** tarafından otomatik olarak üretilmiştir.

## Proje Detayları
- **Uygulama Adı:** ${config.name}
- **Web Sitesi:** ${config.url}
- **Paket Kimliği (Package Name):** ${config.packageName || "com.webinapk.app"}
- **Reklam Engelleyici:** ${config.options.enableAdBlocker ? "AKTİF (Host bazlı yerel engelleyici)" : "Pasif"}
- **Tam Ekran (Fullscreen):** ${config.options.fullscreen ? "Aktif" : "Pasif"}
- **Yukarıdan Çekip Yenileme:** ${config.options.pullToRefresh ? "Aktif" : "Pasif"}

## Derleme ve APK Çıkarma Adımları

1. **Gereksinimler:**
   - Bilgisayarınıza [Android Studio Jellyfish+](https://developer.android.com/studio) kurun.
   - Java JDK 17 kurulu olmalıdır.

2. **Projeyi Açma:**
   - Android Studio'yu başlatın.
   - **Open an Existing Project** (Var olan projeyi aç) seçeneğine tıklayın.
   - Bu ZIP dosyasını çıkardığınız klasörü seçip açın.
   - Android Studio'nun Gradle kütüphanelerini indirmesi ve eşitlemesi için (1-2 dakika sürebilir) internete bağlı olduğunuzdan emin olun.

3. **İkon Ekleme/Değiştirme:**
   - 'app/src/main/res' klasöründeki 'mipmap' klasörleri içinde uygulama ikonları yer almaktadır. Web sitemizden oluşturduğunuz ikonlar buraya otomatik olarak yerleştirilmiştir. İsterseniz Android Studio içinden 'File > New > Image Asset' seçeneğiyle yeni ikonlar tanımlayabilirsiniz.

4. **Kendi Telefonunuzda Test Etme:**
   - Android telefonunuzda 'Geliştirici Seçenekleri' ve 'USB Hata Ayıklama' ayarlarını açın.
   - Telefonu bilgisayara kablo ile bağlayın.
   - Üst bardaki yeşil **Run (Oynat)** butonuna tıklayarak uygulamayı doğrudan telefonunuza kurabilirsiniz.

5. **İmzalı APK (Yayınlama) Çıkarma:**
   - Android Studio menüsünden: 'Build > Generate Signed Bundle / APK' seçin.
   - **APK** seçeneğini seçip 'Next' deyin.
   - Bir Keystore (güvenlik anahtarı) oluşturun veya var olanı seçin.
   - Şifreleri doldurup 'Release' seçeneğini seçin ve 'Create' butonuna basın.
   - Tebrikler! Reklamsız, sadece sizin sitenize kilitli APK'nız hazır.
`;
}
