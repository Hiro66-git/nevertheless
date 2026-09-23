package com.ritu.calendar.ui.festival

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.designsystem.components.CountdownTimer
import com.ritu.calendar.core.designsystem.components.IndianMandalaCanvas
import com.ritu.calendar.core.designsystem.components.RituBadge
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.core.designsystem.components.SeasonalBackground
import com.ritu.calendar.core.utils.DateTimeExtensions.formatDisplayFull
import com.ritu.calendar.ui.festival.components.FestivalRitualsFoodsTab
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Composable
fun FestivalDetailScreen(
    festivalId: String,
    viewModel: FestivalExplorerViewModel,
    onNavigateBack: () -> Unit
) {
    val festival = viewModel.getFestival(festivalId)

    if (festival == null) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(text = "Festival not found")
        }
        return
    }

    val daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), festival.gregorianDate2026)

    SeasonalBackground(season = festival.season) {
        Scaffold(
            topBar = {
                RituTopAppBar(
                    title = festival.name,
                    subtitle = festival.lunarDateString,
                    canNavigateBack = true,
                    onNavigateBack = onNavigateBack,
                    currentSeason = festival.season
                )
            },
            containerColor = Color.Transparent
        ) { paddingValues ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Hero Banner
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp)
                    ) {
                        IndianMandalaCanvas(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .offset(x = 16.dp, y = (-8).dp),
                            size = 120.dp,
                            alpha = 0.15f,
                            primaryColor = festival.season.primaryColor
                        )

                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                RituBadge(
                                    text = festival.region.displayName,
                                    color = festival.season.primaryColor
                                )
                                CountdownTimer(daysRemaining = daysRemaining)
                            }

                            Spacer(modifier = Modifier.height(14.dp))

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Text(text = festival.visualMotif, fontSize = 40.sp)
                                Column {
                                    Text(
                                        text = festival.name,
                                        style = MaterialTheme.typography.headlineMedium,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = festival.devanagariName,
                                        style = MaterialTheme.typography.titleSmall,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(12.dp))

                            Text(
                                text = "Date: ${festival.gregorianDate2026.formatDisplayFull()}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "Panchang: ${festival.lunarDateString} • Duration: ${festival.durationDays} day(s)",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                // Significance & History Card
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(18.dp)
                    ) {
                        Text(
                            text = "Origins & Spiritual Significance",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = festival.culturalSignificance,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            lineHeight = 22.sp
                        )
                    }
                }

                // Regional Variations (if present)
                if (festival.regionalVariations.isNotEmpty()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(18.dp)
                        ) {
                            Text(
                                text = "Regional Variations & Customs",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(10.dp))
                            festival.regionalVariations.forEach { (reg, desc) ->
                                Column(modifier = Modifier.padding(vertical = 4.dp)) {
                                    Text(
                                        text = reg,
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = desc,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                // Rituals and Foods
                FestivalRitualsFoodsTab(festival = festival)

                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}
