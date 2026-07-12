package org.owntracks.android.support

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import androidx.core.content.ContextCompat
import org.owntracks.android.R
import org.owntracks.android.preferences.Preferences
import java.io.ByteArrayOutputStream
import android.util.Base64
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.owntracks.android.data.repos.ContactsRepo
import org.owntracks.android.model.messages.MessageCard
import org.owntracks.android.services.LocationProcessor
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MascotManager @Inject constructor(
    private val preferences: Preferences,
    private val locationProcessor: LocationProcessor,
    private val contactsRepo: ContactsRepo
) {
    data class Mascot(val id: String, val name: String, val drawableRes: Int)

    fun getMascotName(resourceName: String): String? {
        val id = resourceName.replace("animal_", "")
        val animals = listOf(
            "leao" to "Leão", "tigre" to "Tigre", "urso" to "Urso", "coelho" to "Coelho",
            "lobo" to "Lobo", "porco" to "Porco", "gato" to "Gato", "cachorro" to "Cão",
            "panda" to "Panda", "macaco" to "Macaco", "elefante" to "Elefante", "caranguejo" to "Caranguejo ",
            "girafa" to "Girafa", "pinguim" to "Pinguim", "sapo" to "Sapo", "rato" to "Rato", "polvo" to "Polvo", "aguia" to "Águia",
            "tubarao" to "Tubarão", "vaca" to "Vaca", "alien" to "Alien", "cavalo" to "Cavalo"
        )
        return animals.find { it.first == id }?.second
    }

    fun getMascots(context: Context): List<Mascot> {
        val animals = listOf(
            "leao" to "Leão", "tigre" to "Tigre", "urso" to "Urso", "coelho" to "Coelho",
            "lobo" to "Lobo", "porco" to "Porco", "gato" to "Gato", "cachorro" to "Cão",
            "panda" to "Panda", "macaco" to "Macaco", "elefante" to "Elefante", "caranguejo" to "Caranguejo ",
            "girafa" to "Girafa", "pinguim" to "Pinguim", "sapo" to "Sapo", "rato" to "Rato", "polvo" to "Polvo", "aguia" to "Águia",
            "tubarao" to "Tubarão", "vaca" to "Vaca", "alien" to "Alien", "cavalo" to "Cavalo"
        )

        return animals.map { (id, name) ->
            val resourceName = "animal_$id"
            val resId = context.resources.getIdentifier(resourceName, "drawable", context.packageName)
            Mascot(id, name, if (resId != 0) resId else R.drawable.ic_owntracks_80)
        }
    }

    fun getRandomMascotId(): String {
        val animalIds = listOf(
            "leao", "tigre", "urso", "coelho", "lobo", "porco", "gato", "cachorro",
            "panda", "macaco", "elefante", "caranguejo", "girafa", "pinguim",
            "sapo", "rato", "polvo", "aguia", "tubarao", "vaca", "alien", "cavalo"
        )
        return "animal_${animalIds[java.util.Random().nextInt(animalIds.size)]}"
    }

    fun getRandomMascot(context: Context): Mascot {
        val mascots = getMascots(context)
        return mascots[java.util.Random().nextInt(mascots.size)]
    }

    suspend fun setMascot(context: Context, mascot: Mascot) = withContext(Dispatchers.IO) {
        val resourceName = "animal_${mascot.id}"
        // Save resource name to 'face' preference instead of Base64
        preferences.face = resourceName

        // Update local contact immediately so map updates without restart
        val contactId = preferences.pubTopicLocations
        val card = MessageCard().apply {
            name = preferences.deviceId
            face = resourceName
            trackerId = preferences.tid.toString()
        }
        contactsRepo.update(contactId, card)

        // Trigger card publication so others see the new mascot immediately
        locationProcessor.publishCardMessage()
    }

    private fun drawableToBitmap(drawable: Drawable): Bitmap {
        val bitmap = Bitmap.createBitmap(128, 128, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        drawable.setBounds(0, 0, canvas.width, canvas.height)
        drawable.draw(canvas)
        return bitmap
    }

    private fun bitmapToBase64(bitmap: Bitmap): String {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        return Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
    }
}
