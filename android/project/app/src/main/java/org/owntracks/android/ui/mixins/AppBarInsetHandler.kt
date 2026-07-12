package org.owntracks.android.ui.mixins

import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.drawerlayout.widget.DrawerLayout
import com.google.android.material.navigation.NavigationView

/**
 * Mixin interface for handling edge-to-edge window insets on activities with drawer navigation.
 * Provides default implementation for applying system bar insets to appbar and navigation drawer.
 */
interface AppBarInsetHandler {

  /**
   * Applies window insets to drawer layout, appbar, and navigation view for edge-to-edge display.
   *
   * @param drawerLayout The root drawer layout
   * @param appBarView The app bar view to receive top insets (must be an AppBarLayout)
   * @param navigationView The navigation drawer to receive top and bottom insets
   */
  fun AppCompatActivity.applyAppBarEdgeToEdgeInsets(
      drawerLayout: DrawerLayout,
      appBarView: View,
      navigationView: NavigationView
  ) {
    ViewCompat.setOnApplyWindowInsetsListener(drawerLayout) { view, windowInsets ->
      val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())

      // Status bar padding for the top bar
      appBarView.updatePadding(top = insets.top)
      
      // Bottom navigation bar padding for the entire layout content
      // This prevents the bottom buttons/list items from being hidden behind the Android navigation bar
      view.updatePadding(bottom = insets.bottom)

      // Drawer navigation view insets
      navigationView.updatePadding(top = insets.top, bottom = insets.bottom)

      windowInsets
    }
  }

  /** Default implementation that can be used by activities */
  class Impl : AppBarInsetHandler
}
