package org.owntracks.android.ui.waypoint

import android.os.Bundle
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.lifecycleScope
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import org.owntracks.android.R
import org.owntracks.android.data.waypoints.WaypointModel
import org.owntracks.android.data.waypoints.WaypointsRepo
import org.owntracks.android.databinding.UiWaypointBinding
import org.owntracks.android.location.geofencing.Latitude
import org.owntracks.android.location.geofencing.Longitude
import java.time.Instant
import javax.inject.Inject

@AndroidEntryPoint
class WaypointActivity : AppCompatActivity() {

    @Inject lateinit var waypointsRepo: WaypointsRepo
    private lateinit var binding: UiWaypointBinding
    private var waypoint: WaypointModel = WaypointModel()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        
        val waypointId = intent.getLongExtra("waypoint_id", -1L)
        
        binding = DataBindingUtil.setContentView<UiWaypointBinding>(this, R.layout.ui_waypoint).apply {
            lifecycleOwner = this@WaypointActivity
            
            setSupportActionBar(toolbar)
            supportActionBar?.setDisplayHomeAsUpEnabled(true)
            toolbar.setNavigationOnClickListener { finish() }
            
            save.setOnClickListener { saveWaypoint() }
            delete.setOnClickListener { deleteWaypoint() }

            // Handle edge-to-edge insets
            ViewCompat.setOnApplyWindowInsetsListener(root) { view, windowInsets ->
                val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
                appbarLayout.updatePadding(top = insets.top)
                view.updatePadding(bottom = insets.bottom)
                windowInsets
            }
        }

        if (waypointId != -1L) {
            lifecycleScope.launch {
                waypointsRepo.get(waypointId)?.let {
                    waypoint = it
                    binding.waypoint = waypoint
                }
            }
        } else {
            binding.waypoint = waypoint
        }
    }

    private fun saveWaypoint() {
        val desc = binding.description.text.toString()
        val lat = binding.latitude.text.toString().toDoubleOrNull() ?: 0.0
        val lon = binding.longitude.text.toString().toDoubleOrNull() ?: 0.0
        val rad = binding.radius.text.toString().toIntOrNull() ?: 100

        waypoint.description = desc
        waypoint.geofenceLatitude = Latitude(lat)
        waypoint.geofenceLongitude = Longitude(lon)
        waypoint.geofenceRadius = rad

        lifecycleScope.launch {
            if (waypoint.id == 0L) {
                waypointsRepo.insert(waypoint)
            } else {
                waypointsRepo.update(waypoint, true)
            }
            finish()
        }
    }

    private fun deleteWaypoint() {
        if (waypoint.id != 0L) {
            lifecycleScope.launch {
                waypointsRepo.delete(waypoint)
                finish()
            }
        } else {
            finish()
        }
    }
}
