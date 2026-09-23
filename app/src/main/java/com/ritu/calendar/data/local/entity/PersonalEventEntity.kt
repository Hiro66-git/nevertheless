package com.ritu.calendar.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate
import java.time.LocalTime

@Entity(tableName = "personal_events")
data class PersonalEventEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val description: String = "",
    val date: LocalDate,
    val time: LocalTime = LocalTime.of(9, 0),
    val isAllDay: Boolean = false,
    val categoryName: String = "PERSONAL",
    val colorHex: Long = 0xFF42A5F5,
    val recurrenceType: String = "NONE",
    val hasReminder: Boolean = false,
    val reminderMinutesBefore: Int = 30,
    val location: String = "",
    val checklistJson: String = "[]",
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
