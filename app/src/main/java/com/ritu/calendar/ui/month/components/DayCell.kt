package com.ritu.calendar.ui.month.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
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
import com.ritu.calendar.ui.month.DayCalendarData

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun DayCell(
    dayData: DayCalendarData,
    isSelected: Boolean,
    onDateClick: () -> Unit,
    onDateLongClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isCurrentMonth = dayData.isCurrentMonth
    val isToday = dayData.isToday
    val hasFestivals = dayData.festivals.isNotEmpty()
    val hasEvents = dayData.events.isNotEmpty()
    val hasHoliday = dayData.hasHoliday
    val panchang = dayData.panchang

    val primaryColor = MaterialTheme.colorScheme.primary

    val cellBackground = when {
        isSelected -> primaryColor.copy(alpha = 0.18f)
        isToday -> primaryColor.copy(alpha = 0.08f)
        else -> Color.Transparent
    }

    val borderColor = when {
        isSelected -> primaryColor
        isToday -> primaryColor.copy(alpha = 0.5f)
        else -> Color.Transparent
    }

    val textColor = when {
        !isCurrentMonth -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.28f)
        hasHoliday -> Color(0xFFC62828)
        isToday -> primaryColor
        else -> MaterialTheme.colorScheme.onSurface
    }

    Box(
        modifier = modifier
            .aspectRatio(0.85f)
            .padding(2.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(cellBackground)
            .border(if (isSelected || isToday) 1.2.dp else 0.dp, borderColor, RoundedCornerShape(10.dp))
            .combinedClickable(
                onClick = onDateClick,
                onLongClick = onDateLongClick
            )
            .padding(4.dp),
        contentAlignment = Alignment.TopCenter
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween,
            modifier = Modifier.fillMaxSize()
        ) {
            // Day Number
            Text(
                text = "${dayData.date.dayOfMonth}",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isSelected || isToday) FontWeight.Bold else FontWeight.Medium,
                color = textColor,
                fontSize = 14.sp
            )

            // Short Tithi indicator (e.g. S15 = Shukla Purnima, K30 = Amavasya)
            if (isCurrentMonth) {
                val tithiCode = when {
                    panchang.isPurnima -> "🌕"
                    panchang.isAmavasya -> "🌑"
                    panchang.isEkadashi -> "✨"
                    else -> ""
                }
                if (tithiCode.isNotEmpty()) {
                    Text(
                        text = tithiCode,
                        fontSize = 9.sp,
                        lineHeight = 10.sp
                    )
                }
            }

            // Indicator Dots Row: Festivals (Orange/Saffron), Events (Blue), Holiday (Red)
            Row(
                horizontalArrangement = Arrangement.spacedBy(3.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (hasFestivals) {
                    Box(
                        modifier = Modifier
                            .size(5.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFF7A00))
                    )
                }
                if (hasEvents) {
                    Box(
                        modifier = Modifier
                            .size(5.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF42A5F5))
                    )
                }
                if (hasHoliday && !hasFestivals) {
                    Box(
                        modifier = Modifier
                            .size(5.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF2E7D32))
                    )
                }
            }
        }
    }
}
