import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "items")
data class ItemEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val updatedAt: Long
)

@Dao
interface ItemDao {
    @Query("SELECT * FROM items ORDER BY updatedAt DESC")
    fun recent(): Flow<List<ItemEntity>>

    @Insert
    suspend fun insert(item: ItemEntity): Long
}

@Database(entities = [ItemEntity::class], version = 1, exportSchema = false)
abstract class ProbeDatabase : RoomDatabase() {
    abstract fun itemDao(): ItemDao
}
