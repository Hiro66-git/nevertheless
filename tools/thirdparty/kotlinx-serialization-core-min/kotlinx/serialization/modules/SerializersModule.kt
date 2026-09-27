/*
 * Compatibility shim trimmed from kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/modules/SerializersModule.kt), Apache 2.0.
 *
 * The real SerializersModule carries the contextual/polymorphic serializer
 * registry (SerializersModuleBuilder, polymorphic DSL, EmptySerializersModule,
 * SerializersModuleKt.combine etc.). NONE of that machinery is reachable on the
 * Room annotation-processor code path (Room never serializes; the JSON stack
 * that would build a module lives behind SchemaBundleKt's lazy `json` val,
 * which never initializes when exportSchema=false and autoMigrations is empty).
 *
 * What IS required:
 *  1. The TYPE kotlinx.serialization.modules.SerializersModule, because the
 *     Encoder/Decoder interfaces declare `val serializersModule: SerializersModule`.
 *  2. The two `getPolymorphic` members, because AbstractPolymorphicSerializer
 *     (kept verbatim) calls them from findPolymorphicSerializerOrNull. They are
 *     never invoked on the Room path (polymorphic serialization never runs), but
 *     they must exist for the verbatim superclass to compile.
 * The return values match upstream's "module knows nothing" behaviour (null),
 * which upstream would turn into throwSubtypeNotRegistered.
 */
package kotlinx.serialization.modules

import kotlin.reflect.KClass
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.SerializationStrategy

public abstract class SerializersModule {
    internal open fun <T : Any> getPolymorphic(baseClass: KClass<T>, value: T): SerializationStrategy<T>? = null
    internal open fun <T : Any> getPolymorphic(baseClass: KClass<T>, baseClassName: String?): DeserializationStrategy<T>? = null
}
