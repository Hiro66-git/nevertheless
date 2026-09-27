/*
 * Verbatim from kotlinx.serialization v1.7.1
 * (core/commonMain/src/kotlinx/serialization/SerializationExceptions.kt), Apache 2.0.
 * Code is identical; long KDoc was stripped for size.
 */
package kotlinx.serialization

import kotlinx.serialization.encoding.*
import kotlinx.serialization.descriptors.*

public open class SerializationException : IllegalArgumentException {
    public constructor()
    public constructor(message: String?) : super(message)
    public constructor(message: String?, cause: Throwable?) : super(message, cause)
    public constructor(cause: Throwable?) : super(cause)
}

@ExperimentalSerializationApi
public class MissingFieldException(
    missingFields: List<String>, message: String?, cause: Throwable?
) : SerializationException(message, cause) {

    public val missingFields: List<String> = missingFields

    public constructor(
        missingFields: List<String>,
        serialName: String
    ) : this(
        missingFields,
        if (missingFields.size == 1) "Field '${missingFields[0]}' is required for type with serial name '$serialName', but it was missing"
        else "Fields $missingFields are required for type with serial name '$serialName', but they were missing",
        null
    )

    public constructor(
        missingField: String,
        serialName: String
    ) : this(
        listOf(missingField),
        "Field '$missingField' is required for type with serial name '$serialName', but it was missing",
        null
    )

    @PublishedApi // Constructor used by the generated serializers
    internal constructor(missingField: String) : this(
        listOf(missingField),
        "Field '$missingField' is required, but it was missing",
        null
    )
}

@PublishedApi
internal class UnknownFieldException
// This constructor is used by coroutines exception recovery
internal constructor(message: String?) : SerializationException(message) {
    // This constructor is used by the generated serializers
    constructor(index: Int) : this("An unknown field for index $index")
}
