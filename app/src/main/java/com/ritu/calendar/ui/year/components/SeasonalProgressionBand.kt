package com.ritu.calendar.ui.year.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.panchang.RituSeason

@Composable
fun SeasonalProgressionBand(
    selectedSeason: RituSeason?,
    onSeasonSelect: (RituSeason?) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Shad-Ritu Cycle (षड्ऋतु चक्र)",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // All Seasons button
            SeasonChip(
                title = "All Ritus",
                devanagari = "समस्त ऋतु",
                color = MaterialTheme.colorScheme.primary,
                isSelected = selectedSeason == null,
                onClick = { onSeasonSelect(null) }
            )

            RituSeason.entries.forEach { season ->
                SeasonChip(
                    title = season.englishName,
                    devanagari = season.devanagari,
                    color = season.primaryColor,
                    isSelected = selectedSeason == season,
                    onClick = { onSeasonSelect(season) }
                )
            }
        }
    }
}

@Composable
private fun SeasonChip(
    title: String,
    devanagari: String,
    color: Color,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val bg = if (isSelected) color else color.copy(alpha = 0.12f)
    val textColor = if (isSelected) Color.White else color

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(bg)
            .border(1.dp, color.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = devanagari,
                style = MaterialTheme.typography.labelSmall,
                color = textColor,
                fontWeight = FontWeight.Bold,
                fontSize = 10.sp
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall,
                color = textColor,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}
