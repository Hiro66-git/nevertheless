package com.ritu.calendar.event

import com.ritu.calendar.data.event.EventCategory
import com.ritu.calendar.data.event.PersonalEvent
import com.ritu.calendar.data.event.RecurrenceType
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate
import java.time.LocalTime

class EventRepositoryTest {

    @Test
    fun testEventEntityConversion() {
        val event = PersonalEvent(
            id = 101L,
            title = "Satyanarayana Puja",
            description = "Evening family puja",
            date = LocalDate.of(2026, 11, 24),
            time = LocalTime.of(18, 30),
            isAllDay = false,
            category = EventCategory.PUJA_VRAT,
            recurrence = RecurrenceType.MONTHLY,
            hasReminder = true,
            reminderMinutesBefore = 60,
            location = "Home Altar"
        )

        val entity = event.toEntity()
        assertEquals(event.id, entity.id)
        assertEquals(event.title, entity.title)
        assertEquals(event.category.name, entity.categoryName)
        assertEquals(event.recurrence.name, entity.recurrenceType)

        val reconstructed = PersonalEvent.fromEntity(entity)
        assertEquals(event.id, reconstructed.id)
        assertEquals(event.title, reconstructed.title)
        assertEquals(event.category, reconstructed.category)
        assertEquals(event.recurrence, reconstructed.recurrence)
        assertEquals(event.hasReminder, reconstructed.hasReminder)
    }
}
