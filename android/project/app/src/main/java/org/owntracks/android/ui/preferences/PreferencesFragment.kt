package org.owntracks.android.ui.preferences

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.GridView
import android.widget.ImageView
import android.widget.TextView
import androidx.preference.Preference
import androidx.preference.ValidatingEditTextPreference
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import dagger.hilt.android.AndroidEntryPoint
import org.owntracks.android.R
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.support.MascotManager
import org.owntracks.android.support.RequirementsChecker
import javax.inject.Inject

@AndroidEntryPoint
class PreferencesFragment : AbstractPreferenceFragment(), Preferences.OnPreferenceChangeListener {
    @Inject lateinit var mascotManager: MascotManager
    @Inject lateinit var requirementsChecker: RequirementsChecker
    @Inject lateinit var authManager: org.owntracks.android.support.AuthManager

    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        super.onCreatePreferences(savedInstanceState, rootKey)
        setPreferencesFromResource(R.xml.preferences_unified, rootKey)

        // Force hidden security settings to be active
        preferences.tls = true
        preferences.cmd = true
        preferences.remoteConfiguration = true

        // Mascot Selection logic
        findPreference<Preference>("selectMascot")?.setOnPreferenceClickListener {
            showMascotSelectionDialog()
            true
        }

        // Logout logic
        findPreference<Preference>("logout")?.setOnPreferenceClickListener {
            MaterialAlertDialogBuilder(requireContext())
                .setTitle("Sair da Conta")
                .setMessage("Deseja realmente sair? Isso irá desvincular seu rastreador.")
                .setPositiveButton("Sair") { _, _ ->
                    authManager.logout()
                    preferences.setupCompleted = false
                    val intent = Intent(requireContext(), org.owntracks.android.ui.auth.LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    requireActivity().finish()
                }
                .setNegativeButton("Cancelar", null)
                .show()
            true
        }

        // Validators
        mapOf(
            Preferences::deviceId.name to { input: String -> input.isNotBlank() },
            Preferences::tid.name to { input: String -> input.isNotBlank() && input.length <= 2 }
        ).forEach { (preferenceName, validator) ->
            findPreference<ValidatingEditTextPreference>(preferenceName)?.apply {
                validationFunction = validator
            }
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

        val dialog = MaterialAlertDialogBuilder(requireContext())
            .setTitle("Escolha seu Mascote")
            .setView(gridView)
            .setNegativeButton("Cancelar", null)
            .create()

        gridView.setOnItemClickListener { _, _, position, _ ->
            val selectedMascot = mascots[position]
            preferences.face = selectedMascot.id
            dialog.dismiss()
        }

        dialog.show()
    }

    override fun onDisplayPreferenceDialog(preference: Preference) {
        when (preference) {
            is ValidatingEditTextPreference -> {
                ValidatingEditTextPreferenceDialogFragmentCompat(preference)
                    .apply {
                        arguments = Bundle(1).apply { putString("key", preference.key) }
                        setTargetFragment(this@PreferencesFragment, 0)
                    }
                    .show(parentFragmentManager, "androidx.preference.PreferenceFragment.DIALOG")
            }
            else -> super.onDisplayPreferenceDialog(preference)
        }
    }

    override fun onAttach(context: Context) {
        super.onAttach(context)
        preferences.registerOnPreferenceChangedListener(this)
    }

    override fun onDetach() {
        super.onDetach()
        preferences.unregisterOnPreferenceChangedListener(this)
    }

    override fun onPreferenceChanged(properties: Set<String>) {
    }
}
