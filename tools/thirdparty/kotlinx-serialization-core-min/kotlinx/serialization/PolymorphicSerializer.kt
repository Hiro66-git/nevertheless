/*
 * Trimmed port of kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/PolymorphicSerializer.kt), Apache 2.0.
 *
 * KEPT (verbatim code): the two top-level findPolymorphicSerializer extension
 *   functions. AbstractPolymorphicSerializer.kt (kept verbatim) calls them
 *   unqualified; they live in the root kotlinx.serialization package so its
 *   `import kotlinx.serialization.*` picks them up.
 * DROPPED: the PolymorphicSerializer class itself — it is only constructed for
 *   open polymorphism (@Polymorphic / interfaces), which nothing on the Room
 *   annotation-processor code path does. (It would also require the
 *   descriptors.ContextAware.withContext extension from ContextAware.kt.)
 */
package kotlinx.serialization

import kotlinx.serialization.encoding.*
import kotlin.reflect.*
import kotlinx.serialization.internal.*

@InternalSerializationApi
public fun <T : Any> AbstractPolymorphicSerializer<T>.findPolymorphicSerializer(
    decoder: CompositeDecoder,
    klassName: String?
): DeserializationStrategy<T> =
    findPolymorphicSerializerOrNull(decoder, klassName) ?: throwSubtypeNotRegistered(klassName, baseClass)

@InternalSerializationApi
public fun <T : Any> AbstractPolymorphicSerializer<T>.findPolymorphicSerializer(
    encoder: Encoder,
    value: T
): SerializationStrategy<T> =
    findPolymorphicSerializerOrNull(encoder, value) ?: throwSubtypeNotRegistered(value::class, baseClass)
