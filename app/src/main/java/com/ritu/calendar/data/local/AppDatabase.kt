package com.ritu.calendar.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.ritu.calendar.data.local.converter.Converters
import com.ritu.calendar.data.local.dao.NoteDao
import com.ritu.calendar.data.local.dao.PersonalEventDao
import com.ritu.calendar.data.local.dao.UserPreferencesDao
import com.ritu.calendar.data.local.entity.NoteEntity
import com.ritu.calendar.data.local.entity.PersonalEventEntity
import com.ritu.calendar.data.local.entity.UserPreferencesEntity

@Database(
    entities = [
        PersonalEventEntity::class,
        NoteEntity::class,
        UserPreferencesEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {

    abstract fun personalEventDao(): PersonalEventDao
    abstract fun noteDao(): NoteDao
    abstract fun userPreferencesDao(): UserPreferencesDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "ritu_calendar_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
