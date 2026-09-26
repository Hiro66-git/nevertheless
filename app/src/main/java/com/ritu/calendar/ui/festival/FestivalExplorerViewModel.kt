package com.ritu.calendar.ui.festival

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ritu.calendar.core.panchang.RituSeason
import com.ritu.calendar.data.festival.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class FestivalExplorerUiState(
    val festivals: List<FestivalModel> = emptyList(),
    val northeastFestivals: List<FestivalModel> = emptyList(),
    val selectedRegion: IndianRegion = IndianRegion.ALL_INDIA,
    val selectedTradition: ReligiousTradition = ReligiousTradition.ALL,
    val selectedCategory: FestivalCategory = FestivalCategory.ALL,
    val selectedSeason: RituSeason? = null,
    val searchQuery: String = "",
    val isLoading: Boolean = false
)

class FestivalExplorerViewModel(
    private val festivalRepository: FestivalRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(FestivalExplorerUiState())
    val uiState: StateFlow<FestivalExplorerUiState> = _uiState.asStateFlow()

    init {
        loadFestivals()
    }

    fun loadFestivals() {
        val allFests = festivalRepository.searchFestivals(
            query = _uiState.value.searchQuery,
            region = _uiState.value.selectedRegion,
            tradition = _uiState.value.selectedTradition,
            category = _uiState.value.selectedCategory,
            season = _uiState.value.selectedSeason
        )

        val neFests = festivalRepository.searchFestivals(
            query = "",
            region = IndianRegion.NORTHEAST_ASSAM
        )

        _uiState.update {
            it.copy(
                festivals = allFests,
                northeastFestivals = neFests,
                isLoading = false
            )
        }
    }

    fun setRegion(region: IndianRegion) {
        _uiState.update { it.copy(selectedRegion = region) }
        loadFestivals()
    }

    fun setTradition(tradition: ReligiousTradition) {
        _uiState.update { it.copy(selectedTradition = tradition) }
        loadFestivals()
    }

    fun setCategory(category: FestivalCategory) {
        _uiState.update { it.copy(selectedCategory = category) }
        loadFestivals()
    }

    fun setSeason(season: RituSeason?) {
        _uiState.update { it.copy(selectedSeason = season) }
        loadFestivals()
    }

    fun setSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadFestivals()
    }

    fun getFestival(id: String): FestivalModel? {
        return festivalRepository.getFestivalById(id)
    }
}
