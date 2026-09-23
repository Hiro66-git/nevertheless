package com.ritu.calendar.ui.events

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ritu.calendar.core.designsystem.components.FilterChipRow
import com.ritu.calendar.core.designsystem.components.RituTopAppBar
import com.ritu.calendar.core.designsystem.theme.*
import com.ritu.calendar.core.utils.DateTimeExtensions.formatDisplayMedium
import com.ritu.calendar.data.event.EventCategory
import com.ritu.calendar.data.event.RecurrenceType
import java.time.LocalDate
import java.time.LocalTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateEditEventScreen(
    dateString: String?,
    eventId: Long?,
    viewModel: CreateEditEventViewModel,
    onNavigateBack: () -> Unit
) {
    LaunchedEffect(dateString, eventId) {
        if (eventId != null && eventId > 0) {
            viewModel.initForEdit(eventId)
        } else {
            viewModel.initForDate(dateString)
        }
    }

    val formState by viewModel.formState.collectAsState()
    val isEdit = formState.id > 0

    val categoryColors = listOf(
        ColorPersonalEvent,
        ColorPujaEvent,
        ColorBirthdayEvent,
        ColorAnniversaryEvent,
        ColorFestivalEvent,
        ColorHolidayEvent,
        ColorWorkEvent
    )

    Scaffold(
        topBar = {
            RituTopAppBar(
                title = if (isEdit) "Edit Event" else "New Event",
                subtitle = formState.date.formatDisplayMedium(),
                canNavigateBack = true,
                onNavigateBack = onNavigateBack,
                actions = {
                    if (isEdit) {
                        IconButton(onClick = { viewModel.deleteEvent(onNavigateBack) }) {
                            Icon(imageVector = Icons.Default.Delete, contentDescription = "Delete")
                        }
                    }
                    IconButton(
                        onClick = { viewModel.saveEvent(onNavigateBack) },
                        enabled = formState.title.isNotBlank()
                    ) {
                        Icon(imageVector = Icons.Default.Check, contentDescription = "Save")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Event Title Input
            OutlinedTextField(
                value = formState.title,
                onValueChange = { viewModel.updateTitle(it) },
                label = { Text("Event Title (e.g. Satyanarayana Puja, Birthday)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                singleLine = true
            )

            // Category Selection
            Text(
                text = "Category",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold
            )
            FilterChipRow(
                items = EventCategory.entries,
                selectedItem = formState.category,
                onItemSelected = { viewModel.updateCategory(it) },
                labelProvider = { "${it.displayName} (${it.devanagari})" },
                activeColor = formState.color
            )

            // Color Palette Picker
            Text(
                text = "Event Color",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                categoryColors.forEach { c ->
                    val isSelected = c.value == formState.color.value
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(c)
                            .border(if (isSelected) 3.dp else 0.dp, MaterialTheme.colorScheme.onSurface, CircleShape)
                            .clickable { viewModel.updateColor(c) }
                    )
                }
            }

            // Description / Notes
            OutlinedTextField(
                value = formState.description,
                onValueChange = { viewModel.updateDescription(it) },
                label = { Text("Notes & Description") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                minLines = 3,
                maxLines = 5
            )

            // Location
            OutlinedTextField(
                value = formState.location,
                onValueChange = { viewModel.updateLocation(it) },
                label = { Text("Location / Temple / Venue (Optional)") },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                singleLine = true
            )

            // All Day Switch
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "All Day Event", style = MaterialTheme.typography.bodyMedium)
                Switch(
                    checked = formState.isAllDay,
                    onCheckedChange = { viewModel.updateIsAllDay(it) }
                )
            }

            // Recurrence Picker
            Text(
                text = "Recurrence",
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold
            )
            FilterChipRow(
                items = RecurrenceType.entries,
                selectedItem = formState.recurrence,
                onItemSelected = { viewModel.updateRecurrence(it) },
                labelProvider = { it.displayName }
            )

            // Reminder Switch
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(text = "Set Reminder Notification", style = MaterialTheme.typography.bodyMedium)
                Switch(
                    checked = formState.hasReminder,
                    onCheckedChange = { viewModel.updateHasReminder(it) }
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Save Action Button
            Button(
                onClick = { viewModel.saveEvent(onNavigateBack) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = formState.color),
                enabled = formState.title.isNotBlank()
            ) {
                Text(
                    text = if (isEdit) "Update Event" else "Create Event",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
        }
    }
}
