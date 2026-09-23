package com.ritu.calendar.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ritu.calendar.core.designsystem.theme.ThemeMode
import com.ritu.calendar.data.festival.IndianRegion
import com.ritu.calendar.data.settings.UserSettings
import com.ritu.calendar.data.settings.UserSettingsRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class SettingsUiState(
    val userSettings: UserSettings = UserSettings(),
    val isRegionDialogOpen: Boolean = false,
    val isLocationDialogOpen: Boolean = false
)

class SettingsViewModel(
    private val settingsRepository: UserSettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            settingsRepository.getUserSettings().collectLatest { settings ->
                _uiState.update { it.copy(userSettings = settings) }
            }
        }
    }

    fun updateTheme(themeMode: ThemeMode) {
        val updated = _uiState.value.userSettings.copy(themeMode = themeMode)
        save(updated)
    }

    fun updateRegion(region: IndianRegion) {
        val updated = _uiState.value.userSettings.copy(selectedRegion = region)
        save(updated)
    }

    fun updateLocation(city: String, lat: Double, lon: Double) {
        val updated = _uiState.value.userSettings.copy(
            cityName = city,
            latitude = lat,
            longitude = lon
        )
        save(updated)
    }

    fun toggleNotifications(enable: Boolean) {
        val updated = _uiState.value.userSettings.copy(enableNotifications = enable)
        save(updated)
    }

    fun setRegionDialogOpen(open: Boolean) {
        _uiState.update { it.copy(isRegionDialogOpen = open) }
    }

    fun setLocationDialogOpen(open: Boolean) {
        _uiState.update { it.copy(isLocationDialogOpen = open) }
    }

    private fun save(settings: UserSettings) {
        viewModelScope.launch {
            settingsRepository.saveSettings(settings)
        }
    }
}
