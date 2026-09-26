package com.ritu.calendar.ui.today

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.core.designsystem.components.SeasonalBackground
import com.ritu.calendar.core.designsystem.components.SectionHeader
import com.ritu.calendar.ui.today.components.*

@Composable
fun TodayScreen(
    viewModel: TodayViewModel,
    onNavigateToDay: (String) -> Unit,
    onNavigateToFestival: (String) -> Unit,
    onNavigateToCreateEvent: (String?) -> Unit,
    onNavigateToEventDetail: (Long) -> Unit,
    onNavigateToSearch: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val panchang = uiState.panchang
    val ritu = panchang.ritu

    SeasonalBackground(season = ritu) {
        Scaffold(
            topBar = {
                RituTopAppBar(
                    title = "Living Today",
                    subtitle = "${uiState.userSettings.cityName} • ${panchang.regionalEras.sakaSamvat} Saka",
                    devanagariTitle = "ऋतु",
                    currentSeason = ritu,
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
                // 1. Living Hero Date Card
                LivingHeroCard(
                    panchang = panchang,
                    onCardClick = { onNavigateToDay(panchang.date.toString()) }
                )

                // 2. Seasonal Aura
                SeasonalAuraCard(season = ritu)

                // 3. Today's Festivals / Upcoming Spotlight
                if (uiState.todayFestivals.isNotEmpty()) {
                    SectionHeader(
                        title = "Today's Sacred Celebrations",
                        devanagariSubtitle = "आज के उत्सव"
                    )
                    MajorFestivalSpotlight(
                        festivals = uiState.todayFestivals,
                        currentDate = uiState.currentDate,
                        onFestivalClick = onNavigateToFestival
                    )
                } else if (uiState.upcomingFestivals.isNotEmpty()) {
                    SectionHeader(
                        title = "Upcoming Festivals",
                        devanagariSubtitle = "आगामी पर्व"
                    )
                    MajorFestivalSpotlight(
                        festivals = uiState.upcomingFestivals.take(2),
                        currentDate = uiState.currentDate,
                        onFestivalClick = onNavigateToFestival
                    )
                }

                // 4. Dainik Panchang 4 Pillars
                TodayPanchangCard(panchang = panchang)

                // 5. Sun & Moon Horizon
                SunMoonHorizonCard(panchang = panchang)

                // 6. Auspicious Muhurat Bar
                MuhuratBar(muhurats = panchang.muhurats)

                // 7. Personal Events Widget
                TodayEventsWidget(
                    events = uiState.todayEvents,
                    onAddEventClick = { onNavigateToCreateEvent(uiState.currentDate.toString()) },
                    onEventClick = onNavigateToEventDetail
                )

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
