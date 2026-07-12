package org.owntracks.android.services

import android.Manifest
import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import org.owntracks.android.BaseApp.Companion.NOTIFICATION_CHANNEL_ONGOING
import org.owntracks.android.BaseApp.Companion.NOTIFICATION_ID_ONGOING
import org.owntracks.android.R
import org.owntracks.android.data.EndpointState
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.preferences.types.MonitoringMode
import org.owntracks.android.support.MascotManager
import org.owntracks.android.ui.map.MapActivity
import timber.log.Timber
import kotlin.time.Clock
import kotlin.time.ExperimentalTime

@OptIn(ExperimentalTime::class)
class OngoingNotification(
    private val context: Context,
    private val preferences: Preferences,
    private val mascotManager: MascotManager,
    initialMode: MonitoringMode
) {
  data class ServiceNotificationState(
      val title: String,
      val content: String,
      val subText: String,
      val notificationHigherPriority: Boolean
  )

  private val notificationManagerCompat = NotificationManagerCompat.from(context)
  private val resultIntent by lazy {
    Intent(context, MapActivity::class.java)
        .setAction("android.intent.action.MAIN")
        .addCategory("android.intent.category.LAUNCHER")
        .setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
  }
  private val resultPendingIntent by lazy {
    PendingIntent.getActivity(
        context, 0, resultIntent, BackgroundService.UPDATE_CURRENT_INTENT_FLAGS)
  }
  private val publishPendingIntent by lazy {
    PendingIntent.getService(
        context,
        0,
        Intent(context, BackgroundService::class.java)
            .setAction(BackgroundService.INTENT_ACTION_SEND_LOCATION_USER),
        BackgroundService.UPDATE_CURRENT_INTENT_FLAGS)
  }
  private val changeMonitoringPendingIntent by lazy {
    PendingIntent.getService(
        context,
        0,
        Intent(context, BackgroundService::class.java)
            .setAction(BackgroundService.INTENT_ACTION_CHANGE_MONITORING),
        BackgroundService.UPDATE_CURRENT_INTENT_FLAGS)
  }
  private var serviceNotificationState =
      ServiceNotificationState(
          context.getString(R.string.app_name), "", getMonitoringLabel(initialMode), false)

  private val notificationBuilder =
      NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ONGOING)
          .setOngoing(true)
          .setContentIntent(resultPendingIntent)
          .setStyle(NotificationCompat.BigTextStyle())
          .addAction(
              R.drawable.ic_baseline_publish_24,
              context.getString(R.string.publish),
              publishPendingIntent)
          .addAction(
              R.drawable.ic_owntracks_80,
              context.getString(R.string.notificationChangeMonitoring),
              changeMonitoringPendingIntent)
          .setSmallIcon(R.drawable.ic_owntracks_80)
          .setSound(null, AudioManager.STREAM_NOTIFICATION)
          .setColor(context.getColor(R.color.OTPrimaryBlue))
          .setCategory(NotificationCompat.CATEGORY_SERVICE)
          .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

  fun getNotification(): Notification {
    val face = preferences.face
    val mascotResId = if (face.startsWith("animal_")) {
      context.resources.getIdentifier(face, "drawable", context.packageName)
    } else 0

    val mascotName = if (face.startsWith("animal_")) mascotManager.getMascotName(face) else null
    val title = mascotName?.let { "Rastreador: $it" } ?: serviceNotificationState.title

    val iconResId = if (mascotResId != 0) mascotResId else R.drawable.ic_owntracks_80
    val largeIcon = if (mascotResId != 0) {
      val drawable = androidx.core.content.ContextCompat.getDrawable(context, mascotResId)
      if (drawable is android.graphics.drawable.BitmapDrawable) drawable.bitmap else null
    } else null

    return notificationBuilder
        .setContentTitle(title)
        .setContentText(serviceNotificationState.content)
        .setWhen(Clock.System.now().toEpochMilliseconds())
        .setSubText(serviceNotificationState.subText)
        .setSmallIcon(iconResId)
        .setLargeIcon(largeIcon)
        .setPriority(
            if (serviceNotificationState.notificationHigherPriority) {
              NotificationCompat.PRIORITY_DEFAULT
            } else {
              NotificationCompat.PRIORITY_MIN
            })
        .build()
  }

  fun refresh() {
    updateNotification()
  }

  private fun updateNotification() {
    if (ActivityCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
        PackageManager.PERMISSION_GRANTED) {
      notificationManagerCompat.notify(NOTIFICATION_ID_ONGOING, getNotification())
    } else {
      Timber.w(
          "Tried to update ongoing notification with $this but notification permissions were missing")
    }
  }

  fun setEndpointState(endpointState: EndpointState, host: String) {
    val notificationContent =
        when (endpointState) {
          EndpointState.CONNECTED,
          EndpointState.IDLE ->
              context.getString(
                  R.string.notificationEndpointStateConnected,
                  context.resources.getString(R.string.CONNECTED),
                  host)
          EndpointState.ERROR ->
              if (endpointState.error != null)
                  "${endpointState.getLabel(context)}: ${endpointState.getErrorLabel(context)}"
              else endpointState.getLabel(context)
          else -> endpointState.getLabel(context)
        }
    serviceNotificationState = serviceNotificationState.copy(content = notificationContent)
    updateNotification()
  }

  private fun getMonitoringLabel(monitoringMode: MonitoringMode) =
      context.run {
        when (monitoringMode) {
          MonitoringMode.Quiet -> getString(R.string.monitoring_quiet)
          MonitoringMode.Manual -> getString(R.string.monitoring_manual)
          MonitoringMode.Significant -> getString(R.string.monitoring_significant)
          MonitoringMode.Move -> getString(R.string.monitoring_move)
        }
      }

  fun setMonitoringMode(monitoringMode: MonitoringMode) {
    serviceNotificationState =
        serviceNotificationState.copy(subText = getMonitoringLabel(monitoringMode))
    updateNotification()
  }

  fun setTitle(title: String) {
    serviceNotificationState = serviceNotificationState.copy(title = title)
    updateNotification()
  }
}
