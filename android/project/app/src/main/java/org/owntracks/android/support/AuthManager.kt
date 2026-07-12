package org.owntracks.android.support

import android.content.Context
import android.content.Intent
import android.net.Uri
import dagger.hilt.android.qualifiers.ApplicationContext
import net.openid.appauth.*
import org.owntracks.android.preferences.Preferences
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthManager @Inject constructor(
    @param:ApplicationContext private val context: Context,
    private val preferences: Preferences
) {
    private val authService = AuthorizationService(context)
    private var authState: AuthState = loadState()

    companion object {
        private const val ISSUER_URI = "https://auth.simodapp.com:8443/realms/sincroled"
        private const val CLIENT_ID = "sincroled"
        private const val REDIRECT_URI = "org.owntracks.android:/auth"
        private const val SCOPE = "openid profile email"
        private const val AUTH_STATE_PREF = "auth_state"
    }

    fun getLoginIntent(): Intent {
        val serviceConfig = AuthorizationServiceConfiguration(
            Uri.parse("$ISSUER_URI/protocol/openid-connect/auth"),
            Uri.parse("$ISSUER_URI/protocol/openid-connect/token")
        )

        val authRequest = AuthorizationRequest.Builder(
            serviceConfig,
            CLIENT_ID,
            ResponseTypeValues.CODE,
            Uri.parse(REDIRECT_URI)
        ).setScope(SCOPE).build()

        return authService.getAuthorizationRequestIntent(authRequest)
    }

    fun handleAuthResponse(intent: Intent, callback: (Boolean) -> Unit) {
        val response = AuthorizationResponse.fromIntent(intent)
        val ex = AuthorizationException.fromIntent(intent)

        if (response != null || ex != null) {
            authState.update(response, ex)
            persistState()
        }

        if (response != null) {
            authService.performTokenRequest(response.createTokenExchangeRequest()) { tokenResponse, tokenEx ->
                authState.update(tokenResponse, tokenEx)
                persistState()
                callback(tokenResponse != null)
            }
        } else {
            callback(false)
        }
    }

    fun isAuthorized(): Boolean = authState.isAuthorized

    fun getAccessToken(): String? = authState.accessToken

    fun getBearerToken(): String? = authState.accessToken?.let { "Bearer $it" }

    fun getUserId(): String? {
        return authState.idToken?.let { token ->
            try {
                val parts = token.split(".")
                if (parts.size >= 2) {
                    val payload = String(android.util.Base64.decode(parts[1], android.util.Base64.DEFAULT))
                    val json = org.json.JSONObject(payload)
                    json.optString("sub")
                } else null
            } catch (e: Exception) {
                Timber.e(e, "Failed to parse User ID from token")
                null
            }
        }
    }

    private fun persistState() {
        context.getSharedPreferences("auth", Context.MODE_PRIVATE).edit()
            .putString(AUTH_STATE_PREF, authState.jsonSerializeString())
            .apply()
    }

    private fun loadState(): AuthState {
        val json = context.getSharedPreferences("auth", Context.MODE_PRIVATE)
            .getString(AUTH_STATE_PREF, null)
        return try {
            if (json != null) AuthState.jsonDeserialize(json) else AuthState()
        } catch (e: Exception) {
            Timber.e(e, "Failed to deserialize auth state")
            AuthState()
        }
    }

    fun logout() {
        authState = AuthState()
        persistState()
    }
}
