#!/bin/bash
# Room + kapt probe. KEY FINDING: -Kapt-classpath must be passed REPEATEDLY
# (one option per jar). A single colon-joined string becomes ONE invalid URL
# in the processor URLClassLoader -> "Can't find annotation processor class".
set -u
export PATH=/opt/aegis-tc/jdk17/linux-x86/bin:$PATH
cd /opt/aegis-tc/probe/room

M2A=/opt/aegis-tc/sdk/current/androidx/m2repository/androidx
M2T=/opt/aegis-tc/tools/common/m2/repository
KLIB=/opt/aegis-tc/kotlinc/lib
RUN_CP="$KLIB/kotlin-compiler.jar:$KLIB/kotlin-annotation-processing.jar:$KLIB/kotlin-annotation-processing-runtime.jar:$KLIB/kotlin-stdlib.jar:$KLIB/kotlin-reflect.jar:$KLIB/kotlin-script-runtime.jar:$KLIB/kotlin-daemon-client.jar"

RV=2.7.0-beta01
AP_JARS=(
  "$M2A/room/room-compiler/$RV/room-compiler-$RV.jar"
  "$M2A/room/room-common-jvm/$RV/room-common-jvm-$RV.jar"
  "$M2A/room/room-compiler-processing/$RV/room-compiler-processing-$RV.jar"
  "$M2A/room/room-external-antlr/$RV/room-external-antlr-$RV.jar"
  "$M2A/room/room-migration-jvm/$RV/room-migration-jvm-$RV.jar"
  "$KLIB/kotlin-stdlib.jar"
  "$KLIB/kotlin-reflect.jar"
  "$M2T/com/google/guava/guava/32.1.1-jre/guava-32.1.1-jre.jar"
  "$M2T/com/squareup/kotlinpoet/1.8.0/kotlinpoet-1.8.0.jar"
  "$M2T/com/google/auto/auto-common/1.1.2/auto-common-1.1.2.jar"
  "$M2T/com/google/auto/value/auto-value/1.9/auto-value-1.9.jar"
  "/opt/aegis-tc/libs/javapoet-1.13.jar"
  "/opt/aegis-tc/kotlinc/lib/jvm-abi-gen.jar"
  "/opt/aegis-tc/libs/auto-value-annotations.jar"
  "/opt/aegis-tc/tools/common/m2/repository/org/xerial/sqlite-jdbc/3.28.0/sqlite-jdbc-3.28.0.jar"
  "/opt/aegis-tc/tools/common/m2/repository/commons-codec/commons-codec/1.10/commons-codec-1.10.jar"
  # Minimal kotlinx.serialization 1.7.1 API layer, self-built (kxser-src):
  # provides the classes room-migration-jvm links against (PGSD, ArrayListSerializer,
  # StringSerializer, SealedClassSerializer, KSerializer, SerialDescriptor, ...).
  # Replaces the old kotlin-imports-dumper jar, whose ~1.0-era layout shadowed
  # these FQCNs with incompatible signatures.
  "/opt/aegis-tc/libs/kotlinx-serialization-core-min.jar"
)

rm -rf gen stubs classes
mkdir -p gen stubs classes

# Compile classpath: android.jar + room annotations/runtime + kotlin + coroutines
CCP="/opt/aegis-tc/sdk/current/public/android.jar"
CCP+=":$M2A/room/room-common-jvm/$RV/room-common-jvm-$RV.jar"
CCP+=":$(pwd)/unpack/room-runtime"
CCP+=":$(pwd)/unpack/sqlite"
CCP+=":$(pwd)/unpack/room-ktx"
CCP+=":$M2A/../annotation/annotation-jvm/1.9.0-rc01/annotation-jvm-1.9.0-rc01.jar"
CCP+=":$KLIB/kotlin-stdlib.jar"
CCP+=":$KLIB/kotlinx-coroutines-core-jvm.jar"

ARGS=(
  -Kapt-mode=stubsAndApt
  -Kapt-sources=gen
  -Kapt-stubs=stubs
  -Kapt-verbose=true
  -Kapt-processors=androidx.room.RoomProcessor
)
for j in "${AP_JARS[@]}"; do
  ARGS+=("-Kapt-classpath=$j")
done
ARGS+=(-cp "$CCP" -d classes DbProbe.kt)

java -cp "$RUN_CP" org.jetbrains.kotlin.kapt.cli.KaptCli "${ARGS[@]}"
echo "KAPT_EXIT=$?"
echo "--- generated files:"
find gen -type f | sort
