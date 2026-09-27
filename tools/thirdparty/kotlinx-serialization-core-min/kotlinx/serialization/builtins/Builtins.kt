/*
 * Compatibility shim trimmed from kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/builtins/Builtins.kt), Apache 2.0.
 *
 * ONLY String.Companion.serializer() is provided. It is required so that
 * SealedSerializer.kt (kept verbatim from v1.7.1) compiles: its lazy
 * `descriptor` initializer calls String.serializer().descriptor. Upstream this
 * function is declared in builtins/Builtins.kt next to the other primitive
 * serializer() extensions; every other extension from that file was dropped
 * because nothing on the Room annotation-processor code path references it.
 */
package kotlinx.serialization.builtins

import kotlinx.serialization.KSerializer
import kotlinx.serialization.internal.StringSerializer

public fun String.Companion.serializer(): KSerializer<String> = StringSerializer
