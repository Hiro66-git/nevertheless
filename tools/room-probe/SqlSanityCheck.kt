/*
 * Runnable SQL sanity check for the Room-generated code (pure JVM, sqlite-jdbc).
 *
 * What this DOES prove: the exact SQL strings emitted by RoomProcessor into
 * ProbeDatabase_Impl.java / ItemDao_Impl.java create a working schema and
 * round-trip an ItemEntity row (including autoGenerate id, NOT NULL
 * constraints, and the DESC ordering of the generated query).
 *
 * What this does NOT prove: the Room runtime plumbing (RoomDatabase,
 * InvalidationTracker, Flow machinery) — that requires the Android artifact
 * and a device/emulator; it is compile-verified by DbExercise.kt instead.
 *
 * Exit code 0 = all assertions passed.
 */
import java.sql.DriverManager

fun main() {
    val createSql =
        "CREATE TABLE IF NOT EXISTS `items` (`id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, " +
            "`name` TEXT NOT NULL, `updatedAt` INTEGER NOT NULL)"
    val insertSql =
        "INSERT OR ABORT INTO `items` (`id`,`name`,`updatedAt`) VALUES (nullif(?, 0),?,?)"
    val selectSql = "SELECT * FROM items ORDER BY updatedAt DESC"

    DriverManager.getConnection("jdbc:sqlite:/tmp/aegis-probe.db").use { conn ->
        conn.autoCommit = false
        conn.createStatement().use { stmt ->
            stmt.execute("DROP TABLE IF EXISTS `items`")
            // 1. Schema creation SQL from ProbeDatabase_Impl.createAllTables
            stmt.execute(createSql)
        }

        // 2. Insertion SQL from ItemDao_Impl EntityInsertAdapter.createQuery(),
        //    bound exactly like bind(): bindLong(1, id=0), bindText(2, name), bindLong(3, updatedAt)
        fun insertRow(id: Long, name: String, updatedAt: Long): Long {
            conn.prepareStatement(insertSql).use { ps ->
                ps.setLong(1, id)
                ps.setString(2, name)
                ps.setLong(3, updatedAt)
                check(ps.executeUpdate() == 1) { "expected exactly 1 inserted row" }
            }
            conn.createStatement().use { st ->
                st.executeQuery("SELECT last_insert_rowid()").use { rs ->
                    check(rs.next())
                    return rs.getLong(1)
                }
            }
        }

        val id1 = insertRow(0L, "first", 100L)   // id=0 -> nullif(?,0) -> AUTOINCREMENT
        val id2 = insertRow(0L, "second", 200L)
        check(id1 != id2) { "AUTOINCREMENT must assign distinct ids (got $id1 twice)" }
        check(id1 >= 1) { "auto id must start at 1, got $id1" }

        // 3. Query SQL from ItemDao_Impl.recent(): newest-first ordering
        conn.createStatement().use { st ->
            st.executeQuery(selectSql).use { rs ->
                val names = mutableListOf<String>()
                val ids = mutableListOf<Long>()
                while (rs.next()) {
                    ids += rs.getLong("id")
                    names += rs.getString("name")
                }
                check(names == listOf("second", "first")) { "expected [second, first], got $names" }
                check(ids == listOf(id2, id1)) { "ids must match assigned autoincrement ids" }
            }
        }

        // 4. Schema constraints from the generated DDL: NOT NULL on name
        var threw = false
        try {
            conn.prepareStatement(insertSql).use { ps ->
                ps.setLong(1, 0L)
                ps.setNull(2, java.sql.Types.VARCHAR)
                ps.setLong(3, 300L)
                ps.executeUpdate()
            }
        } catch (e: org.sqlite.SQLiteException) {
            threw = true
        }
        check(threw) { "INSERT of NULL name must violate NOT NULL constraint" }

        conn.commit()
    }
    println("SQL SANITY CHECK PASSED: create/insert/select/constraints all verified against sqlite-jdbc")
}
