package com.ritu.calendar.data.local.dao

import androidx.room.*
import com.ritu.calendar.data.local.entity.NoteEntity
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

@Dao
interface NoteDao {

    @Query("SELECT * FROM daily_notes WHERE date = :date ORDER BY updatedAt DESC")
    fun getNotesForDate(date: LocalDate): Flow<List<NoteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: NoteEntity): Long

    @Update
    suspend fun updateNote(note: NoteEntity)

    @Delete
    suspend fun deleteNote(note: NoteEntity)
}
