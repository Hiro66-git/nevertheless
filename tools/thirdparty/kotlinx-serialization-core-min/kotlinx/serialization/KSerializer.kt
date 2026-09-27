/*
 * Verbatim from kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/KSerializer.kt), Apache 2.0.
 * Code is identical; long KDoc was stripped for size.
 */
package kotlinx.serialization

import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.*

public interface KSerializer<T> : SerializationStrategy<T>, DeserializationStrategy<T> {
    override val descriptor: SerialDescriptor
}

public interface SerializationStrategy<in T> {
    public val descriptor: SerialDescriptor
    public fun serialize(encoder: Encoder, value: T)
}

public interface DeserializationStrategy<out T> {
    public val descriptor: SerialDescriptor
    public fun deserialize(decoder: Decoder): T
}
