package org.owntracks.android.model.messages

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import org.owntracks.android.preferences.Preferences

@Serializable
@SerialName(MessageCall.TYPE)
class MessageCall(@Transient private val messageWithId: MessageWithId = MessageWithRandomId()) :
    MessageBase(), MessageWithId {
  @kotlinx.serialization.EncodeDefault(kotlinx.serialization.EncodeDefault.Mode.ALWAYS)
  @SerialName("_id")
  override var messageId: MessageId = messageWithId.messageId

  var sessaoid: String? = null
  var userName: String? = null
  var clienteId: String? = null

  override fun annotateFromPreferences(preferences: Preferences) {
      if (topic.isEmpty()) {
          topic = preferences.pubTopicBaseWithUserDetails + BASETOPIC_SUFFIX
      }
  }

  override fun toString(): String = "[MessageCall]"

  override val baseTopicSuffix: String
    get() = BASETOPIC_SUFFIX

  companion object {
    const val TYPE = "call"
    private const val BASETOPIC_SUFFIX = "/call"
  }
}
