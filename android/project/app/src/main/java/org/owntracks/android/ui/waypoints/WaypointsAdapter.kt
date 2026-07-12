package org.owntracks.android.ui.waypoints

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import org.owntracks.android.data.waypoints.WaypointModel
import org.owntracks.android.databinding.UiRowWaypointBinding

class WaypointsAdapter : ListAdapter<WaypointModel, WaypointsAdapter.ViewHolder>(DiffCallback) {

    class ViewHolder(private val binding: UiRowWaypointBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: WaypointModel) {
            binding.waypoint = item
            binding.executePendingBindings()
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        return ViewHolder(UiRowWaypointBinding.inflate(LayoutInflater.from(parent.context), parent, false))
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    object DiffCallback : DiffUtil.ItemCallback<WaypointModel>() {
        override fun areItemsTheSame(oldItem: WaypointModel, newItem: WaypointModel): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: WaypointModel, newItem: WaypointModel): Boolean = oldItem == newItem
    }
}
