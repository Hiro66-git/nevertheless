package com.ritu.calendar.ui.month

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ritu.calendar.core.designsystem.components.FilterChipRow
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.core.designsystem.components.SeasonalBackground
import com.ritu.calendar.core.panchang.RituSeason
import com.ritu.calendar.ui.month.components.MonthCalendarGrid
import com.ritu.calendar.ui.month.components.MonthHeader
import com.ritu.calendar.ui.month.components.SelectedDayBottomSheet

@Composable
fun MonthScreen(
    viewModel: MonthViewModel,
    onNavigateToDay: (String) -> Unit,
    onNavigateToFestival: (String) -> Unit,
    onNavigateToCreateEvent: (String?) -> Unit,
    onNavigateToEventDetail: (Long) -> Unit,
    onNavigateToSearch: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val season = RituSeason.fromGregorianMonth(uiState.currentYearMonth.monthValue)

    val selectedDayData = uiState.daysInGrid.firstOrNull { it.date == uiState.selectedDate }
    val panchang = selectedDayData?.panchang ?: com.ritu.calendar.core.panchang.PanchangCalculator.calculate(uiState.selectedDate)

    val filterOptions = listOf("ALL", "FESTIVALS", "HOLIDAYS", "EVENTS")

    val filteredDays = when (uiState.selectedCategoryFilter) {
        "FESTIVALS" -> uiState.daysInGrid.map { it.copy(events = emptyList()) }
        "HOLIDAYS" -> uiState.daysInGrid.map { if (it.hasHoliday) it else it.copy(festivals = emptyList(), events = emptyList()) }
        "EVENTS" -> uiState.daysInGrid.map { it.copy(festivals = emptyList()) }
        else -> uiState.daysInGrid
    }

    SeasonalBackground(season = season) {
        Scaffold(
            topBar = {
                RituTopAppBar(
                    title = "Monthly Calendar",
                    subtitle = "${uiState.currentYearMonth.month.name} ${uiState.currentYearMonth.year}",
                    devanagariTitle = "मास",
                    currentSeason = season,
                    onSearchClick = onNavigateToSearch,
                    onSettingsClick = onNavigateToSettings
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { onNavigateToCreateEvent(uiState.selectedDate.toString()) },
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = androidx.compose.ui.graphics.Color.White
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Add Event")
                }
            },
            containerColor = androidx.compose.ui.graphics.Color.Transparent
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
            ) {
                // Month Header with Prev/Next Navigation
                MonthHeader(
                    currentYearMonth = uiState.currentYearMonth,
                    season = season,
                    onPrevMonth = { viewModel.previousMonth() },
                    onNextMonth = { viewModel.nextMonth() }
                )

                // Category Filter Chips
                FilterChipRow(
                    items = filterOptions,
                    selectedItem = uiState.selectedCategoryFilter,
                    onItemSelected = { viewModel.setFilter(it) },
                    labelProvider = {
                        when (it) {
                            "ALL" -> "All Days"
                            "FESTIVALS" -> "🌸 Festivals"
                            "HOLIDAYS" -> "🏛️ Holidays"
                            "EVENTS" -> "📌 Personal"
                            else -> it
                        }
                    },
                    activeColor = season.primaryColor
                )

                Spacer(modifier = Modifier.height(4.dp))

                // Calendar Grid
                MonthCalendarGrid(
                    days = filteredDays,
                    selectedDate = uiState.selectedDate,
                    onDateClick = { date -> viewModel.selectDate(date) },
                    onDateLongClick = { date -> onNavigateToCreateEvent(date.toString()) },
                    modifier = Modifier.padding(horizontal = 12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Bottom Selected Day Summary Card
                SelectedDayBottomSheet(
                    panchang = panchang,
                    festivals = selectedDayData?.festivals ?: emptyList(),
                    events = selectedDayData?.events ?: emptyList(),
                    onViewDayClick = { onNavigateToDay(uiState.selectedDate.toString()) },
                    onAddEventClick = { onNavigateToCreateEvent(uiState.selectedDate.toString()) },
                    onFestivalClick = onNavigateToFestival,
                    onEventClick = onNavigateToEventDetail,
                    modifier = Modifier.padding(horizontal = 12.dp)
                )

                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}
