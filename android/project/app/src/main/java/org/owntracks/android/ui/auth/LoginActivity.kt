package org.owntracks.android.ui.auth

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import org.owntracks.android.databinding.UiLoginBinding
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.services.SetupService
import org.owntracks.android.support.AuthManager
import org.owntracks.android.ui.map.MapActivity
import javax.inject.Inject

@AndroidEntryPoint
class LoginActivity : AppCompatActivity() {
    @Inject lateinit var authManager: AuthManager
    @Inject lateinit var setupService: SetupService
    @Inject lateinit var preferences: Preferences
    @Inject lateinit var requirementsChecker: org.owntracks.android.support.RequirementsChecker
    
    private lateinit var binding: UiLoginBinding

    private val authLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            result.data?.let { intent ->
                showLoading(true)
                authManager.handleAuthResponse(intent) { success ->
                    if (success) {
                        performSetupAndNavigate()
                    } else {
                        showLoading(false)
                        Toast.makeText(this, "Falha na autenticação", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun arePermissionsGranted(): Boolean {
        val hasLocation = requirementsChecker.hasLocationPermissions()
        val hasBackground = requirementsChecker.hasBackgroundLocationPermission()
        val hasNotifications = (getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager).areNotificationsEnabled()
        
        return hasLocation && hasBackground && hasNotifications
    }

    private fun navigateToNextScreen() {
        if (arePermissionsGranted()) {
            startActivity(Intent(this, MapActivity::class.java))
        } else {
            startActivity(Intent(this, PermissionActivity::class.java))
        }
        finish()
    }

    private fun performSetupAndNavigate() {
        if (preferences.setupCompleted) {
            navigateToNextScreen()
            return
        }

        // Se estiver autorizado, tenta o setup
        if (authManager.isAuthorized()) {
            showLoading(true)
            lifecycleScope.launch {
                val setupSuccess = setupService.performDeviceSetup()
                showLoading(false)
                if (setupSuccess) {
                    navigateToNextScreen()
                } else {
                    ensureLoginUiInflated()
                    Toast.makeText(this@LoginActivity, "Erro ao configurar dispositivo. Verifique sua conexão.", Toast.LENGTH_LONG).show()
                }
            }
        } else {
            // Se não estiver autorizado, garante que a UI de login apareça
            showLoading(false)
            ensureLoginUiInflated()
        }
    }

    private fun showLoading(loading: Boolean) {
        ensureLoginUiInflated()
        binding.progressSetup.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnLogin.isEnabled = !loading
    }

    private fun ensureLoginUiInflated() {
        if (!::binding.isInitialized) {
            binding = UiLoginBinding.inflate(layoutInflater)
            setContentView(binding.root)
            binding.btnLogin.setOnClickListener {
                authLauncher.launch(authManager.getLoginIntent())
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge(
            statusBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = androidx.activity.SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        super.onCreate(savedInstanceState)
        
        if (authManager.isAuthorized()) {
            // Se já tem sessão, tenta o setup ou vai pro mapa
            performSetupAndNavigate()
        } else {
            // Se não tem sessão, mostra botão de login
            ensureLoginUiInflated()
        }
    }
}
