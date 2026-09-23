package com.ritu.calendar.ui.today.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.designsystem.components.IndianMandalaCanvas
import com.ritu.calendar.core.designsystem.components.RituBadge
import com.ritu.calendar.core.panchang.DailyPanchang
import com.ritu.calendar.core.utils.DateTimeExtensions.getDayOfWeekDevanagari
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

@Composable
fun LivingHeroCard(
    panchang: DailyPanchang,
    onCardClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val ritu = panchang.ritu
    val date = panchang.date
    val dayOfMonth = date.dayOfMonth
    val monthName = date.month.getDisplayName(TextStyle.FULL, Locale.ENGLISH).uppercase()
    val year = date.year
    val dayOfWeekName = date.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH)
    val dayOfWeekDevanagari = getDayOfWeekDevanagari(date.dayOfWeek)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp))
            .clickable { onCardClick() },
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            ritu.primaryColor.copy(alpha = 0.16f),
                            Color.Transparent
                        ),
                        radius = 450f
                    )
                )
                .padding(20.dp)
        ) {
            // Mandala background watermark
            IndianMandalaCanvas(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .offset(x = 24.dp, y = (-12).dp),
                size = 140.dp,
                alpha = 0.18f,
                primaryColor = ritu.primaryColor,
                secondaryColor = ritu.secondaryColor
            )

            Column(modifier = Modifier.fillMaxWidth()) {
                // Top header: Season & Devanagari Day
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RituBadge(
                        text = "${ritu.devanagari} ${ritu.englishName}",
                        color = ritu.primaryColor
                    )
                    Text(
                        text = dayOfWeekDevanagari,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 11.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Hero Date row: Day Number + Month & Year
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text(
                        text = "$dayOfMonth",
                        style = MaterialTheme.typography.displayLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 58.sp,
                        lineHeight = 60.sp
                    )
                    Column {
                        Text(
                            text = monthName,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            letterSpacing = 1.5.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "$dayOfWeekName, $year",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "${panchang.lunarMonth.sanskrit} Masa • ${panchang.tithi.name}",
                            style = MaterialTheme.typography.labelMedium,
                            color = ritu.primaryColor,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Era Summary Banner
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = panchang.regionalEras.formattedSummary,
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 11.sp
                        )
                        Icon(
                            imageVector = Icons.Default.ChevronRight,
                            contentDescription = "View Day",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}
