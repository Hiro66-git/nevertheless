package com.ritu.calendar.ui.month

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
import java.time.YearMonth

data class DayCalendarData(
    val date: LocalDate,
    val isCurrentMonth: Boolean,
    val isToday: Boolean,
    val panchang: DailyPanchang,
    val festivals: List<FestivalModel>,
    val events: List<PersonalEvent>,
    val hasHoliday: Boolean
)

data class MonthUiState(
    val currentYearMonth: YearMonth = YearMonth.now(),
    val selectedDate: LocalDate = LocalDate.now(),
    val daysInGrid: List<DayCalendarData> = emptyList(),
    val monthFestivals: List<FestivalModel> = emptyList(),
    val userSettings: UserSettings = UserSettings(),
    val selectedCategoryFilter: String = "ALL", // ALL, FESTIVALS, HOLIDAYS, EVENTS
    val isLoading: Boolean = false
)

class MonthViewModel(
    private val festivalRepository: FestivalRepository,
    private val eventRepository: EventRepository,
    private val userSettingsRepository: UserSettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(MonthUiState())
    val uiState: StateFlow<MonthUiState> = _uiState.asStateFlow()

    init {
        loadMonth(YearMonth.now())
    }

    fun loadMonth(yearMonth: YearMonth) {
        viewModelScope.launch {
            userSettingsRepository.getUserSettings().collectLatest { settings ->
                val firstOfMonth = yearMonth.atDay(1)
                val lastOfMonth = yearMonth.atEndOfMonth()
                val startDayOfWeek = firstOfMonth.dayOfWeek.value // Monday = 1, Sunday = 7
                val daysBefore = startDayOfWeek % 7 // Align to Sunday = 0 or Monday = 0 (Sunday first: startDayOfWeek % 7)

                val gridStartDate = firstOfMonth.minusDays(daysBefore.toLong())
                val totalDays = 42 // 6 weeks grid
                val gridEndDate = gridStartDate.plusDays((totalDays - 1).toLong())

                val monthFests = festivalRepository.getFestivalsForMonth(yearMonth.year, yearMonth.monthValue)

                eventRepository.getEventsBetweenDates(gridStartDate, gridEndDate).collectLatest { allEvents ->
                    val today = LocalDate.now()
                    val gridList = mutableListOf<DayCalendarData>()

                    for (i in 0 until totalDays) {
                        val date = gridStartDate.plusDays(i.toLong())
                        val panchang = PanchangCalculator.calculate(
                            date = date,
                            latitude = settings.latitude,
                            longitude = settings.longitude
                        )
                        val dateFests = festivalRepository.getFestivalsForDate(date)
                        val dateEvents = allEvents.filter { it.date == date }
                        val isHoliday = dateFests.any { it.isNationalHoliday }

                        gridList.add(
                            DayCalendarData(
                                date = date,
                                isCurrentMonth = date.month == yearMonth.month,
                                isToday = date == today,
                                panchang = panchang,
                                festivals = dateFests,
                                events = dateEvents,
                                hasHoliday = isHoliday
                            )
                        )
                    }

                    _uiState.update {
                        it.copy(
                            currentYearMonth = yearMonth,
                            daysInGrid = gridList,
                            monthFestivals = monthFests,
                            userSettings = settings,
                            isLoading = false
                        )
                    }
                }
            }
        }
    }

    fun selectDate(date: LocalDate) {
        _uiState.update { it.copy(selectedDate = date) }
        if (date.month != _uiState.value.currentYearMonth.month || date.year != _uiState.value.currentYearMonth.year) {
            loadMonth(YearMonth.from(date))
        }
    }

    fun nextMonth() {
        val next = _uiState.value.currentYearMonth.plusMonths(1)
        loadMonth(next)
    }

    fun previousMonth() {
        val prev = _uiState.value.currentYearMonth.minusMonths(1)
        loadMonth(prev)
    }

    fun setFilter(filter: String) {
        _uiState.update { it.copy(selectedCategoryFilter = filter) }
    }
}
