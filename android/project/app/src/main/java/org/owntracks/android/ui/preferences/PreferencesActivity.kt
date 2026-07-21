package org.owntracks.android.ui.preferences

import android.content.Intent
import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.databinding.DataBindingUtil
import androidx.fragment.app.Fragment
import androidx.preference.Preference
import androidx.preference.PreferenceFragmentCompat
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import org.owntracks.android.R
import org.owntracks.android.databinding.UiPreferencesBinding
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.support.AuthManager
import org.owntracks.android.ui.auth.LoginActivity
import org.owntracks.android.ui.mixins.AppBarInsetHandler
import org.owntracks.android.ui.mixins.ServiceStarter
import org.owntracks.android.ui.mixins.WorkManagerInitExceptionNotifier

@AndroidEntryPoint
open class PreferencesActivity :
    AppCompatActivity(),
    PreferenceFragmentCompat.OnPreferenceStartFragmentCallback,
    WorkManagerInitExceptionNotifier by WorkManagerInitExceptionNotifier.Impl(),
    ServiceStarter by ServiceStarter.Impl(),
    AppBarInsetHandler by AppBarInsetHandler.Impl() {
  private lateinit var binding: UiPreferencesBinding

  @Inject lateinit var authManager: AuthManager
  @Inject lateinit var preferences: Preferences

  protected open val startFragment: Fragment
    get() = PreferencesFragment()

  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge(
        statusBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
        navigationBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
    )
    super.onCreate(savedInstanceState)

    if (!authManager.isAuthorized()) {
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
        return
    }

    binding =
        DataBindingUtil.setContentView<UiPreferencesBinding>(this, R.layout.ui_preferences).apply {
          lifecycleOwner = this@PreferencesActivity
          appbar.toolbar.run {
            setSupportActionBar(this)
            supportActionBar?.setDisplayHomeAsUpEnabled(true)
            setNavigationIcon(R.drawable.ic_baseline_close_24)
            setNavigationOnClickListener { finish() }
          }

          // Handle edge-to-edge insets manually since we removed the drawer
          ViewCompat.setOnApplyWindowInsetsListener(coordinatorLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            appbar.root.updatePadding(top = insets.top)
            view.updatePadding(bottom = insets.bottom)
            windowInsets
          }
        }

    supportFragmentManager.run {
      beginTransaction().replace(R.id.content_frame, startFragment, null).commit()
      executePendingTransactions()
    }

    startService(this)
    notifyOnWorkManagerInitFailure(this)
  }

  override fun onPreferenceStartFragment(
      caller: PreferenceFragmentCompat,
      pref: Preference
  ): Boolean {
    return false
  }

  companion object {
    const val START_FRAGMENT_KEY = "startFragment"
  }
}
