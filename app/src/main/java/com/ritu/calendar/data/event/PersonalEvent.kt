package com.ritu.calendar.data.event

import androidx.compose.ui.graphics.Color
import com.ritu.calendar.data.local.entity.PersonalEventEntity
import java.time.LocalDate
import java.time.LocalTime

data class PersonalEvent(
    val id: Long = 0,
    val title: String,
    val description: String = "",
    val date: LocalDate,
    val time: LocalTime = LocalTime.of(9, 0),
    val isAllDay: Boolean = false,
    val category: EventCategory = EventCategory.PERSONAL,
    val color: Color = category.defaultColor,
    val recurrence: RecurrenceType = RecurrenceType.NONE,
    val hasReminder: Boolean = false,
    val reminderMinutesBefore: Int = 30,
    val location: String = "",
    val checklistJson: String = "[]",
    val isCompleted: Boolean = false
) {
    fun toEntity(): PersonalEventEntity {
        return PersonalEventEntity(
            id = id,
            title = title,
            description = description,
            date = date,
            time = time,
            isAllDay = isAllDay,
            categoryName = category.name,
            colorHex = color.value.toLong(),
            recurrenceType = recurrence.name,
            hasReminder = hasReminder,
            reminderMinutesBefore = reminderMinutesBefore,
            location = location,
            checklistJson = checklistJson,
            isCompleted = isCompleted
        )
    }

    companion object {
        fun fromEntity(entity: PersonalEventEntity): PersonalEvent {
            val category = EventCategory.fromName(entity.categoryName)
            val color = if (entity.colorHex != 0L) Color(entity.colorHex.toULong()) else category.defaultColor
            return PersonalEvent(
                id = entity.id,
                title = entity.title,
                description = entity.description,
                date = entity.date,
                time = entity.time,
                isAllDay = entity.isAllDay,
                category = category,
                color = color,
                recurrence = RecurrenceType.fromName(entity.recurrenceType),
                hasReminder = entity.hasReminder,
                reminderMinutesBefore = entity.reminderMinutesBefore,
                location = entity.location,
                checklistJson = entity.checklistJson,
                isCompleted = entity.isCompleted
            )
        }
    }
}
