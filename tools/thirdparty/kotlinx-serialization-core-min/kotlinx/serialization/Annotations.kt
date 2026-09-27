/*
 * Trimmed port of kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/Annotations.kt), Apache 2.0.
 * ONLY the two opt-in annotations referenced by the minimal core layer are kept.
 * Code is verbatim; long KDoc was stripped. All other annotations (Serializable,
 * SerialName, SerialInfo, ...) are NOT required to run the Room annotation
 * processor against precompiled migration bundle classes and are omitted.
 */
package kotlinx.serialization

@MustBeDocumented
@Target(AnnotationTarget.CLASS, AnnotationTarget.PROPERTY, AnnotationTarget.FUNCTION, AnnotationTarget.TYPEALIAS)
@RequiresOptIn(level = RequiresOptIn.Level.WARNING)
public annotation class ExperimentalSerializationApi

@MustBeDocumented
@Target(AnnotationTarget.CLASS, AnnotationTarget.PROPERTY, AnnotationTarget.FUNCTION, AnnotationTarget.TYPEALIAS)
@RequiresOptIn(level = RequiresOptIn.Level.ERROR)
public annotation class InternalSerializationApi
