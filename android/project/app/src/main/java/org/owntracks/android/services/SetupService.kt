package org.owntracks.android.services

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.support.AuthManager
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
data class DeviceSetupResponseDto(
    val clientId: String,
    val username: String,
    val password: String,
    val deviceId: String
)

@Singleton
class SetupService @Inject constructor(
    private val authManager: AuthManager,
    private val preferences: Preferences,
    private val okHttpClient: OkHttpClient
) {
    private val json = Json { ignoreUnknownKeys = true }

    suspend fun performDeviceSetup(): Boolean = withContext(Dispatchers.IO) {
        val token = authManager.getBearerToken() ?: return@withContext false

      val jsonPayload = """{"os": "android"}"""

        val request = Request.Builder()
            .url("https://dev.simodapp.com:2087/bipe/devices/setup")
            .post(jsonPayload.toRequestBody("application/json".toMediaType()))
            .addHeader("Authorization", token)
            .build()

        try {
            okHttpClient.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string()
                    if (body != null) {
                        val setupData = json.decodeFromString<DeviceSetupResponseDto>(body)
                        persistSetup(setupData)
                        true
                    } else false
                } else {
                    Timber.e("Setup failed: ${response.code}")
                    false
                }
            }
        } catch (e: Exception) {
            Timber.e(e, "Error during device setup")
            false
        }
    }

    private fun persistSetup(data: DeviceSetupResponseDto) {
        preferences.clientId = data.clientId
        preferences.username = data.username
        preferences.password = data.password
        preferences.deviceId = data.deviceId
        // O host e a porta já estão configurados no hardcode mas podem ser ajustados se vierem no DTO
        preferences.setupCompleted = true
    }
}
