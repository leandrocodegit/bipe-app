package org.owntracks.android.support

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import android.widget.ImageView
import androidx.core.content.ContextCompat
import androidx.core.graphics.scale
import androidx.databinding.BindingAdapter
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.owntracks.android.model.Contact
import org.owntracks.android.preferences.Preferences
import org.owntracks.android.support.widgets.TextDrawable
import timber.log.Timber

class ContactImageBindingAdapter
@Inject
constructor(
    @ApplicationContext private val context: Context,
    private val memoryCache: ContactBitmapAndNameMemoryCache,
    private val preferences: Preferences
) {
  @BindingAdapter(value = ["contact", "coroutineScope"])
  fun ImageView.displayFaceInViewAsync(contact: Contact?, scope: CoroutineScope) {
    contact?.also { scope.launch(Dispatchers.Main) { setImageBitmap(getBitmapFromCache(it)) } }
  }

  private val faceDimensions = (48 * (context.resources.displayMetrics.densityDpi / 160f)).toInt()
  private val cacheMutex = Mutex()


  suspend fun getBitmapFromCache(contact: Contact): Bitmap {
    Timber.v("Getting face bitmap for ${contact.id}")
    return withContext(Dispatchers.IO) {
      cacheMutex.withLock {
        val contactBitMapAndName = memoryCache[contact.id]

        if (contactBitMapAndName != null &&
            contactBitMapAndName is ContactBitmapAndName.CardBitmap &&
            contactBitMapAndName.bitmap != null) {
          Timber.v("Returning face bitmap for ${contact.id} from cache")
          return@withContext contactBitMapAndName.bitmap
        }

        // If it's the local user, and we don't have a face/color from the broker yet, use the local preferences
        val localUserTopic = preferences.pubTopicLocations
        val isLocalUser = contact.id == preferences.username || 
                         contact.id == "${preferences.username}/${preferences.deviceId}" ||
                         localUserTopic.endsWith(contact.id)

        val faceToUse = contact.face ?: if (isLocalUser) preferences.face else null
        
        val contactColor = contact.color ?: if (isLocalUser) preferences.markerColor else null
        val colorToUse = try {
            if (contactColor?.startsWith("#") == true) {
                android.graphics.Color.parseColor(contactColor)
            } else {
                TextDrawable.ColorGenerator.MATERIAL.getColor(contact.id)
            }
        } catch (e: Exception) {
            TextDrawable.ColorGenerator.MATERIAL.getColor(contact.id)
        }

        return@withContext faceToUse?.run {
          if (startsWith("animal_")) {
            // It's a resource name. Load it.
            val resId = context.resources.getIdentifier(this, "drawable", context.packageName)
            if (resId != 0) {
              ContextCompat.getDrawable(context, resId)?.run {
                val bitmap = drawableToBitmap(this)
                getPinShape(
                  bitmap.scale(faceDimensions, faceDimensions),
                  colorToUse
                ).also { finalBitmap ->
                  memoryCache.put(
                    contact.id,
                    ContactBitmapAndName.CardBitmap(contact.displayName, finalBitmap),
                  )
                }
              }
            } else null
          } else {
            // There's a base64 face pic. Decode and cache it.
            try {
              val decodedBytes = Base64.decode(this, Base64.DEFAULT)
              BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                  ?.run {
                    getPinShape(
                        this.scale(faceDimensions, faceDimensions),
                        colorToUse
                    )
                  }
                  ?.also { bitmap ->
                    memoryCache.put(
                        contact.id,
                        ContactBitmapAndName.CardBitmap(contact.displayName, bitmap),
                    )
                  }
            } catch (e: Exception) {
              Timber.d(e, "Failed to decode base64 face pic for ${contact.id}")
              null
            }
          }
        }
            ?: run {
              // No face pic. Generate a fallback bitmap and cache it.
              memoryCache[contact.id]?.run {
                if (this is ContactBitmapAndName.TrackerIdBitmap &&
                    this.trackerId == contact.trackerId) {
                  this.bitmap
                } else {
                  null
                }
              }
                  ?: run {
                    getFallbackPin(contact.trackerId, contact.id, contact).also { bitmap ->
                      memoryCache.put(
                          contact.id,
                          ContactBitmapAndName.TrackerIdBitmap(contact.trackerId, bitmap),
                      )
                    }
                  }
            }
      }
    }
  }

  private fun getFallbackPin(text: String, colorKey: String, contact: Contact? = null): Bitmap {
    val localUserTopic = preferences.pubTopicLocations
    val isLocalUser = contact?.let { it.id == preferences.username || 
                         it.id == "${preferences.username}/${preferences.deviceId}" ||
                         localUserTopic.endsWith(it.id) } ?: false

    val contactColor = contact?.color ?: if (isLocalUser) preferences.markerColor else null
    val color = try {
        if (contactColor?.startsWith("#") == true) {
            android.graphics.Color.parseColor(contactColor)
        } else {
            TextDrawable.ColorGenerator.MATERIAL.getColor(colorKey)
        }
    } catch (_: Exception) {
        TextDrawable.ColorGenerator.MATERIAL.getColor(colorKey)
    }

    val size = (faceDimensions * 1.2).toInt()
    val output = Bitmap.createBitmap(size, (size * 1.4).toInt(), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    // Draw pin tail
    val path = android.graphics.Path()
    path.moveTo(size / 2f, output.height.toFloat())
    path.lineTo(size * 0.2f, size * 0.8f)
    path.lineTo(size * 0.8f, size * 0.8f)
    path.close()
    paint.color = color
    canvas.drawPath(path, paint)

    // Draw pin head
    canvas.drawCircle(size / 2f, size / 2f, size / 2f, paint)

    // Draw text
    paint.color = android.graphics.Color.WHITE
    paint.textSize = size / 2f
    paint.textAlign = Paint.Align.CENTER
    val textBounds = Rect()
    paint.getTextBounds(text, 0, text.length, textBounds)
    canvas.drawText(text, size / 2f, size / 2f - textBounds.centerY(), paint)

    return output
  }

  private fun getPinShape(bitmap: Bitmap, color: Int): Bitmap {
    val size = bitmap.width
    val padding = (size * 0.1).toInt()
    val totalWidth = size + padding * 2
    val totalHeight = (totalWidth * 1.4).toInt()
    
    val output = Bitmap.createBitmap(totalWidth, totalHeight, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(output)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)

    // Draw pin tail
    val path = android.graphics.Path()
    path.moveTo(totalWidth / 2f, totalHeight.toFloat())
    path.lineTo(totalWidth * 0.2f, totalWidth * 0.8f)
    path.lineTo(totalWidth * 0.8f, totalWidth * 0.8f)
    path.close()
    paint.color = color
    canvas.drawPath(path, paint)

    // Draw pin head (border)
    canvas.drawCircle(totalWidth / 2f, totalWidth / 2f, totalWidth / 2f, paint)

    // Draw white background for image
    paint.color = android.graphics.Color.WHITE
    canvas.drawCircle(totalWidth / 2f, totalWidth / 2f, size / 2f, paint)

    // Draw image clipped to circle
    val rect = Rect(0, 0, bitmap.width, bitmap.height)
    val rectF = RectF(padding.toFloat(), padding.toFloat(), (padding + size).toFloat(), (padding + size).toFloat())
    
    val imagePaint = Paint(Paint.ANTI_ALIAS_FLAG)
    val saveCount = canvas.saveLayer(rectF, null)
    canvas.drawCircle(totalWidth / 2f, totalWidth / 2f, size / 2f, imagePaint)
    imagePaint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
    canvas.drawBitmap(bitmap, rect, rectF, imagePaint)
    canvas.restoreToCount(saveCount)

    return output
  }

  private fun drawableToBitmap(drawable: Drawable): Bitmap {
    if (drawable is BitmapDrawable) {
      return drawable.bitmap
    }
    var width = drawable.intrinsicWidth
    width = if (width > 0) width else faceDimensions
    var height = drawable.intrinsicHeight
    height = if (height > 0) height else faceDimensions
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    drawable.setBounds(0, 0, canvas.width, canvas.height)
    drawable.draw(canvas)
    return bitmap
  }
}
