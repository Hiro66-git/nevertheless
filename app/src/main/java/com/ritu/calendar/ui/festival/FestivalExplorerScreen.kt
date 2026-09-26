package com.ritu.calendar.ui.festival

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
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
import com.ritu.calendar.data.festival.FestivalCategory
import com.ritu.calendar.data.festival.IndianRegion
import com.ritu.calendar.data.festival.ReligiousTradition
import com.ritu.calendar.ui.festival.components.FestivalCard
import com.ritu.calendar.ui.festival.components.NortheastAssamSpotlight

@Composable
fun FestivalExplorerScreen(
    viewModel: FestivalExplorerViewModel,
    onNavigateToDetail: (String) -> Unit,
    onNavigateToSearch: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    SeasonalBackground(season = uiState.selectedSeason ?: RituSeason.VASANTA) {
        Scaffold(
            topBar = {
                RituTopAppBar(
                    title = "Festival Explorer",
                    subtitle = "${uiState.festivals.size} Indian Celebrations",
                    devanagariTitle = "उत्सव",
                    onSearchClick = onNavigateToSearch,
                    onSettingsClick = onNavigateToSettings
                )
            },
            containerColor = androidx.compose.ui.graphics.Color.Transparent
        ) { paddingValues ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // 1. Regional Filter Chips
                item {
                    FilterChipRow(
                        items = IndianRegion.entries,
                        selectedItem = uiState.selectedRegion,
                        onItemSelected = { viewModel.setRegion(it) },
                        labelProvider = { it.displayName }
                    )
                }

                // 2. Tradition Filter Chips
                item {
                    FilterChipRow(
                        items = ReligiousTradition.entries,
                        selectedItem = uiState.selectedTradition,
                        onItemSelected = { viewModel.setTradition(it) },
                        labelProvider = { it.displayName }
                    )
                }

                // 3. Northeast & Assam Spotlight (if All India or Northeast selected)
                if (uiState.selectedRegion == IndianRegion.ALL_INDIA || uiState.selectedRegion == IndianRegion.NORTHEAST_ASSAM) {
                    item {
                        NortheastAssamSpotlight(
                            festivals = uiState.northeastFestivals,
                            onFestivalClick = onNavigateToDetail
                        )
                    }
                }

                // 4. Festivals List Header
                item {
                    Text(
                        text = "All Celebrations (${uiState.festivals.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                    )
                }

                // 5. Festival Cards
                items(uiState.festivals) { festival ->
                    Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                        FestivalCard(
                            festival = festival,
                            onClick = { onNavigateToDetail(festival.id) }
                        )
                    }
                }

                item {
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }
}
