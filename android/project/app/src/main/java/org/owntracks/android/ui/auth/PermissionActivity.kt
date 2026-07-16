package org.owntracks.android.ui.auth

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import dagger.hilt.android.AndroidEntryPoint
import org.owntracks.android.R
import org.owntracks.android.databinding.UiPermissionsSetupBinding
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.ui.map.MapActivity
import org.owntracks.android.ui.mixins.BackgroundLocationPermissionRequester
import org.owntracks.android.ui.mixins.LocationPermissionRequester
import org.owntracks.android.ui.mixins.NotificationPermissionRequester
import org.owntracks.android.support.RequirementsChecker
import javax.inject.Inject

@AndroidEntryPoint
class PermissionActivity : AppCompatActivity() {
    @Inject lateinit var preferences: Preferences
    @Inject lateinit var requirementsChecker: RequirementsChecker
    
    private lateinit var binding: UiPermissionsSetupBinding

    private val locationRequester = LocationPermissionRequester(this, { updateUi() }, { updateUi() })
    private val backgroundRequester = BackgroundLocationPermissionRequester(this, { updateUi() }, { updateUi() })
    private val notificationRequester = NotificationPermissionRequester(this, { updateUi() }, { updateUi() })

    private val audioPermissionLauncher = registerForActivityResult(androidx.activity.result.contract.ActivityResultContracts.RequestPermission()) { updateUi() }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView<UiPermissionsSetupBinding>(this, R.layout.ui_permissions_setup)

        binding.btnGrantLocation.setOnClickListener {
            locationRequester.requestLocationPermissions(context = this) { shouldShowRequestPermissionRationale(it) }
        }

        binding.btnGrantBackground.setOnClickListener {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                backgroundRequester.requestLocationPermissions(this) { shouldShowRequestPermissionRationale(it) }
            }
        }

        binding.btnGrantNotifications.setOnClickListener {
            notificationRequester.requestNotificationPermission()
        }

        binding.btnGrantAudio.setOnClickListener {
            audioPermissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO)
        }

        binding.btnContinue.setOnClickListener {
            startActivity(Intent(this, MapActivity::class.java))
            finish()
        }

        updateUi()
    }

    private fun updateUi() {
        val hasLocation = requirementsChecker.hasLocationPermissions()
        val hasBackground = requirementsChecker.hasBackgroundLocationPermission()
        val hasNotifications = (getSystemService(android.content.Context.NOTIFICATION_SERVICE) as android.app.NotificationManager).areNotificationsEnabled()
        val hasAudio = androidx.core.content.ContextCompat.checkSelfPermission(this, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED

        // If everything is already granted, we shouldn't be here or we can leave
        val isReady = hasLocation && (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q || hasBackground) && hasNotifications && hasAudio
        
        if (isReady && !binding.btnContinue.isEnabled) {
            // Logic to handle transition if needed, but let's stick to user clicking for now
        }

        // Location UI
        binding.btnGrantLocation.isEnabled = !hasLocation
        binding.btnGrantLocation.text = if (hasLocation) "Ativado" else "Conceder Permissão"

        // Background UI (Only for Android 10+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            binding.cardBackground.visibility = View.VISIBLE
            binding.btnGrantBackground.isEnabled = hasLocation && !hasBackground
            binding.btnGrantBackground.text = if (hasBackground) "Ativado" else "Conceder Permissão"
        } else {
            binding.cardBackground.visibility = View.GONE
        }

        // Notification UI
        binding.btnGrantNotifications.isEnabled = !hasNotifications
        binding.btnGrantNotifications.text = if (hasNotifications) "Ativado" else "Conceder Permissão"

        // Audio UI
        binding.btnGrantAudio.isEnabled = !hasAudio
        binding.btnGrantAudio.text = if (hasAudio) "Ativado" else "Conceder Permissão"

        // Continue Button - Require location and background (if applicable) and notifications
        binding.btnContinue.isEnabled = isReady
        
        // Change color to green when ready
        if (isReady) {
            binding.btnContinue.backgroundTintList = android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("#059669"))
        } else {
            binding.btnContinue.backgroundTintList = android.content.res.ColorStateList.valueOf(android.graphics.Color.parseColor("#1f2023"))
        }
    }

    override fun onResume() {
        super.onResume()
        updateUi()
    }
}
