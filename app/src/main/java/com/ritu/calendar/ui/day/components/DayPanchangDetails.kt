package com.ritu.calendar.ui.day.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.panchang.DailyPanchang

@Composable
fun DayPanchangDetails(
    panchang: DailyPanchang,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
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
                text = "Full Panchang & Muhurat",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(14.dp))

            DetailRow(title = "Tithi (तिथि)", value = "${panchang.tithi.name} (${panchang.tithi.devanagari})", description = panchang.tithi.significance)
            DetailRow(title = "Nakshatra (नक्षत्र)", value = "${panchang.nakshatra.name} (${panchang.nakshatra.devanagari})", description = "Lord: ${panchang.nakshatra.planetaryLord} • Deity: ${panchang.nakshatra.deity}")
            DetailRow(title = "Yoga (योग)", value = "${panchang.yoga} (${panchang.yogaDevanagari})")
            DetailRow(title = "Karana (करण)", value = panchang.karana)
            DetailRow(title = "Lunar Month (मास)", value = "${panchang.lunarMonth.sanskrit} (${panchang.lunarMonth.devanagari})")
            DetailRow(title = "Sun Timings", value = "Sunrise: ${panchang.sunTimes.sunrise} AM • Sunset: ${panchang.sunTimes.sunset} PM")
            DetailRow(title = "Abhijit Muhurat", value = "${panchang.muhurats.abhijitMuhurat.startTime} - ${panchang.muhurats.abhijitMuhurat.endTime} (Auspicious)")
            DetailRow(title = "Rahu Kaal", value = "${panchang.muhurats.rahuKaal.startTime} - ${panchang.muhurats.rahuKaal.endTime} (Inauspicious)")
        }
    }
}

@Composable
private fun DetailRow(
    title: String,
    value: String,
    description: String? = null
) {
    Column(modifier = Modifier.padding(vertical = 5.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
        if (description != null) {
            Text(
                text = description,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f),
                fontSize = 11.sp
            )
        }
        Divider(
            modifier = Modifier.padding(top = 6.dp),
            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
        )
    }
}
