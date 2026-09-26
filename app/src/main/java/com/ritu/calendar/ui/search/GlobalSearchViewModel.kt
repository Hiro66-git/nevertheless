package com.ritu.calendar.ui.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ritu.calendar.data.event.EventRepository
import com.ritu.calendar.data.event.PersonalEvent
import com.ritu.calendar.data.festival.FestivalModel
import com.ritu.calendar.data.festival.FestivalRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

enum class SearchCategoryFilter {
    ALL, FESTIVALS, EVENTS, HOLIDAYS
}

data class SearchUiState(
    val query: String = "",
    val activeFilter: SearchCategoryFilter = SearchCategoryFilter.ALL,
    val festivalResults: List<FestivalModel> = emptyList(),
    val eventResults: List<PersonalEvent> = emptyList(),
    val isSearching: Boolean = false
)

class GlobalSearchViewModel(
    private val festivalRepository: FestivalRepository,
    private val eventRepository: EventRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    fun updateQuery(query: String) {
        _uiState.update { it.copy(query = query) }
        performSearch(query)
    }

    fun setFilter(filter: SearchCategoryFilter) {
        _uiState.update { it.copy(activeFilter = filter) }
    }

    private fun performSearch(query: String) {
        if (query.isBlank()) {
            _uiState.update { it.copy(festivalResults = emptyList(), eventResults = emptyList()) }
            return
        }

        val fests = festivalRepository.searchFestivals(query = query)

        viewModelScope.launch {
            eventRepository.searchEvents(query).collectLatest { events ->
                _uiState.update {
                    it.copy(
                        festivalResults = fests,
                        eventResults = events,
                        isSearching = false
                    )
                }
            }
        }
    }
}
