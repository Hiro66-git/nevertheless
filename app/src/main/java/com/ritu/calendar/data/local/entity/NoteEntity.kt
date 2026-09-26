package com.ritu.calendar.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.LocalDate

@Entity(tableName = "daily_notes")
data class NoteEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val date: LocalDate,
    val content: String,
    val isPinned: Boolean = false,
    val updatedAt: Long = System.currentTimeMillis()
)
