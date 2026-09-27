/*
 * Assembled from kotlinx.serialization v1.7.1 internal sources
 * (core/commonMain/src/kotlinx/serialization/internal/Platform.common.kt and
 *  core/jvmMain getChecked actuals), Apache 2.0 license.
 * Trimmed to the declarations required by PluginGeneratedSerialDescriptor so the
 * Room annotation processor can run on the JVM; the platform `expect` declarations
 * were replaced by their JVM `actual` implementations.
 */
@file:OptIn(ExperimentalSerializationApi::class)
@file:Suppress("UNUSED")

package kotlinx.serialization.internal

import kotlinx.serialization.*
import kotlinx.serialization.descriptors.*

// NOTE: EMPTY_SERIALIZER_ARRAY is declared in PluginHelperInterfaces.kt (its real
// v1.7.1 home) — it was removed here to avoid a redeclaration conflict.

/** JVM actual for `expect fun <T> Array<T>.getChecked(index: Int): T`. */
internal fun <T> Array<T>.getChecked(index: Int): T {
    if (index < 0 || index >= size) throw IndexOutOfBoundsException("Index $index out of bounds for size $size")
    return get(index)
}

/** JVM actual for `expect fun BooleanArray.getChecked(index: Int): Boolean`. */
internal fun BooleanArray.getChecked(index: Int): Boolean {
    if (index < 0 || index >= size) throw IndexOutOfBoundsException("Index $index out of bounds for size $size")
    return get(index)
}

private val EMPTY_DESCRIPTOR_ARRAY: Array<SerialDescriptor> = arrayOf()

/**
 * Same as [toTypedArray], but uses special empty array constant, if [this]
 * is null or empty.
 */
internal fun List<SerialDescriptor>?.compactArray(): Array<SerialDescriptor> =
    takeUnless { it.isNullOrEmpty() }?.toTypedArray() ?: EMPTY_DESCRIPTOR_ARRAY

internal fun SerialDescriptor.cachedSerialNames(): Set<String> {
    if (this is CachedNames) return serialNames
    val result = HashSet<String>(elementsCount)
    for (i in 0 until elementsCount) {
        result += getElementName(i)
    }
    return result
}

// NOTE: no `elementDescriptors` extension is declared here on purpose.
// PGSD.kt's hashCodeImpl (verbatim v1.7.1) uses the public
// kotlinx.serialization.descriptors.elementDescriptors (Iterable) extension
// via its star import; declaring a same-package extension would shadow it
// and break compilation of the verbatim source.

internal inline fun <T, K> Iterable<T>.elementsHashCodeBy(selector: (T) -> K): Int {
    return fold(1) { hash, element -> 31 * hash + selector(element).hashCode() }
}

@Suppress("UNCHECKED_CAST", "NOTHING_TO_INLINE")
@PublishedApi
internal inline fun <T> KSerializer<*>.cast(): KSerializer<T> = this as KSerializer<T>

@Suppress("UNCHECKED_CAST", "NOTHING_TO_INLINE")
@PublishedApi
internal inline fun <T> SerializationStrategy<*>.cast(): SerializationStrategy<T> = this as SerializationStrategy<T>

@Suppress("UNCHECKED_CAST", "NOTHING_TO_INLINE")
@PublishedApi
internal inline fun <T> DeserializationStrategy<*>.cast(): DeserializationStrategy<T> =
    this as DeserializationStrategy<T>
