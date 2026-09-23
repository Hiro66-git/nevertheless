package com.ritu.calendar.data.settings

import com.ritu.calendar.core.designsystem.theme.ThemeMode
import com.ritu.calendar.data.festival.IndianRegion
import com.ritu.calendar.data.local.entity.UserPreferencesEntity

data class UserSettings(
    val selectedRegion: IndianRegion = IndianRegion.ALL_INDIA,
    val themeMode: ThemeMode = ThemeMode.LIGHT,
    val latitude: Double = 28.6139,
    val longitude: Double = 77.2090,
    val cityName: String = "New Delhi",
    val panchangSystem: String = "AMANTA",
    val enableNotifications: Boolean = true,
    val defaultReminderMinutes: Int = 30
) {
    fun toEntity(): UserPreferencesEntity {
        return UserPreferencesEntity(
            id = 1,
            selectedRegion = selectedRegion.name,
            themeMode = themeMode.name,
            latitude = latitude,
            longitude = longitude,
            cityName = cityName,
            panchangSystem = panchangSystem,
            enableNotifications = enableNotifications,
            defaultReminderMinutes = defaultReminderMinutes
        )
    }

    companion object {
        fun fromEntity(entity: UserPreferencesEntity?): UserSettings {
            if (entity == null) return UserSettings()
            return UserSettings(
                selectedRegion = IndianRegion.fromCode(entity.selectedRegion),
                themeMode = ThemeMode.fromName(entity.themeMode),
                latitude = entity.latitude,
                longitude = entity.longitude,
                cityName = entity.cityName,
                panchangSystem = entity.panchangSystem,
                enableNotifications = entity.enableNotifications,
                defaultReminderMinutes = entity.defaultReminderMinutes
            )
        }
    }
}
