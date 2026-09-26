package com.ritu.calendar.ui.today

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ritu.calendar.core.panchang.DailyPanchang
import com.ritu.calendar.core.panchang.PanchangCalculator
import com.ritu.calendar.data.event.EventRepository
import com.ritu.calendar.data.event.PersonalEvent
import com.ritu.calendar.data.festival.FestivalModel
import com.ritu.calendar.data.festival.FestivalRepository
import com.ritu.calendar.data.settings.UserSettings
import com.ritu.calendar.data.settings.UserSettingsRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate

data class TodayUiState(
    val currentDate: LocalDate = LocalDate.now(),
    val panchang: DailyPanchang = PanchangCalculator.calculate(LocalDate.now()),
    val todayFestivals: List<FestivalModel> = emptyList(),
    val upcomingFestivals: List<FestivalModel> = emptyList(),
    val todayEvents: List<PersonalEvent> = emptyList(),
    val userSettings: UserSettings = UserSettings(),
    val isLoading: Boolean = false
)

class TodayViewModel(
    private val festivalRepository: FestivalRepository,
    private val eventRepository: EventRepository,
    private val userSettingsRepository: UserSettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TodayUiState())
    val uiState: StateFlow<TodayUiState> = _uiState.asStateFlow()

    init {
        loadToday()
    }

    fun loadToday() {
        val today = LocalDate.now()
        viewModelScope.launch {
            userSettingsRepository.getUserSettings().collectLatest { settings ->
                val panchang = PanchangCalculator.calculate(
                    date = today,
                    latitude = settings.latitude,
                    longitude = settings.longitude
                )

                val todayFests = festivalRepository.getFestivalsForDate(today)
                val upcomingFests = festivalRepository.getUpcomingFestivals(today.plusDays(1), 5)

                eventRepository.getEventsForDate(today).collectLatest { events ->
                    _uiState.update {
                        it.copy(
                            currentDate = today,
                            panchang = panchang,
                            todayFestivals = todayFests,
                            upcomingFestivals = upcomingFests,
                            todayEvents = events,
                            userSettings = settings,
                            isLoading = false
                        )
                    }
                }
            }
        }
    }
}
