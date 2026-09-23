package com.ritu.calendar.data.festival

import com.ritu.calendar.core.panchang.RituSeason
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.time.LocalDate
import java.time.temporal.ChronoUnit

class FestivalRepository(
    private val dataSource: List<FestivalModel> = FestivalDataSource.festivals
) {

    fun getAllFestivals(): Flow<List<FestivalModel>> = flow {
        emit(dataSource)
    }

    fun getFestivalById(id: String): FestivalModel? {
        return dataSource.firstOrNull { it.id == id }
    }

    fun getFestivalsForDate(date: LocalDate): List<FestivalModel> {
        return dataSource.filter { festival ->
            val festDate = festival.getCelebrationDateForYear(date.year)
            festDate == date || (date >= festDate && date < festDate.plusDays(festival.durationDays.toLong()))
        }
    }

    fun getFestivalsForMonth(year: Int, month: Int): List<FestivalModel> {
        return dataSource.filter { festival ->
            val festDate = festival.getCelebrationDateForYear(year)
            festDate.year == year && festDate.monthValue == month
        }.sortedBy { it.getCelebrationDateForYear(year) }
    }

    fun getFestivalsForYear(year: Int): List<FestivalModel> {
        return dataSource.map { it.copy(gregorianDate2026 = it.getCelebrationDateForYear(year)) }
            .sortedBy { it.gregorianDate2026 }
    }

    fun getUpcomingFestivals(from: LocalDate, limit: Int = 10): List<FestivalModel> {
        return dataSource
            .map { it.copy(gregorianDate2026 = it.getCelebrationDateForYear(from.year)) }
            .filter { !it.gregorianDate2026.isBefore(from) }
            .sortedBy { it.gregorianDate2026 }
            .take(limit)
    }

    fun searchFestivals(
        query: String,
        region: IndianRegion = IndianRegion.ALL_INDIA,
        tradition: ReligiousTradition = ReligiousTradition.ALL,
        category: FestivalCategory = FestivalCategory.ALL,
        season: RituSeason? = null
    ): List<FestivalModel> {
        return dataSource.filter { festival ->
            val matchesQuery = query.isBlank() ||
                    festival.name.contains(query, ignoreCase = true) ||
                    festival.devanagariName.contains(query, ignoreCase = true) ||
                    festival.shortSummary.contains(query, ignoreCase = true) ||
                    festival.specificState.contains(query, ignoreCase = true) ||
                    festival.culturalSignificance.contains(query, ignoreCase = true)

            val matchesRegion = region == IndianRegion.ALL_INDIA ||
                    festival.region == IndianRegion.ALL_INDIA ||
                    festival.region == region

            val matchesTradition = tradition == ReligiousTradition.ALL || festival.tradition == tradition
            val matchesCategory = category == FestivalCategory.ALL || festival.category == category
            val matchesSeason = season == null || festival.season == season

            matchesQuery && matchesRegion && matchesTradition && matchesCategory && matchesSeason
        }.sortedBy { it.gregorianDate2026 }
    }

    fun getDaysUntilFestival(festival: FestivalModel, currentDate: LocalDate): Long {
        val celebrationDate = festival.getCelebrationDateForYear(currentDate.year)
        val targetDate = if (celebrationDate.isBefore(currentDate)) {
            festival.getCelebrationDateForYear(currentDate.year + 1)
        } else {
            celebrationDate
        }
        return ChronoUnit.DAYS.between(currentDate, targetDate)
    }
}
