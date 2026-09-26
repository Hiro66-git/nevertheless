package com.ritu.calendar.ui.today.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.panchang.DailyMuhurats

@Composable
fun MuhuratBar(
    muhurats: DailyMuhurats,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp)
        ) {
            Text(
                text = "Auspicious & Astrological Timings",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Abhijit Muhurat (Auspicious)
                MuhuratPill(
                    title = "Abhijit Muhurat",
                    timeRange = "${muhurats.abhijitMuhurat.startTime} - ${muhurats.abhijitMuhurat.endTime}",
                    isAuspicious = true,
                    modifier = Modifier.weight(1f)
                )

                // Rahu Kaal (Inauspicious)
                MuhuratPill(
                    title = "Rahu Kaal",
                    timeRange = "${muhurats.rahuKaal.startTime} - ${muhurats.rahuKaal.endTime}",
                    isAuspicious = false,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Brahma Muhurat (Pre-dawn)
                MuhuratPill(
                    title = "Brahma Muhurat",
                    timeRange = "${muhurats.brahmaMuhurat.startTime} - ${muhurats.brahmaMuhurat.endTime}",
                    isAuspicious = true,
                    modifier = Modifier.weight(1f)
                )

                // Yamaganda
                MuhuratPill(
                    title = "Yamaganda Kaal",
                    timeRange = "${muhurats.yamaganda.startTime} - ${muhurats.yamaganda.endTime}",
                    isAuspicious = false,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun MuhuratPill(
    title: String,
    timeRange: String,
    isAuspicious: Boolean,
    modifier: Modifier = Modifier
) {
    val tintColor = if (isAuspicious) Color(0xFF2E7D32) else Color(0xFFC62828)
    val bgColor = tintColor.copy(alpha = 0.09f)

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(bgColor)
            .padding(horizontal = 10.dp, vertical = 8.dp)
    ) {
        Column {
            Text(
                text = title,
                style = MaterialTheme.typography.labelSmall,
                color = tintColor,
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = timeRange,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface,
                fontSize = 12.sp
            )
        }
    }
}
