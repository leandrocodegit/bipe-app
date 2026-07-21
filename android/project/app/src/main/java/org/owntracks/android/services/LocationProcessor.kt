package org.owntracks.android.services

import android.location.Location
import android.os.Build
import java.time.Instant
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Named
import javax.inject.Singleton
import kotlin.math.roundToInt
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.owntracks.android.data.repos.LocationRepo
import org.owntracks.android.data.waypoints.WaypointModel
import org.owntracks.android.data.waypoints.WaypointsRepo
import org.owntracks.android.di.ApplicationScope
import org.owntracks.android.di.CoroutineScopes
import org.owntracks.android.location.geofencing.Geofence
import org.owntracks.android.model.messages.AddMessageStatus
import org.owntracks.android.model.messages.MessageCard
import org.owntracks.android.model.messages.MessageLocation
import org.owntracks.android.model.messages.MessageLocation.Companion.fromLocation
import org.owntracks.android.model.messages.MessageStatus
import org.owntracks.android.model.messages.MessageTransition
import org.owntracks.android.model.messages.MessageWaypoint
import org.owntracks.android.model.messages.MessageWaypoints
import org.owntracks.android.model.messages.addWifi
import org.owntracks.android.net.WifiInfoProvider
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.preferences.types.MonitoringMode
import org.owntracks.android.support.DeviceMetricsProvider
import org.owntracks.android.support.MessageWaypointCollection
import org.owntracks.android.test.SimpleIdlingResource
import timber.log.Timber

@Singleton
class LocationProcessor
@Inject
constructor(
  private val messageProcessor: MessageProcessor,
  private val preferences: Preferences,
  private val locationRepo: LocationRepo,
  private val waypointsRepo: WaypointsRepo,
  private val deviceMetricsProvider: DeviceMetricsProvider,
  private val wifiInfoProvider: WifiInfoProvider,
  private val authManager: org.owntracks.android.support.AuthManager,
  @param:ApplicationScope private val scope: CoroutineScope,
  @param:CoroutineScopes.IoDispatcher private val ioDispatcher: CoroutineDispatcher,
  @param:Named("publishResponseMessageIdlingResource")
    private val publishResponseMessageIdlingResource: SimpleIdlingResource,
  @param:Named("mockLocationIdlingResource")
    private val mockLocationIdlingResource: SimpleIdlingResource
) {
  fun publishCardMessage() {
    messageProcessor.queueMessageForSending(
        MessageCard().apply {
          name = preferences.deviceId
          face = preferences.face
          color = preferences.markerColor
          userId = authManager.getUserId()
          userName = preferences.username
          clienteId = preferences.clientId
          nickname = preferences.nickname
          trackerId = preferences.tid.toString()
        }
    )
  }

  private fun locationIsWithAccuracyThreshold(l: Location): Boolean =
      preferences.ignoreInaccurateLocations
          .run { preferences.ignoreInaccurateLocations == 0 || l.accuracy < this }
          .also {
            if (!it) {
              Timber.d(
                  "Location accuracy ${l.accuracy} is outside accuracy threshold of ${preferences.ignoreInaccurateLocations}")
            }
          }

  suspend fun publishLocationMessage(trigger: MessageLocation.ReportType) =
      locationRepo.currentPublishedLocation.value?.run { publishLocationMessage(trigger, this) }

  private val highAccuracyProviders = setOf("gps", "fused")

  private suspend fun publishLocationMessage(
      trigger: MessageLocation.ReportType,
      location: Location
  ): Result<Unit> {
    Timber.v("Maybe publishing $location with trigger $trigger")
    if (!locationIsWithAccuracyThreshold(location))
        return Result.failure(Exception("location accuracy too low"))

    locationRepo.currentPublishedLocation.value?.let { lastLocation ->
      if (highAccuracyProviders.contains(location.provider) &&
          lastLocation.provider == "network" &&
          location.time - lastLocation.time <
              preferences.discardNetworkLocationThresholdSeconds * 1000) {
        return Result.failure(
            Exception("Ignoring location from ${location.provider}, last was recent and from gps"))
      }
    }

    val loadedWaypoints = withContext(ioDispatcher) { waypointsRepo.getAll() }
    
    if (loadedWaypoints.isNotEmpty() &&
        preferences.fusedRegionDetection &&
        trigger != MessageLocation.ReportType.CIRCULAR) {
      loadedWaypoints.forEach { waypoint ->
        onWaypointTransition(
            waypoint,
            location,
            if (location.distanceTo(waypoint.getLocation()) <=
                waypoint.geofenceRadius + location.accuracy) {
              Geofence.GEOFENCE_TRANSITION_ENTER
            } else {
              Geofence.GEOFENCE_TRANSITION_EXIT
            },
            MessageTransition.TRIGGER_LOCATION)
      }
    }
    
    if (preferences.monitoring === MonitoringMode.Quiet &&
        MessageLocation.ReportType.USER != trigger) {
      return Result.failure(Exception("message suppressed by monitoring settings: quiet"))
    }
    
    if (preferences.notifyOnlyEvents &&
        trigger != MessageLocation.ReportType.CIRCULAR &&
        trigger != MessageLocation.ReportType.USER) {
      return Result.failure(Exception("message suppressed by notifyOnlyEvents setting"))
    }

    val message =
        if (preferences.extendedData) {
              fromLocation(location, Build.VERSION.SDK_INT).apply {
                addWifi(wifiInfoProvider)
                battery = deviceMetricsProvider.batteryLevel
                batteryStatus = deviceMetricsProvider.batteryStatus
                conn = deviceMetricsProvider.connectionType.value
                monitoringMode = preferences.monitoring
                source = location.provider
              }
            } else {
              fromLocation(location, Build.VERSION.SDK_INT)
            }
            .apply {
              this.trigger = trigger
              trackerId = preferences.tid.toString()
              icon = preferences.face
              this.color = preferences.markerColor
              this.userName = preferences.username
              this.clienteId = preferences.clientId
              this.nickname = preferences.nickname
              inregions = calculateInRegions(loadedWaypoints)
            }
    
    messageProcessor.queueMessageForSending(message)
    if (responseMessageTypes.contains(trigger)) {
      publishResponseMessageIdlingResource.setIdleState(true)
    }
    return Result.success(Unit)
  }

  private val responseMessageTypes =
      listOf(
          MessageLocation.ReportType.RESPONSE,
          MessageLocation.ReportType.USER,
          MessageLocation.ReportType.CIRCULAR)

  private fun calculateInRegions(loadedWaypoints: List<WaypointModel>): List<String> =
      loadedWaypoints
          .filter { it.lastTransition == Geofence.GEOFENCE_TRANSITION_ENTER }
          .map { it.description }
          .toList()

  suspend fun onLocationChanged(location: Location, reportType: MessageLocation.ReportType) {
    if (location.time > locationRepo.currentLocationTime ||
        reportType != MessageLocation.ReportType.DEFAULT) {
      publishLocationMessage(reportType, location).run {
        if (isSuccess) {
          locationRepo.setCurrentPublishedLocation(location)
        }
      }
    }
  }

  fun onWaypointTransition(
      waypointModel: WaypointModel,
      location: Location,
      transition: Int,
      trigger: String
  ) {
    if (!locationIsWithAccuracyThreshold(location)) return
    
    scope.launch {
      if (transition == waypointModel.lastTransition ||
          (waypointModel.isUnknown() && transition == Geofence.GEOFENCE_TRANSITION_EXIT)) {
        waypointModel.lastTransition = transition
        waypointsRepo.update(waypointModel, false)
      } else {
        waypointModel.lastTransition = transition
        waypointModel.lastTriggered = Instant.now()
        waypointsRepo.update(waypointModel, false)
        if (preferences.monitoring !== MonitoringMode.Quiet) {
          publishTransitionMessage(waypointModel, location, transition, trigger)
          if (trigger == MessageTransition.TRIGGER_CIRCULAR) {
            publishLocationMessage(MessageLocation.ReportType.CIRCULAR, location)
          }
        }
      }
    }
  }

  fun publishWaypointMessage(e: WaypointModel) {
    messageProcessor.queueMessageForSending(waypointsRepo.fromDaoObject(e))
  }

  private fun publishTransitionMessage(
      waypointModel: WaypointModel,
      triggeringLocation: Location,
      transition: Int,
      trigger: String
  ) {
    messageProcessor.queueMessageForSending(
        MessageTransition().apply {
          setTransition(transition)
          this.trigger = trigger
          trackerId = preferences.tid.toString()
          userName = preferences.username
          clienteId = preferences.clientId
          nickname = preferences.nickname
          latitude = triggeringLocation.latitude
          longitude = triggeringLocation.longitude
          accuracy = triggeringLocation.accuracy.roundToInt()
          timestamp = TimeUnit.MILLISECONDS.toSeconds(triggeringLocation.time)
          waypointTimestamp = waypointModel.tst.epochSecond
          description = waypointModel.description
        })
  }

  suspend fun publishWaypointsMessage() {
    messageProcessor.queueMessageForSending(
        MessageWaypoints().apply {
          waypoints =
              MessageWaypointCollection().apply {
                withContext(ioDispatcher) {
                  addAll(
                      waypointsRepo.getAll().map {
                        MessageWaypoint().apply {
                          description = it.description
                          latitude = it.geofenceLatitude.value
                          longitude = it.geofenceLongitude.value
                          radius = it.geofenceRadius
                          timestamp = it.tst.epochSecond
                        }
                      })
                }
              }
        })
    publishResponseMessageIdlingResource.setIdleState(true)
  }

  fun publishStatusMessage() {
    scope.launch(ioDispatcher) {
      messageProcessor.queueMessageForSending(
          MessageStatus().apply {
            android =
                AddMessageStatus().apply {
                  wifistate = wifiInfoProvider.isWiFiEnabled()
                  powerSave = deviceMetricsProvider.powerSave
                  batteryOptimizations = deviceMetricsProvider.batteryOptimizations
                  appHibernation = deviceMetricsProvider.appHibernation
                  locationPermission = deviceMetricsProvider.locationPermission
                }
          })
      publishResponseMessageIdlingResource.setIdleState(true)
    }
  }
}
