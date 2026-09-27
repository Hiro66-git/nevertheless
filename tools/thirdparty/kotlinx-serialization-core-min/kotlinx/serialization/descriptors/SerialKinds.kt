/*
 * Verbatim from kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/descriptors/SerialKinds.kt), Apache 2.0.
 * Code is identical; long KDoc was stripped for size.
 */
package kotlinx.serialization.descriptors

import kotlinx.serialization.*
import kotlinx.serialization.encoding.*
import kotlinx.serialization.modules.*

@ExperimentalSerializationApi
public sealed class SerialKind {

    @ExperimentalSerializationApi
    public object ENUM : SerialKind()

    @ExperimentalSerializationApi
    public object CONTEXTUAL : SerialKind()

    override fun toString(): String {
        // KNPE should never happen, because SerialKind is sealed and all inheritors are non-anonymous
        return this::class.simpleName!!
    }

    // Provide a stable hashcode for objects
    override fun hashCode(): Int = toString().hashCode()
}

@OptIn(ExperimentalSerializationApi::class) // May be @Experimental, but break clients + makes impossible to use stable PrimitiveSerialDescriptor
public sealed class PrimitiveKind : SerialKind() {
    public object BOOLEAN : PrimitiveKind()
    public object BYTE : PrimitiveKind()
    public object CHAR : PrimitiveKind()
    public object SHORT : PrimitiveKind()
    public object INT : PrimitiveKind()
    public object LONG : PrimitiveKind()
    public object FLOAT : PrimitiveKind()
    public object DOUBLE : PrimitiveKind()
    public object STRING : PrimitiveKind()
}

@ExperimentalSerializationApi
public sealed class StructureKind : SerialKind() {
    public object CLASS : StructureKind()
    public object LIST : StructureKind()
    public object MAP : StructureKind()
    public object OBJECT : StructureKind()
}

@ExperimentalSerializationApi
public sealed class PolymorphicKind : SerialKind() {
    public object SEALED : PolymorphicKind()
    public object OPEN : PolymorphicKind()
}
