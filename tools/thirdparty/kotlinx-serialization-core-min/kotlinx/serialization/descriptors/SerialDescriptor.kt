/*
 * Verbatim from kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/descriptors/SerialDescriptor.kt), Apache 2.0.
 * Code is identical; long KDoc was stripped for size.
 */
package kotlinx.serialization.descriptors

import kotlinx.serialization.*
import kotlinx.serialization.builtins.*
import kotlinx.serialization.encoding.*

public interface SerialDescriptor {
    @ExperimentalSerializationApi
    public val serialName: String

    @ExperimentalSerializationApi
    public val kind: SerialKind

    @ExperimentalSerializationApi
    public val isNullable: Boolean get() = false

    public val isInline: Boolean get() = false

    @ExperimentalSerializationApi
    public val elementsCount: Int

    @ExperimentalSerializationApi
    public val annotations: List<Annotation> get() = emptyList()

    @ExperimentalSerializationApi
    public fun getElementName(index: Int): String

    @ExperimentalSerializationApi
    public fun getElementIndex(name: String): Int

    @ExperimentalSerializationApi
    public fun getElementAnnotations(index: Int): List<Annotation>

    @ExperimentalSerializationApi
    public fun getElementDescriptor(index: Int): SerialDescriptor

    @ExperimentalSerializationApi
    public fun isElementOptional(index: Int): Boolean
}

@ExperimentalSerializationApi
public val SerialDescriptor.elementDescriptors: Iterable<SerialDescriptor>
    get() = Iterable {
        object : Iterator<SerialDescriptor> {
            private var elementsLeft = elementsCount
            override fun hasNext(): Boolean = elementsLeft > 0

            override fun next(): SerialDescriptor {
                return getElementDescriptor(elementsCount - (elementsLeft--))
            }
        }
    }

@ExperimentalSerializationApi
public val SerialDescriptor.elementNames: Iterable<String>
    get() = Iterable {
        object : Iterator<String> {
            private var elementsLeft = elementsCount
            override fun hasNext(): Boolean = elementsLeft > 0

            override fun next(): String {
                return getElementName(elementsCount - (elementsLeft--))
            }
        }
    }
