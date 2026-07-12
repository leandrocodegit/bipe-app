package org.owntracks.android.ui.waypoints

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.owntracks.android.data.waypoints.WaypointModel
import org.owntracks.android.data.waypoints.WaypointsRepo
import javax.inject.Inject
import timber.log.Timber

@HiltViewModel
class WaypointsViewModel @Inject constructor(
    private val waypointsRepo: WaypointsRepo
) : ViewModel() {
    
    private val _waypoints = MutableStateFlow<List<WaypointModel>>(emptyList())
    val waypoints: StateFlow<List<WaypointModel>> = _waypoints.asStateFlow()

    private val _isEmpty = MutableLiveData<Boolean>(true)
    val isEmpty: LiveData<Boolean> = _isEmpty

    init {
        loadWaypoints()
        
        // Listen for changes in the repository
        viewModelScope.launch {
            waypointsRepo.repoChangedEvent.collect {
                Timber.d("WaypointsViewModel: Repository changed, reloading")
                loadWaypoints()
            }
        }
    }

    fun refresh() {
        loadWaypoints()
    }

    private fun loadWaypoints() {
        viewModelScope.launch {
            try {
                val list = waypointsRepo.getAll()
                Timber.d("WaypointsViewModel: Loaded ${list.size} waypoints")
                _waypoints.value = list
                _isEmpty.postValue(list.isEmpty())
            } catch (e: Exception) {
                Timber.e(e, "WaypointsViewModel: Error loading waypoints")
            }
        }
    }
}
