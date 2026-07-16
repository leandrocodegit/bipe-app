package org.owntracks.android.model.messages

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.Transient
import org.owntracks.android.preferences.Preferences

@Serializable
@SerialName(MessageRTC.TYPE)
class MessageRTC(@Transient private val messageWithId: MessageWithId = MessageWithRandomId()) :
    MessageBase(), MessageWithId {
  @kotlinx.serialization.EncodeDefault(kotlinx.serialization.EncodeDefault.Mode.ALWAYS)
  @SerialName("_id")
  override var messageId: MessageId = messageWithId.messageId

  var subtype: String? = null // "offer", "answer", "candidate"
  var sdp: String? = null
  var candidate: String? = null
  var sdpMid: String? = null
  var sdpMLineIndex: Int? = null
  var senderId: String? = null
  var sessaoid: String? = null
  var userName: String? = null
  var clienteId: String? = null

  override fun isValidMessage(): Boolean {
    return super.isValidMessage() && subtype != null
  }

  override fun toString(): String = "[MessageRTC subtype=$subtype]"

  override fun annotateFromPreferences(preferences: Preferences) {
      if (topic.isEmpty()) {
          topic = preferences.pubTopicBaseWithUserDetails + BASETOPIC_SUFFIX
      }
      qos = 1
      retained = false
  }

  override val baseTopicSuffix: String
    get() = BASETOPIC_SUFFIX

  companion object {
    const val TYPE = "rtc"
    private const val BASETOPIC_SUFFIX = "/rtc"
  }
}
