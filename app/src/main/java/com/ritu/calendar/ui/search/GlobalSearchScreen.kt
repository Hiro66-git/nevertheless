package com.ritu.calendar.ui.search

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.designsystem.components.EmptyStateView
import com.ritu.calendar.core.designsystem.components.FilterChipRow
import com.ritu.calendar.core.designsystem.components.RituBadge
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.core.utils.DateTimeExtensions.formatDisplayMedium
import com.ritu.calendar.ui.festival.components.FestivalCard

@Composable
fun GlobalSearchScreen(
    viewModel: GlobalSearchViewModel,
    onNavigateToFestival: (String) -> Unit,
    onNavigateToEvent: (Long) -> Unit,
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            RituTopAppBar(
                title = "Global Search",
                devanagariTitle = "खोज",
                canNavigateBack = true,
                onNavigateBack = onNavigateBack
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Search Input Field
            OutlinedTextField(
                value = uiState.query,
                onValueChange = { viewModel.updateQuery(it) },
                placeholder = { Text("Search festivals, dates, holidays, events...") },
                leadingIcon = {
                    Icon(imageVector = Icons.Default.Search, contentDescription = null)
                },
                trailingIcon = {
                    if (uiState.query.isNotEmpty()) {
                        IconButton(onClick = { viewModel.updateQuery("") }) {
                            Icon(imageVector = Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                shape = RoundedCornerShape(16.dp),
                singleLine = true
            )

            // Category Filter Chips
            FilterChipRow(
                items = SearchCategoryFilter.entries,
                selectedItem = uiState.activeFilter,
                onItemSelected = { viewModel.setFilter(it) },
                labelProvider = {
                    when (it) {
                        SearchCategoryFilter.ALL -> "All Results"
                        SearchCategoryFilter.FESTIVALS -> "🌸 Festivals"
                        SearchCategoryFilter.EVENTS -> "📌 Events"
                        SearchCategoryFilter.HOLIDAYS -> "🏛️ Holidays"
                    }
                }
            )

            if (uiState.query.isBlank()) {
                EmptyStateView(
                    title = "Discover Culture & Time",
                    message = "Search across 120+ Indian festivals, personal events, and regional celebrations.",
                    modifier = Modifier.weight(1f)
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Festivals Results
                    if (uiState.activeFilter == SearchCategoryFilter.ALL ||
                        uiState.activeFilter == SearchCategoryFilter.FESTIVALS ||
                        uiState.activeFilter == SearchCategoryFilter.HOLIDAYS
                    ) {
                        val fests = if (uiState.activeFilter == SearchCategoryFilter.HOLIDAYS) {
                            uiState.festivalResults.filter { it.isNationalHoliday }
                        } else {
                            uiState.festivalResults
                        }

                        if (fests.isNotEmpty()) {
                            item {
                                Text(
                                    text = "Festivals (${fests.size})",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                            items(fests) { fest ->
                                FestivalCard(festival = fest, onClick = { onNavigateToFestival(fest.id) })
                            }
                        }
                    }

                    // Personal Events Results
                    if (uiState.activeFilter == SearchCategoryFilter.ALL || uiState.activeFilter == SearchCategoryFilter.EVENTS) {
                        if (uiState.eventResults.isNotEmpty()) {
                            item {
                                Text(
                                    text = "Personal Events (${uiState.eventResults.size})",
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                            items(uiState.eventResults) { ev ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(14.dp))
                                        .clickable { onNavigateToEvent(ev.id) },
                                    shape = RoundedCornerShape(14.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(14.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Row(
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .size(12.dp)
                                                    .clip(CircleShape)
                                                    .background(ev.color)
                                            )
                                            Column {
                                                Text(text = ev.title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold)
                                                Text(text = ev.date.formatDisplayMedium(), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                            }
                                        }
                                        RituBadge(text = ev.category.displayName, color = ev.color)
                                    }
                                }
                            }
                        }
                    }

                    if (uiState.festivalResults.isEmpty() && uiState.eventResults.isEmpty()) {
                        item {
                            EmptyStateView(
                                title = "No Results Found",
                                message = "No matching festivals or events found for '${uiState.query}'."
                            )
                        }
                    }
                }
            }
        }
    }
}
