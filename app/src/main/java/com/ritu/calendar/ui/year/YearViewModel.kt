package com.ritu.calendar.ui.year

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ritu.calendar.core.panchang.RituSeason
import com.ritu.calendar.data.festival.FestivalModel
import com.ritu.calendar.data.festival.FestivalRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate

data class MonthSummary(
    val monthValue: Int, // 1 to 12
    val monthName: String,
    val season: RituSeason,
    val festivalCount: Int,
    val majorFestivals: List<FestivalModel>,
    val daysCount: Int
)

data class YearUiState(
    val currentYear: Int = 2026,
    val months: List<MonthSummary> = emptyList(),
    val allYearFestivals: List<FestivalModel> = emptyList(),
    val selectedSeason: RituSeason? = null
)

class YearViewModel(
    private val festivalRepository: FestivalRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(YearUiState())
    val uiState: StateFlow<YearUiState> = _uiState.asStateFlow()

    init {
        loadYear(2026)
    }

    fun loadYear(year: Int) {
        val fests = festivalRepository.getFestivalsForYear(year)

        val monthsList = (1..12).map { m ->
            val monthFests = festivalRepository.getFestivalsForMonth(year, m)
            val season = RituSeason.fromGregorianMonth(m)
            val firstDay = LocalDate.of(year, m, 1)
            val monthName = firstDay.month.name

            MonthSummary(
                monthValue = m,
                monthName = monthName,
                season = season,
                festivalCount = monthFests.size,
                majorFestivals = monthFests.filter { it.isMajorFestival },
                daysCount = firstDay.lengthOfMonth()
            )
        }

        _uiState.update {
            it.copy(
                currentYear = year,
                months = monthsList,
                allYearFestivals = fests
            )
        }
    }

    fun nextYear() {
        loadYear(_uiState.value.currentYear + 1)
    }

    fun prevYear() {
        loadYear(_uiState.value.currentYear - 1)
    }

    fun selectSeason(season: RituSeason?) {
        _uiState.update { it.copy(selectedSeason = season) }
    }
}
