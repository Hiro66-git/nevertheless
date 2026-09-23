package com.ritu.calendar.data.festival

import com.ritu.calendar.core.panchang.RituSeason
import java.time.LocalDate

data class TraditionalFood(
    val name: String,
    val regionalName: String,
    val description: String
)

data class FestivalModel(
    val id: String,
    val name: String,
    val devanagariName: String,
    val regionalNames: Map<String, String> = emptyMap(), // Language/Script -> Name
    val gregorianDate2026: LocalDate,
    val lunarDateString: String,                          // e.g. "Chaitra Shukla Pratipada"
    val durationDays: Int = 1,
    val region: IndianRegion = IndianRegion.ALL_INDIA,
    val specificState: String = "",
    val tradition: ReligiousTradition = ReligiousTradition.HINDU,
    val category: FestivalCategory = FestivalCategory.MAJOR_FESTIVAL,
    val season: RituSeason,
    val shortSummary: String,
    val culturalSignificance: String,
    val traditionsAndRituals: List<String>,
    val traditionalFoods: List<TraditionalFood>,
    val regionalVariations: Map<String, String> = emptyMap(),
    val visualMotif: String,                              // Emoji or symbolic motif
    val isNationalHoliday: Boolean = false,
    val isMajorFestival: Boolean = true
) {
    fun getCelebrationDateForYear(year: Int): LocalDate {
        // Offset if different year than 2026 reference
        val yearDiff = year - 2026
        return gregorianDate2026.plusYears(yearDiff.toLong())
    }
}
