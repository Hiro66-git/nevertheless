/*
 * Verbatim from kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/SealedSerializer.kt), Apache 2.0.
 * Code is identical; long KDoc was stripped for size.
 *
 * Required because androidx.room.migration.bundle.BaseEntityBundle (sealed class)
 * eagerly constructs SealedClassSerializer via its @PublishedApi secondary
 * constructor when DatabaseBundle's class initializer runs inside the Room
 * annotation processor.
 */
package kotlinx.serialization

import kotlinx.serialization.builtins.*
import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.*
import kotlinx.serialization.internal.*
import kotlinx.serialization.modules.*
import kotlin.reflect.*

@InternalSerializationApi
@OptIn(ExperimentalSerializationApi::class)
public class SealedClassSerializer<T : Any>(
    serialName: String,
    override val baseClass: KClass<T>,
    subclasses: Array<KClass<out T>>,
    subclassSerializers: Array<KSerializer<out T>>
) : AbstractPolymorphicSerializer<T>() {

    @PublishedApi
    internal constructor(
        serialName: String,
        baseClass: KClass<T>,
        subclasses: Array<KClass<out T>>,
        subclassSerializers: Array<KSerializer<out T>>,
        classAnnotations: Array<Annotation>
    ) : this(serialName, baseClass, subclasses, subclassSerializers) {
        this._annotations = classAnnotations.asList()
    }

    private var _annotations: List<Annotation> = emptyList()

    override val descriptor: SerialDescriptor by lazy(LazyThreadSafetyMode.PUBLICATION) {
        buildSerialDescriptor(serialName, PolymorphicKind.SEALED) {
            element("type", String.serializer().descriptor)
            val elementDescriptor =
                buildSerialDescriptor("kotlinx.serialization.Sealed<${baseClass.simpleName}>", SerialKind.CONTEXTUAL) {
                    // serialName2Serializer is guaranteed to have no duplicates — checked in `init`.
                    serialName2Serializer.forEach { (name, serializer) ->
                        element(name, serializer.descriptor)
                    }
                }
            element("value", elementDescriptor)
            annotations = _annotations
        }
    }

    private val class2Serializer: Map<KClass<out T>, KSerializer<out T>>
    private val serialName2Serializer: Map<String, KSerializer<out T>>

    init {
        if (subclasses.size != subclassSerializers.size) {
            throw IllegalArgumentException("All subclasses of sealed class ${baseClass.simpleName} should be marked @Serializable")
        }

        class2Serializer = subclasses.zip(subclassSerializers).toMap()
        serialName2Serializer = class2Serializer.entries.groupingBy { it.value.descriptor.serialName }
            .aggregate<Map.Entry<KClass<out T>, KSerializer<out T>>, String, Map.Entry<KClass<*>, KSerializer<out T>>>
            { key, accumulator, element, _ ->
                if (accumulator != null) {
                    error(
                        "Multiple sealed subclasses of '$baseClass' have the same serial name '$key':" +
                                " '${accumulator.key}', '${element.key}'"
                    )
                }
                element
            }.mapValues { it.value.value }
    }

    override fun findPolymorphicSerializerOrNull(
        decoder: CompositeDecoder,
        klassName: String?
    ): DeserializationStrategy<T>? {
        return serialName2Serializer[klassName] ?: super.findPolymorphicSerializerOrNull(decoder, klassName)
    }

    override fun findPolymorphicSerializerOrNull(encoder: Encoder, value: T): SerializationStrategy<T>? {
        return (class2Serializer[value::class] ?: super.findPolymorphicSerializerOrNull(encoder, value))?.cast()
    }
}
