package com.ritu.calendar.data.settings

import com.ritu.calendar.data.local.dao.UserPreferencesDao
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class UserSettingsRepository(
    private val preferencesDao: UserPreferencesDao
) {

    fun getUserSettings(): Flow<UserSettings> {
        return preferencesDao.getUserPreferences().map { entity ->
            UserSettings.fromEntity(entity)
        }
    }

    suspend fun getUserSettingsSync(): UserSettings {
        val entity = preferencesDao.getUserPreferencesSync()
        return UserSettings.fromEntity(entity)
    }

    suspend fun saveSettings(settings: UserSettings) {
        preferencesDao.savePreferences(settings.toEntity())
    }
}
