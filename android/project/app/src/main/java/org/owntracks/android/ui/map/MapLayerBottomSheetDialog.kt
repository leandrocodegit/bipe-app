package org.owntracks.android.ui.map

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.widget.AppCompatImageButton
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.commit
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import org.owntracks.android.R
import org.owntracks.android.databinding.MapLayerBottomSheetDialogBinding

class MapLayerBottomSheetDialog : BottomSheetDialogFragment() {

  private lateinit var binding: MapLayerBottomSheetDialogBinding

  override fun onCreateView(
      inflater: LayoutInflater,
      container: ViewGroup?,
      savedInstanceState: Bundle?
  ): View {
    binding = MapLayerBottomSheetDialogBinding.inflate(inflater, container, false)
    mapLayerSelectorButtonsToStyles.forEach {
      binding.root.findViewById<AppCompatImageButton>(it.key).setOnClickListener { _ ->


        dismiss()
      }
    }
    return binding.root
  }
}
