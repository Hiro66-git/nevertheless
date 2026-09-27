# kotlinx-serialization-core-min (v1.7.1 compatibility layer)

A minimal, self-built replacement for `kotlinx-serialization-core-jvm:1.7.1`
that exists solely so **Room's annotation processor (androidx.room:
room-compiler 2.7.0-beta01) can run inside the offline Aegis build toolchain**.

## Why it exists

`room-migration-jvm-2.7.0-beta01.jar` (a hard dependency of room-compiler)
links against kotlinx.serialization classes because Room's schema/identity-hash
machinery reuses the `androidx.room.migration.bundle.*` data classes that the
kotlinx.serialization compiler plugin instrumented at Room's build time.
Maven Central and all mirrors are unreachable from this build environment
(see the blocked-host list in the session docs), so the required binary cannot
be downloaded — instead the small subset actually reached at annotation-
processing time was recompiled from the official v1.7.1 sources.

The relevant behaviour was verified against the *bytecode* of
room-migration-jvm (javap), not guessed: when `exportSchema = false` and
`autoMigrations` is empty, Room never serializes anything; the serialization
classes are touched only by JVM class initialization of the bundle classes
(`EntityBundle`, `DatabaseBundle`, `BaseEntityBundle`, ...):

* `EntityBundle.<clinit>` builds a `$childSerializers` array that eagerly
  constructs `internal.ArrayListSerializer` (→ `CollectionSerializer` →
  `CollectionLikeSerializer` → `AbstractCollectionSerializer`, plus
  `ArrayListClassDesc`/`ListLikeDescriptor` descriptors).
* `DatabaseBundle.<clinit>` eagerly constructs
  `ArrayListSerializer(StringSerializer.INSTANCE)` and calls
  `BaseEntityBundle$Companion.serializer()`, which constructs
  `kotlinx.serialization.SealedClassSerializer` (sealed `BaseEntityBundle`)
  via its `@PublishedApi` secondary constructor — its `init` block reads
  `.descriptor.serialName` of `EntityBundle$$serializer` and
  `FtsEntityBundle$$serializer`, each of which initializes a
  `PluginGeneratedSerialDescriptor` and calls `addElement` for every field.
* The identity hash is computed by `SchemaIdentityKey` — **no serialization
  executes**. The JSON stack (`kotlinx.serialization.json.*`,
  `SchemaBundleKt`, `SerializersModuleBuilder`) never loads on this path.

## Contents

Verbatim from
[GitHub tag v1.7.1](https://github.com/Kotlin/kotlinx.serialization/tree/v1.7.1)
(`core/commonMain/src/kotlinx/serialization/...`, Apache 2.0), with long KDoc
stripped but code identical, unless noted as a trimmed port in the file header:

| File | Status |
| --- | --- |
| `Annotations.kt` | trimmed: only `ExperimentalSerializationApi` + `InternalSerializationApi` |
| `KSerializer.kt` | verbatim |
| `PolymorphicSerializer.kt` | trimmed: only the two `findPolymorphicSerializer` extensions |
| `SealedSerializer.kt` | verbatim |
| `SerializationExceptions.kt` | verbatim |
| `builtins/Builtins.kt` | shim: only `String.Companion.serializer()` |
| `descriptors/SerialDescriptor.kt` | verbatim |
| `descriptors/SerialDescriptors.kt` | trimmed: builders + `SerialDescriptorImpl` + `ClassSerialDescriptorBuilder` only |
| `descriptors/SerialKinds.kt` | verbatim |
| `encoding/Encoding.kt` | verbatim |
| `encoding/Decoding.kt` | verbatim |
| `internal/AbstractPolymorphicSerializer.kt` | verbatim |
| `internal/CachedNames.kt` | verbatim |
| `internal/CollectionDescriptors.kt` | verbatim |
| `internal/CollectionSerializers.kt` | trimmed: `ArrayListSerializer` chain only |
| `internal/PlatformSupport.kt` | assembled: JVM actuals of `Platform.common.kt` `expect` declarations |
| `internal/PluginGeneratedSerialDescriptor.kt` | verbatim |
| `internal/PluginHelperInterfaces.kt` | verbatim minus the `kotlin.native.concurrent` import |
| `internal/Primitives.kt` | trimmed: `PrimitiveSerialDescriptor` + 9 primitive objects |
| `modules/SerializersModule.kt` | shim: abstract class + the two `getPolymorphic` members |

Documented deviations (all listed in file headers):
* `PrimitiveDescriptorSafe`/`checkName` dropped (unreachable; the kept objects
  use the internal `PrimitiveSerialDescriptor` constructor directly, exactly
  as upstream).
* `SerializersModule` is a behavioural stub whose `getPolymorphic` returns
  `null` — matching upstream's empty-module semantics; it is never invoked on
  the Room path.
* The full JSON stack, `NullableSerializer`/`BuiltinSerializersKt.getNullable`,
  `PluginExceptionsKt` and the reified `serializer<T>()` machinery are absent
  (only reachable from serialization *method bodies*, which never execute
  under the processor).

## Build

```bash
source /opt/aegis-tc/env.sh   # JDK 17 + kotlinc 2.0.21
cd tools/thirdparty/kotlinx-serialization-core-min
$KOTLINC -jvm-target 17 \
  -opt-in=kotlinx.serialization.InternalSerializationApi \
  -opt-in=kotlinx.serialization.ExperimentalSerializationApi \
  -d /tmp/kxser-out $(find . -name '*.kt' | sort)
jar cf kotlinx-serialization-core-min.jar -C /tmp/kxser-out .
```

Result: 0 errors, 0 warnings, 88 class files. The prebuilt jar committed here
was produced by exactly this command.

## Verified JVM-level compatibility (javap vs room-migration bytecode)

| Room bytecode reference | This jar |
| --- | --- |
| `internal/PluginGeneratedSerialDescriptor."<init>":(Ljava/lang/String;Lkotlinx/serialization/internal/GeneratedSerializer;I)V` | ✅ identical |
| `PluginGeneratedSerialDescriptor.addElement:(Ljava/lang/String;Z)V` | ✅ identical |
| `internal/ArrayListSerializer."<init>":(Lkotlinx/serialization/KSerializer;)V` | ✅ identical |
| `internal/StringSerializer.INSTANCE:Lkotlinx/serialization/internal/StringSerializer;` | ✅ public static final |
| `SealedClassSerializer."<init>":(Ljava/lang/String;Lkotlin/reflect/KClass;[Lkotlin/reflect/KClass;[Lkotlinx/serialization/KSerializer;[Ljava/lang/annotation/Annotation;)V` | ✅ identical |

## Outcome

With this jar on the kapt processor classpath, the Room probe
(`tools/room-probe/run.sh`) processes a real `@Database` end to end:
`Annotation processing complete, errors: 0`, generating `ItemDao_Impl.java`
and `ProbeDatabase_Impl.java`, which compile and whose SQL was executed
against real SQLite (see `tools/room-probe/SqlSanityCheck.kt`).
