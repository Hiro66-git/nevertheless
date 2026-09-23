package com.ritu.calendar.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "user_preferences")
data class UserPreferencesEntity(
    @PrimaryKey
    val id: Int = 1,
    val selectedRegion: String = "ALL_INDIA",
    val themeMode: String = "LIGHT",
    val latitude: Double = 28.6139,
    val longitude: Double = 77.2090,
    val cityName: String = "New Delhi",
    val panchangSystem: String = "AMANTA",
    val enableNotifications: Boolean = true,
    val defaultReminderMinutes: Int = 30
)
