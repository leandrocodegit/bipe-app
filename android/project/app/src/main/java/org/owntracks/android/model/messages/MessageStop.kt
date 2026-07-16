package org.owntracks.android.model.messages

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import org.owntracks.android.preferences.Preferences

@Serializable
@SerialName(MessageStop.TYPE)
class MessageStop(@Transient private val messageWithId: MessageWithId = MessageWithRandomId()) :
    MessageBase(), MessageWithId {
  @kotlinx.serialization.EncodeDefault(kotlinx.serialization.EncodeDefault.Mode.ALWAYS)
  @SerialName("_id")
  override var messageId: MessageId = messageWithId.messageId

  override fun annotateFromPreferences(preferences: Preferences) {
      topic = preferences.pubTopicBaseWithUserDetails + BASETOPIC_SUFFIX
  }

  override fun toString(): String = "[MessageStop]"

  override val baseTopicSuffix: String
    get() = BASETOPIC_SUFFIX

  companion object {
    const val TYPE = "stop"
    private const val BASETOPIC_SUFFIX = "/call" // We receive stop on the same channel as call
  }
}
