package com.ritu.calendar.ui.today.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.panchang.DailyPanchang

@Composable
fun TodayPanchangCard(
    panchang: DailyPanchang,
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
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Dainik Panchang",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "दैनिक पञ्चाङ्ग",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // 2x2 Grid of Primary Panchang Pillars: Tithi, Nakshatra, Yoga, Karana
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                PanchangPillarItem(
                    label = "Tithi (तिथि)",
                    value = panchang.tithi.name,
                    subValue = panchang.tithi.devanagari,
                    modifier = Modifier.weight(1f)
                )
                PanchangPillarItem(
                    label = "Nakshatra (नक्षत्र)",
                    value = panchang.nakshatra.name,
                    subValue = panchang.nakshatra.devanagari,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                PanchangPillarItem(
                    label = "Yoga (योग)",
                    value = panchang.yoga,
                    subValue = panchang.yogaDevanagari,
                    modifier = Modifier.weight(1f)
                )
                PanchangPillarItem(
                    label = "Karana (करण)",
                    value = panchang.karana,
                    subValue = "${panchang.tithi.paksha.english.substringBefore(" ")}",
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Special Tithi Badges (Purnima, Amavasya, Ekadashi)
            if (panchang.isPurnima || panchang.isAmavasya || panchang.isEkadashi) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = when {
                            panchang.isPurnima -> "🌕 Sacred Full Moon Day (Purnima Vrat & Satyanarayana Puja)"
                            panchang.isAmavasya -> "🌑 Sacred New Moon Day (Darsha Amavasya & Pitru Puja)"
                            panchang.isEkadashi -> "✨ Auspicious Ekadashi Fasting & Devotion Day"
                            else -> ""
                        },
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun PanchangPillarItem(
    label: String,
    value: String,
    subValue: String,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
            .padding(10.dp)
    ) {
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1
            )
            Text(
                text = subValue,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary,
                fontSize = 10.sp,
                maxLines = 1
            )
        }
    }
}
