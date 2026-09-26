package com.ritu.calendar.ui.events

import androidx.compose.ui.graphics.Color
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ritu.calendar.core.notifications.RituNotificationManager
import com.ritu.calendar.data.event.EventCategory
import com.ritu.calendar.data.event.EventRepository
import com.ritu.calendar.data.event.PersonalEvent
import com.ritu.calendar.data.event.RecurrenceType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime

data class EventFormState(
    val id: Long = 0,
    val title: String = "",
    val description: String = "",
    val date: LocalDate = LocalDate.now(),
    val time: LocalTime = LocalTime.of(9, 0),
    val isAllDay: Boolean = false,
    val category: EventCategory = EventCategory.PERSONAL,
    val color: Color = EventCategory.PERSONAL.defaultColor,
    val recurrence: RecurrenceType = RecurrenceType.NONE,
    val hasReminder: Boolean = false,
    val reminderMinutesBefore: Int = 30,
    val location: String = "",
    val isSaved: Boolean = false
)

class CreateEditEventViewModel(
    private val eventRepository: EventRepository,
    private val notificationManager: RituNotificationManager
) : ViewModel() {

    private val _formState = MutableStateFlow(EventFormState())
    val formState: StateFlow<EventFormState> = _formState.asStateFlow()

    fun initForDate(dateString: String?) {
        val date = dateString?.let {
            try {
                LocalDate.parse(it)
            } catch (e: Exception) {
                LocalDate.now()
            }
        } ?: LocalDate.now()

        _formState.update {
            it.copy(
                id = 0,
                title = "",
                description = "",
                date = date,
                time = LocalTime.of(9, 0),
                isAllDay = false,
                category = EventCategory.PERSONAL,
                color = EventCategory.PERSONAL.defaultColor,
                recurrence = RecurrenceType.NONE,
                hasReminder = false,
                reminderMinutesBefore = 30,
                location = "",
                isSaved = false
            )
        }
    }

    fun initForEdit(eventId: Long) {
        viewModelScope.launch {
            val event = eventRepository.getEventById(eventId)
            if (event != null) {
                _formState.update {
                    it.copy(
                        id = event.id,
                        title = event.title,
                        description = event.description,
                        date = event.date,
                        time = event.time,
                        isAllDay = event.isAllDay,
                        category = event.category,
                        color = event.color,
                        recurrence = event.recurrence,
                        hasReminder = event.hasReminder,
                        reminderMinutesBefore = event.reminderMinutesBefore,
                        location = event.location,
                        isSaved = false
                    )
                }
            }
        }
    }

    fun updateTitle(title: String) {
        _formState.update { it.copy(title = title) }
    }

    fun updateDescription(desc: String) {
        _formState.update { it.copy(description = desc) }
    }

    fun updateDate(date: LocalDate) {
        _formState.update { it.copy(date = date) }
    }

    fun updateTime(time: LocalTime) {
        _formState.update { it.copy(time = time) }
    }

    fun updateIsAllDay(isAllDay: Boolean) {
        _formState.update { it.copy(isAllDay = isAllDay) }
    }

    fun updateCategory(category: EventCategory) {
        _formState.update { it.copy(category = category, color = category.defaultColor) }
    }

    fun updateColor(color: Color) {
        _formState.update { it.copy(color = color) }
    }

    fun updateRecurrence(recurrence: RecurrenceType) {
        _formState.update { it.copy(recurrence = recurrence) }
    }

    fun updateHasReminder(hasReminder: Boolean) {
        _formState.update { it.copy(hasReminder = hasReminder) }
    }

    fun updateReminderMinutes(minutes: Int) {
        _formState.update { it.copy(reminderMinutesBefore = minutes) }
    }

    fun updateLocation(location: String) {
        _formState.update { it.copy(location = location) }
    }

    fun saveEvent(onComplete: () -> Unit) {
        val state = _formState.value
        if (state.title.isBlank()) return

        val event = PersonalEvent(
            id = state.id,
            title = state.title.trim(),
            description = state.description.trim(),
            date = state.date,
            time = state.time,
            isAllDay = state.isAllDay,
            category = state.category,
            color = state.color,
            recurrence = state.recurrence,
            hasReminder = state.hasReminder,
            reminderMinutesBefore = state.reminderMinutesBefore,
            location = state.location.trim()
        )

        viewModelScope.launch {
            if (state.id == 0L) {
                val newId = eventRepository.saveEvent(event)
                if (event.hasReminder) {
                    notificationManager.scheduleEventReminder(event.copy(id = newId))
                }
            } else {
                eventRepository.updateEvent(event)
                if (event.hasReminder) {
                    notificationManager.scheduleEventReminder(event)
                } else {
                    notificationManager.cancelEventReminder(event.id)
                }
            }
            _formState.update { it.copy(isSaved = true) }
            onComplete()
        }
    }

    fun deleteEvent(onComplete: () -> Unit) {
        val id = _formState.value.id
        if (id != 0L) {
            viewModelScope.launch {
                notificationManager.cancelEventReminder(id)
                eventRepository.deleteEventById(id)
                onComplete()
            }
        }
    }
}
