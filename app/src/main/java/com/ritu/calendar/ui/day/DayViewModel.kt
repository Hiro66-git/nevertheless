package com.ritu.calendar.ui.day

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ritu.calendar.core.panchang.DailyPanchang
import com.ritu.calendar.core.panchang.PanchangCalculator
import com.ritu.calendar.data.event.EventRepository
import com.ritu.calendar.data.event.PersonalEvent
import com.ritu.calendar.data.festival.FestivalModel
import com.ritu.calendar.data.festival.FestivalRepository
import com.ritu.calendar.data.local.dao.NoteDao
import com.ritu.calendar.data.local.entity.NoteEntity
import com.ritu.calendar.data.settings.UserSettings
import com.ritu.calendar.data.settings.UserSettingsRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate

data class DayUiState(
    val date: LocalDate = LocalDate.now(),
    val panchang: DailyPanchang = PanchangCalculator.calculate(LocalDate.now()),
    val festivals: List<FestivalModel> = emptyList(),
    val events: List<PersonalEvent> = emptyList(),
    val notes: List<NoteEntity> = emptyList(),
    val userSettings: UserSettings = UserSettings(),
    val isLoading: Boolean = false
)

class DayViewModel(
    private val festivalRepository: FestivalRepository,
    private val eventRepository: EventRepository,
    private val noteDao: NoteDao,
    private val userSettingsRepository: UserSettingsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DayUiState())
    val uiState: StateFlow<DayUiState> = _uiState.asStateFlow()

    fun loadDate(date: LocalDate) {
        viewModelScope.launch {
            userSettingsRepository.getUserSettings().collectLatest { settings ->
                val panchang = PanchangCalculator.calculate(
                    date = date,
                    latitude = settings.latitude,
                    longitude = settings.longitude
                )
                val fests = festivalRepository.getFestivalsForDate(date)

                eventRepository.getEventsForDate(date).collectLatest { events ->
                    noteDao.getNotesForDate(date).collectLatest { notes ->
                        _uiState.update {
                            it.copy(
                                date = date,
                                panchang = panchang,
                                festivals = fests,
                                events = events,
                                notes = notes,
                                userSettings = settings,
                                isLoading = false
                            )
                        }
                    }
                }
            }
        }
    }

    fun addNote(content: String) {
        if (content.isBlank()) return
        viewModelScope.launch {
            noteDao.insertNote(
                NoteEntity(
                    date = _uiState.value.date,
                    content = content.trim()
                )
            )
        }
    }

    fun deleteNote(note: NoteEntity) {
        viewModelScope.launch {
            noteDao.deleteNote(note)
        }
    }
}
