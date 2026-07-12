package org.owntracks.android.ui.waypoints

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updatePadding
import androidx.databinding.DataBindingUtil
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import org.owntracks.android.R
import org.owntracks.android.databinding.UiWaypointsBinding
import timber.log.Timber

@AndroidEntryPoint
class WaypointsActivity : AppCompatActivity() {

    private val viewModel: WaypointsViewModel by viewModels()
    private lateinit var binding: UiWaypointsBinding
    private val adapter = WaypointsAdapter()

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        
        binding = DataBindingUtil.setContentView<UiWaypointsBinding>(this, R.layout.ui_waypoints).apply {
            lifecycleOwner = this@WaypointsActivity
            this.viewModel = this@WaypointsActivity.viewModel
            
            setSupportActionBar(toolbar)
            supportActionBar?.setDisplayHomeAsUpEnabled(true)
            toolbar.setNavigationIcon(R.drawable.ic_baseline_close_24)
            toolbar.setNavigationOnClickListener { finish() }
            
            waypointsRecyclerView.layoutManager = LinearLayoutManager(this@WaypointsActivity)
            waypointsRecyclerView.adapter = this@WaypointsActivity.adapter
            
            // Handle edge-to-edge insets
            ViewCompat.setOnApplyWindowInsetsListener(root) { view, windowInsets ->
                val insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
                appbarLayout.updatePadding(top = insets.top)
                view.updatePadding(bottom = insets.bottom)
                windowInsets
            }
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.waypoints.collect {
                    Timber.d("WaypointsActivity: Received ${it.size} waypoints")
                    adapter.submitList(it)
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.refresh()
    }
}
