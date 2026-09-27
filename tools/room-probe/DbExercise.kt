/*
 * Smallest real-DB usage exercise (compile-verification target).
 *
 * This exercises the COMPLETE Room usage path against the generated
 * ProbeDatabase_Impl / ItemDao_Impl:
 *   Room.databaseBuilder -> .build() -> itemDao() -> suspend insert -> Flow query.
 *
 * It is COMPILED with the same toolchain (kotlinc 2.0.21, android.jar API 36,
 * room-runtime-android 2.7.0-beta01) but NOT executed on this host:
 * room-runtime is the Android artifact and databaseBuilder requires a real
 * android.content.Context; only an emulator/device can run it. The SQL itself
 * IS executed against real SQLite by SqlSanityCheck.kt (sqlite-jdbc).
 */
import android.content.Context
import androidx.room.Room
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking

fun exerciseProbeDatabase(context: Context) {
    val db = Room.databaseBuilder(context, ProbeDatabase::class.java, "probe.db")
        .build()
    try {
        val dao = db.itemDao()
        runBlocking {
            // insert path -> ItemDao_Impl.insert -> EntityInsertAdapter.insertAndReturnId
            val id1 = dao.insert(ItemEntity(name = "first", updatedAt = 100L))
            val id2 = dao.insert(ItemEntity(name = "second", updatedAt = 200L))
            check(id1 != id2) { "autoGenerate must assign distinct ids" }
            // query path -> ItemDao_Impl.recent -> FlowUtil.createFlow(...)
            val items = dao.recent().first()
            check(items.size == 2) { "expected 2 items, got ${items.size}" }
            check(items.first().name == "second") { "expected newest-first ordering" }
        }
    } finally {
        db.close()
    }
}
