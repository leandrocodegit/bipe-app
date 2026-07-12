package org.owntracks.android.ui.preferences

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.GridView
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.preference.Preference
import androidx.lifecycle.lifecycleScope
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import org.owntracks.android.R
import org.owntracks.android.support.MascotManager
import javax.inject.Inject

@AndroidEntryPoint
class ReportingFragment : AbstractPreferenceFragment() {
  @Inject lateinit var mascotManager: MascotManager

  override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
    super.onCreatePreferences(savedInstanceState, rootKey)
    setPreferencesFromResource(R.xml.preferences_reporting, rootKey)

    findPreference<Preference>("selectMascot")?.setOnPreferenceClickListener {
      showMascotSelectionDialog()
      true
    }
  }

  private fun showMascotSelectionDialog() {
    val mascots = mascotManager.getMascots(requireContext())
    val gridView = GridView(requireContext()).apply {
      numColumns = 3
      adapter = object : BaseAdapter() {
        override fun getCount(): Int = mascots.size
        override fun getItem(position: Int) = mascots[position]
        override fun getItemId(position: Int) = position.toLong()
        override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
          val view = convertView ?: LayoutInflater.from(requireContext()).inflate(R.layout.ui_mascot_item, parent, false)
          val mascot = mascots[position]
          view.findViewById<ImageView>(R.id.mascotImage).setImageResource(mascot.drawableRes)
          view.findViewById<TextView>(R.id.mascotName).text = mascot.name
          return view
        }
      }
    }

    val dialog = AlertDialog.Builder(requireContext())
      .setTitle("Selecione seu Mascote")
      .setView(gridView)
      .setNegativeButton("Cancelar", null)
      .create()

    gridView.setOnItemClickListener { _, _, position, _ ->
      lifecycleScope.launch {
        mascotManager.setMascot(requireContext(), mascots[position])
        dialog.dismiss()
      }
    }

    dialog.show()
  }
}
