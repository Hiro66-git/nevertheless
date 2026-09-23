package com.ritu.calendar.ui.year

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.core.designsystem.components.SeasonalBackground
import com.ritu.calendar.core.panchang.RituSeason
import com.ritu.calendar.ui.year.components.MiniMonthCard
import com.ritu.calendar.ui.year.components.SeasonalProgressionBand
import com.ritu.calendar.ui.year.components.YearFestivalsHighlights

@Composable
fun YearScreen(
    viewModel: YearViewModel,
    onNavigateToMonth: (Int, Int) -> Unit,
    onNavigateToFestival: (String) -> Unit,
    onNavigateToSearch: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    val filteredMonths = if (uiState.selectedSeason == null) {
        uiState.months
    } else {
        uiState.months.filter { it.season == uiState.selectedSeason }
    }

    SeasonalBackground(season = uiState.selectedSeason ?: RituSeason.VASANTA) {
        Scaffold(
            topBar = {
                RituTopAppBar(
                    title = "Annual Tapestry",
                    subtitle = "Year ${uiState.currentYear}",
                    devanagariTitle = "वर्ष",
                    onSearchClick = onNavigateToSearch,
                    onSettingsClick = onNavigateToSettings
                )
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
                // Year Switcher Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { viewModel.prevYear() }) {
                        Icon(imageVector = Icons.Default.ChevronLeft, contentDescription = "Previous Year")
                    }
                    Text(
                        text = "Samvat ${uiState.currentYear + 57} • Year ${uiState.currentYear}",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = { viewModel.nextYear() }) {
                        Icon(imageVector = Icons.Default.ChevronRight, contentDescription = "Next Year")
                    }
                }

                // Seasonal Progression Band (6 Ritus)
                SeasonalProgressionBand(
                    selectedSeason = uiState.selectedSeason,
                    onSeasonSelect = { viewModel.selectSeason(it) }
                )

                // 12 Months 3x4 or 2x6 Grid
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    val chunked = filteredMonths.chunked(3)
                    chunked.forEach { rowMonths ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            rowMonths.forEach { monthSummary ->
                                MiniMonthCard(
                                    monthSummary = monthSummary,
                                    onClick = { onNavigateToMonth(uiState.currentYear, monthSummary.monthValue) },
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            // Fill blank space if row is incomplete
                            for (i in rowMonths.size until 3) {
                                Spacer(modifier = Modifier.weight(1f))
                            }
                        }
                    }
                }

                // Major Annual Highlights
                YearFestivalsHighlights(
                    festivals = uiState.allYearFestivals,
                    onFestivalClick = onNavigateToFestival
                )

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
