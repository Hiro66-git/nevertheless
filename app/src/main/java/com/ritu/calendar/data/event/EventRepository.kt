package com.ritu.calendar.data.event

import com.ritu.calendar.data.local.dao.PersonalEventDao
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.time.LocalDate

class EventRepository(
    private val eventDao: PersonalEventDao
) {

    fun getAllEvents(): Flow<List<PersonalEvent>> {
        return eventDao.getAllEvents().map { list ->
            list.map { PersonalEvent.fromEntity(it) }
        }
    }

    fun getEventsForDate(date: LocalDate): Flow<List<PersonalEvent>> {
        return eventDao.getAllEvents().map { allEvents ->
            allEvents.map { PersonalEvent.fromEntity(it) }.filter { event ->
                isEventOccurringOnDate(event, date)
            }
        }
    }

    fun getEventsBetweenDates(startDate: LocalDate, endDate: LocalDate): Flow<List<PersonalEvent>> {
        return eventDao.getAllEvents().map { allEvents ->
            val mapped = allEvents.map { PersonalEvent.fromEntity(it) }
            val result = mutableListOf<PersonalEvent>()
            var cur = startDate
            while (!cur.isAfter(endDate)) {
                for (event in mapped) {
                    if (isEventOccurringOnDate(event, cur)) {
                        result.add(event.copy(date = cur))
                    }
                }
                cur = cur.plusDays(1)
            }
            result
        }
    }

    suspend fun getEventById(id: Long): PersonalEvent? {
        val entity = eventDao.getEventById(id)
        return entity?.let { PersonalEvent.fromEntity(it) }
    }

    fun searchEvents(query: String): Flow<List<PersonalEvent>> {
        return eventDao.searchEvents(query).map { list ->
            list.map { PersonalEvent.fromEntity(it) }
        }
    }

    suspend fun saveEvent(event: PersonalEvent): Long {
        return eventDao.insertEvent(event.toEntity())
    }

    suspend fun updateEvent(event: PersonalEvent) {
        eventDao.updateEvent(event.toEntity())
    }

    suspend fun deleteEvent(event: PersonalEvent) {
        eventDao.deleteEvent(event.toEntity())
    }

    suspend fun deleteEventById(id: Long) {
        eventDao.deleteEventById(id)
    }

    /**
     * Helper to compute recurrence occurrences for any target date.
     */
    private fun isEventOccurringOnDate(event: PersonalEvent, targetDate: LocalDate): Boolean {
        if (targetDate.isBefore(event.date)) return false
        return when (event.recurrence) {
            RecurrenceType.NONE -> event.date == targetDate
            RecurrenceType.DAILY -> true
            RecurrenceType.WEEKLY -> event.date.dayOfWeek == targetDate.dayOfWeek
            RecurrenceType.MONTHLY -> event.date.dayOfMonth == targetDate.dayOfMonth
            RecurrenceType.YEARLY -> event.date.month == targetDate.month && event.date.dayOfMonth == targetDate.dayOfMonth
            RecurrenceType.LUNAR_ANNUAL -> {
                // Approximate annual recurrence or exact match
                event.date.month == targetDate.month && event.date.dayOfMonth == targetDate.dayOfMonth
            }
        }
    }
}
