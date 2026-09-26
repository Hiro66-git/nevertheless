package com.ritu.calendar.ui.settings.components

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
import com.ritu.calendar.core.designsystem.theme.ThemeMode

@Composable
fun ThemeSelectorRow(
    currentTheme: ThemeMode,
    onThemeSelect: (ThemeMode) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Visual Aesthetic & Themes",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Text(
            text = "Select from 5 hand-crafted visual identities for time and culture.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(10.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            ThemeMode.entries.forEach { mode ->
                val isSelected = mode == currentTheme

                val (accentColor, cardBg) = when (mode) {
                    ThemeMode.LIGHT -> Color(0xFFFF7A00) to Color(0xFFFBF8F2)
                    ThemeMode.DARK -> Color(0xFFFFB300) to Color(0xFF161B22)
                    ThemeMode.INDIAN_HERITAGE -> Color(0xFFE5893C) to Color(0xFF2B1D12)
                    ThemeMode.MINIMAL -> Color(0xFF212121) to Color(0xFFFFFFFF)
                    ThemeMode.FESTIVAL_MODE -> Color(0xFFFF9800) to Color(0xFF201535)
                }

                Box(
                    modifier = Modifier
                        .width(140.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(cardBg)
                        .border(if (isSelected) 2.dp else 1.dp, if (isSelected) accentColor else Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .clickable { onThemeSelect(mode) }
                        .padding(12.dp)
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .size(16.dp)
                                .clip(RoundedCornerShape(4.dp))
                                .background(accentColor)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = mode.title,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = mode.description,
                            style = MaterialTheme.typography.labelSmall,
                            fontSize = 10.sp,
                            maxLines = 2,
                            lineHeight = 13.sp
                        )
                    }
                }
            }
        }
    }
}
