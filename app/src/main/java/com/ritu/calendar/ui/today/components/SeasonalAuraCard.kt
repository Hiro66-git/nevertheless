package com.ritu.calendar.ui.today.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.panchang.RituSeason

@Composable
fun SeasonalAuraCard(
    season: RituSeason,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = season.primaryColor.copy(alpha = 0.08f)
        ),
        border = androidx.compose.foundation.BorderStroke(
            width = 1.dp,
            color = season.primaryColor.copy(alpha = 0.25f)
        )
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
                Column {
                    Text(
                        text = "Season of ${season.englishName}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = season.primaryColor
                    )
                    Text(
                        text = "${season.devanagari} ऋतु • ${season.monthsPeriod}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Text(
                    text = season.naturalMotif,
                    style = MaterialTheme.typography.titleMedium
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Sanskrit Classical Shloka
            Text(
                text = season.shloka,
                style = MaterialTheme.typography.bodySmall,
                fontStyle = FontStyle.Italic,
                fontFamily = FontFamily.Serif,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f),
                fontSize = 12.sp,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = season.description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 12.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(season.primaryColor.copy(alpha = 0.12f))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(
                    text = "🌿 Ayurveda: ${season.ayurvedicDosha}",
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 11.sp,
                    color = season.primaryColor,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}
