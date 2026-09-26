package com.ritu.calendar.ui.day

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.core.designsystem.components.SeasonalBackground
import com.ritu.calendar.core.utils.DateTimeExtensions.formatDisplayMedium
import com.ritu.calendar.ui.day.components.*
import java.time.LocalDate

@Composable
fun DayScreen(
    dateString: String,
    viewModel: DayViewModel,
    onNavigateBack: () -> Unit,
    onNavigateToFestival: (String) -> Unit,
    onNavigateToCreateEvent: (String?) -> Unit,
    onNavigateToEventDetail: (Long) -> Unit
) {
    LaunchedEffect(dateString) {
        val date = try {
            LocalDate.parse(dateString)
        } catch (e: Exception) {
            LocalDate.now()
        }
        viewModel.loadDate(date)
    }

    val uiState by viewModel.uiState.collectAsState()
    val panchang = uiState.panchang
    val ritu = panchang.ritu

    SeasonalBackground(season = ritu) {
        Scaffold(
            topBar = {
                RituTopAppBar(
                    title = uiState.date.formatDisplayMedium(),
                    subtitle = "${ritu.devanagari} Ritu • ${panchang.lunarMonth.sanskrit}",
                    canNavigateBack = true,
                    onNavigateBack = onNavigateBack,
                    currentSeason = ritu
                )
            },
            floatingActionButton = {
                FloatingActionButton(
                    onClick = { onNavigateToCreateEvent(uiState.date.toString()) },
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
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // 1. Day Hero Header
                DayHeroHeader(panchang = panchang)

                // 2. Festivals on this day
                DayFestivalCard(
                    festivals = uiState.festivals,
                    onFestivalClick = onNavigateToFestival
                )

                // 3. Panchang & Muhurat Details
                DayPanchangDetails(panchang = panchang)

                // 4. Events Timeline
                DayEventTimeline(
                    events = uiState.events,
                    onAddEventClick = { onNavigateToCreateEvent(uiState.date.toString()) },
                    onEventClick = onNavigateToEventDetail
                )

                // 5. Notes & Reminders
                DayNotesSection(
                    notes = uiState.notes,
                    onAddNote = { viewModel.addNote(it) },
                    onDeleteNote = { viewModel.deleteNote(it) }
                )

                Spacer(modifier = Modifier.height(72.dp))
            }
        }
    }
}
