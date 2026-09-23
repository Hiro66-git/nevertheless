package com.ritu.calendar.data.local.dao

import androidx.room.*
import com.ritu.calendar.data.local.entity.PersonalEventEntity
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate

@Dao
interface PersonalEventDao {

    @Query("SELECT * FROM personal_events ORDER BY date ASC, time ASC")
    fun getAllEvents(): Flow<List<PersonalEventEntity>>

    @Query("SELECT * FROM personal_events WHERE date = :date ORDER BY time ASC")
    fun getEventsForDate(date: LocalDate): Flow<List<PersonalEventEntity>>

    @Query("SELECT * FROM personal_events WHERE date BETWEEN :startDate AND :endDate ORDER BY date ASC, time ASC")
    fun getEventsBetweenDates(startDate: LocalDate, endDate: LocalDate): Flow<List<PersonalEventEntity>>

    @Query("SELECT * FROM personal_events WHERE id = :id")
    suspend fun getEventById(id: Long): PersonalEventEntity?

    @Query("SELECT * FROM personal_events WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%'")
    fun searchEvents(query: String): Flow<List<PersonalEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: PersonalEventEntity): Long

    @Update
    suspend fun updateEvent(event: PersonalEventEntity)

    @Delete
    suspend fun deleteEvent(event: PersonalEventEntity)

    @Query("DELETE FROM personal_events WHERE id = :id")
    suspend fun deleteEventById(id: Long)
}
