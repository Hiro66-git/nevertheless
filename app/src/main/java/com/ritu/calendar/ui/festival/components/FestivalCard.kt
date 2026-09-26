package com.ritu.calendar.ui.festival.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.designsystem.components.CountdownTimer
import com.ritu.calendar.core.designsystem.components.RituBadge
import com.ritu.calendar.core.utils.DateTimeExtensions.formatDisplayMedium
import com.ritu.calendar.data.festival.FestivalModel
import java.time.LocalDate
import java.time.temporal.ChronoUnit

@Composable
fun FestivalCard(
    festival: FestivalModel,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), festival.gregorianDate2026)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(text = festival.visualMotif, fontSize = 28.sp)
                    Column {
                        Text(
                            text = festival.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${festival.gregorianDate2026.formatDisplayMedium()} • ${festival.lunarDateString}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontSize = 11.sp
                        )
                    }
                }

                CountdownTimer(daysRemaining = daysRemaining)
            }

            Spacer(modifier = Modifier.height(10.dp))

            Text(
                text = festival.shortSummary,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RituBadge(text = festival.region.displayName, color = MaterialTheme.colorScheme.primary)
                    RituBadge(text = festival.tradition.displayName, color = MaterialTheme.colorScheme.secondary)
                    if (festival.specificState.isNotEmpty()) {
                        RituBadge(text = festival.specificState, color = MaterialTheme.colorScheme.tertiary)
                    }
                }

                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = "Details",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}
