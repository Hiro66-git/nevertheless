/*
 * Trimmed port of kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/internal/CollectionSerializers.kt), Apache 2.0.
 *
 * KEPT (verbatim code): AbstractCollectionSerializer, CollectionLikeSerializer,
 *   CollectionSerializer, ArrayListSerializer.
 *   ArrayListSerializer is constructed EAGERLY by the class initializers of
 *   androidx.room.migration.bundle.{EntityBundle,DatabaseBundle} (their
 *   $childSerializers arrays), so the full super-chain must be present.
 * DROPPED (never referenced by room-migration bytecode nor by the eager
 *   initialization chain): MapLikeSerializer, PrimitiveArrayBuilder,
 *   PrimitiveArraySerializer, ReferenceArraySerializer, LinkedHashSetSerializer,
 *   HashSetSerializer, LinkedHashMapSerializer, HashMapSerializer.
 */
@file:Suppress("DEPRECATION_ERROR")
@file:OptIn(ExperimentalSerializationApi::class)
package kotlinx.serialization.internal

import kotlinx.serialization.*
import kotlinx.serialization.descriptors.*
import kotlinx.serialization.encoding.*

@InternalSerializationApi
public sealed class AbstractCollectionSerializer<Element, Collection, Builder> : KSerializer<Collection> {
    protected abstract fun Collection.collectionSize(): Int
    protected abstract fun Collection.collectionIterator(): Iterator<Element>
    protected abstract fun builder(): Builder
    protected abstract fun Builder.builderSize(): Int
    protected abstract fun Builder.toResult(): Collection
    protected abstract fun Collection.toBuilder(): Builder
    protected abstract fun Builder.checkCapacity(size: Int)

    abstract override fun serialize(encoder: Encoder, value: Collection)

    @InternalSerializationApi
    public fun merge(decoder: Decoder, previous: Collection?): Collection {
        val builder = previous?.toBuilder() ?: builder()
        val startIndex = builder.builderSize()
        val compositeDecoder = decoder.beginStructure(descriptor)
        if (compositeDecoder.decodeSequentially()) {
            readAll(compositeDecoder, builder, startIndex, readSize(compositeDecoder, builder))
        } else {
            while (true) {
                val index = compositeDecoder.decodeElementIndex(descriptor)
                if (index == CompositeDecoder.DECODE_DONE) break
                readElement(compositeDecoder, startIndex + index, builder)
            }
        }
        compositeDecoder.endStructure(descriptor)
        return builder.toResult()
    }

    override fun deserialize(decoder: Decoder): Collection = merge(decoder, null)

    private fun readSize(decoder: CompositeDecoder, builder: Builder): Int {
        val size = decoder.decodeCollectionSize(descriptor)
        builder.checkCapacity(size)
        return size
    }

    protected abstract fun readElement(decoder: CompositeDecoder, index: Int, builder: Builder, checkIndex: Boolean = true)

    protected abstract fun readAll(decoder: CompositeDecoder, builder: Builder, startIndex: Int, size: Int)
}

@PublishedApi
internal sealed class CollectionLikeSerializer<Element, Collection, Builder>(
    private val elementSerializer: KSerializer<Element>
) : AbstractCollectionSerializer<Element, Collection, Builder>() {

    protected abstract fun Builder.insert(index: Int, element: Element)
    abstract override val descriptor: SerialDescriptor

    override fun serialize(encoder: Encoder, value: Collection) {
        val size = value.collectionSize()
        encoder.encodeCollection(descriptor, size) {
            val iterator = value.collectionIterator()
            for (index in 0 until size)
                encodeSerializableElement(descriptor, index, elementSerializer, iterator.next())
        }
    }

    final override fun readAll(decoder: CompositeDecoder, builder: Builder, startIndex: Int, size: Int) {
        require(size >= 0) { "Size must be known in advance when using READ_ALL" }
        for (index in 0 until size)
            readElement(decoder, startIndex + index, builder, checkIndex = false)
    }

    override fun readElement(decoder: CompositeDecoder, index: Int, builder: Builder, checkIndex: Boolean) {
        builder.insert(index, decoder.decodeSerializableElement(descriptor, index, elementSerializer))
    }
}

@PublishedApi
internal abstract class CollectionSerializer<E, C: Collection<E>, B>(element: KSerializer<E>) : CollectionLikeSerializer<E, C, B>(element) {
    override fun C.collectionSize(): Int = size
    override fun C.collectionIterator(): Iterator<E> = iterator()
}

@InternalSerializationApi
@PublishedApi
internal class ArrayListSerializer<E>(element: KSerializer<E>) : CollectionSerializer<E, List<E>, ArrayList<E>>(element) {
    override val descriptor: SerialDescriptor = ArrayListClassDesc(element.descriptor)

    override fun builder(): ArrayList<E> = arrayListOf()
    override fun ArrayList<E>.builderSize(): Int = size
    override fun ArrayList<E>.toResult(): List<E> = this
    override fun List<E>.toBuilder(): ArrayList<E> = this as? ArrayList<E> ?: ArrayList(this)
    override fun ArrayList<E>.checkCapacity(size: Int): Unit = ensureCapacity(size)
    override fun ArrayList<E>.insert(index: Int, element: E) { add(index, element) }
}
