/*
 * Trimmed port of kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/descriptors/SerialDescriptors.kt), Apache 2.0.
 *
 * KEPT (verbatim code): buildClassSerialDescriptor, buildSerialDescriptor,
 *   ClassSerialDescriptorBuilder (+ its element() method), SerialDescriptorImpl.
 * DROPPED (never reached on the Room annotation-processor code path):
 *   - public fun PrimitiveSerialDescriptor / SerialDescriptor(serialName, original)
 *     / WrappedSerialDescriptor  (only used by user-defined custom serializers)
 *   - listSerialDescriptor/mapSerialDescriptor/setSerialDescriptor public factories
 *     (Room links directly against internal ArrayListClassDesc instead)
 *   - nullable / nonNullOriginal extensions (require SerialDescriptorForNullable;
 *     only used by the JSON stack and BuiltinSerializersKt.getNullable, both lazy)
 *   - reified serialDescriptor<T>() / element<T>() (require the full serializer()
 *     builtin machinery)
 * Each removal is documented here; nothing on the eager class-initialization
 * path of androidx.room.migration.bundle.* references them.
 */
@file:OptIn(ExperimentalSerializationApi::class)

package kotlinx.serialization.descriptors

import kotlinx.serialization.*
import kotlinx.serialization.builtins.*
import kotlinx.serialization.encoding.*
import kotlinx.serialization.internal.*
import kotlin.reflect.*

@Suppress("FunctionName")
@OptIn(ExperimentalSerializationApi::class)
public fun buildClassSerialDescriptor(
    serialName: String,
    vararg typeParameters: SerialDescriptor,
    builderAction: ClassSerialDescriptorBuilder.() -> Unit = {}
): SerialDescriptor {
    require(serialName.isNotBlank()) { "Blank serial names are prohibited" }
    val sdBuilder = ClassSerialDescriptorBuilder(serialName)
    sdBuilder.builderAction()
    return SerialDescriptorImpl(
        serialName,
        StructureKind.CLASS,
        sdBuilder.elementNames.size,
        typeParameters.toList(),
        sdBuilder
    )
}

@InternalSerializationApi
@OptIn(ExperimentalSerializationApi::class)
public fun buildSerialDescriptor(
    serialName: String,
    kind: SerialKind,
    vararg typeParameters: SerialDescriptor,
    builder: ClassSerialDescriptorBuilder.() -> Unit = {}
): SerialDescriptor {
    require(serialName.isNotBlank()) { "Blank serial names are prohibited" }
    require(kind != StructureKind.CLASS) { "For StructureKind.CLASS please use 'buildClassSerialDescriptor' instead" }
    val sdBuilder = ClassSerialDescriptorBuilder(serialName)
    sdBuilder.builder()
    return SerialDescriptorImpl(serialName, kind, sdBuilder.elementNames.size, typeParameters.toList(), sdBuilder)
}

public class ClassSerialDescriptorBuilder internal constructor(
    public val serialName: String
) {
    @ExperimentalSerializationApi
    @Deprecated(
        "isNullable inside buildSerialDescriptor is deprecated. Please use SerialDescriptor.nullable extension on the builder result.",
        level = DeprecationLevel.ERROR
    )
    public var isNullable: Boolean = false

    @ExperimentalSerializationApi
    public var annotations: List<Annotation> = emptyList()

    internal val elementNames: MutableList<String> = ArrayList()
    private val uniqueNames: MutableSet<String> = HashSet()
    internal val elementDescriptors: MutableList<SerialDescriptor> = ArrayList()
    internal val elementAnnotations: MutableList<List<Annotation>> = ArrayList()
    internal val elementOptionality: MutableList<Boolean> = ArrayList()

    public fun element(
        elementName: String,
        descriptor: SerialDescriptor,
        annotations: List<Annotation> = emptyList(),
        isOptional: Boolean = false
    ) {
        require(uniqueNames.add(elementName)) { "Element with name '$elementName' is already registered in $serialName" }
        elementNames += elementName
        elementDescriptors += descriptor
        elementAnnotations += annotations
        elementOptionality += isOptional
    }
}

@OptIn(ExperimentalSerializationApi::class)
internal class SerialDescriptorImpl(
    override val serialName: String,
    override val kind: SerialKind,
    override val elementsCount: Int,
    typeParameters: List<SerialDescriptor>,
    builder: ClassSerialDescriptorBuilder
) : SerialDescriptor, CachedNames {

    override val annotations: List<Annotation> = builder.annotations
    override val serialNames: Set<String> = builder.elementNames.toHashSet()

    private val elementNames: Array<String> = builder.elementNames.toTypedArray()
    private val elementDescriptors: Array<SerialDescriptor> = builder.elementDescriptors.compactArray()
    private val elementAnnotations: Array<List<Annotation>> = builder.elementAnnotations.toTypedArray()
    private val elementOptionality: BooleanArray = builder.elementOptionality.toBooleanArray()
    private val name2Index: Map<String, Int> = elementNames.withIndex().map { it.value to it.index }.toMap()
    private val typeParametersDescriptors: Array<SerialDescriptor> = typeParameters.compactArray()
    private val _hashCode: Int by lazy { hashCodeImpl(typeParametersDescriptors) }

    override fun getElementName(index: Int): String = elementNames.getChecked(index)
    override fun getElementIndex(name: String): Int = name2Index[name] ?: CompositeDecoder.UNKNOWN_NAME
    override fun getElementAnnotations(index: Int): List<Annotation> = elementAnnotations.getChecked(index)
    override fun getElementDescriptor(index: Int): SerialDescriptor = elementDescriptors.getChecked(index)
    override fun isElementOptional(index: Int): Boolean = elementOptionality.getChecked(index)

    override fun equals(other: Any?): Boolean =
        equalsImpl(other) { otherDescriptor: SerialDescriptorImpl ->
            typeParametersDescriptors.contentEquals(
                otherDescriptor.typeParametersDescriptors
            )
        }

    override fun hashCode(): Int = _hashCode

    override fun toString(): String {
        return (0 until elementsCount).joinToString(", ", prefix = "$serialName(", postfix = ")") {
            getElementName(it) + ": " + getElementDescriptor(it).serialName
        }
    }
}
