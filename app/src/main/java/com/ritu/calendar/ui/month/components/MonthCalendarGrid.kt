package com.ritu.calendar.ui.month.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.ritu.calendar.ui.month.DayCalendarData
import java.time.LocalDate

@Composable
fun MonthCalendarGrid(
    days: List<DayCalendarData>,
    selectedDate: LocalDate,
    onDateClick: (LocalDate) -> Unit,
    onDateLongClick: (LocalDate) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier.fillMaxWidth()) {
        // Render 6 rows of 7 days
        val chunkedDays = days.chunked(7)

        chunkedDays.forEach { week ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 1.dp),
                horizontalArrangement = Arrangement.SpaceAround
            ) {
                week.forEach { dayData ->
                    DayCell(
                        dayData = dayData,
                        isSelected = dayData.date == selectedDate,
                        onDateClick = { onDateClick(dayData.date) },
                        onDateLongClick = { onDateLongClick(dayData.date) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}
