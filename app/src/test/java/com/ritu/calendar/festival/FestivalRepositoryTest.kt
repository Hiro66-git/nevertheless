package com.ritu.calendar.festival

import com.ritu.calendar.data.festival.FestivalDataSource
import com.ritu.calendar.data.festival.FestivalRepository
import com.ritu.calendar.data.festival.IndianRegion
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

class FestivalRepositoryTest {

    private lateinit var repository: FestivalRepository

    @Before
    fun setUp() {
        repository = FestivalRepository()
    }

    @Test
    fun testFestivalsCountAndIntegrity() {
        val allFestivals = FestivalDataSource.festivals
        assertTrue("Festival database should have rich variety of festivals", allFestivals.size >= 15)

        for (fest in allFestivals) {
            assertNotNull(fest.id)
            assertNotNull(fest.name)
            assertNotNull(fest.devanagariName)
            assertNotNull(fest.gregorianDate2026)
            assertTrue(fest.traditionsAndRituals.isNotEmpty())
            assertTrue(fest.shortSummary.isNotEmpty())
        }
    }

    @Test
    fun testNortheastFestivalsInclusion() {
        val neFests = repository.searchFestivals(query = "", region = IndianRegion.NORTHEAST_ASSAM)
        assertTrue("Northeast festivals must include Rongali Bihu and others", neFests.isNotEmpty())

        val hasBihu = neFests.any { it.name.contains("Bihu", ignoreCase = true) }
        assertTrue("Must include Bihu festivals", hasBihu)

        val hasHornbill = neFests.any { it.name.contains("Hornbill", ignoreCase = true) }
        assertTrue("Must include Hornbill festival", hasHornbill)
    }

    @Test
    fun testSearchFestivalsByKeyword() {
        val diwaliResults = repository.searchFestivals(query = "Diwali")
        assertTrue(diwaliResults.isNotEmpty())
        assertEquals("fest_diwali", diwaliResults.first().id)

        val bihuResults = repository.searchFestivals(query = "Bihu")
        assertTrue(bihuResults.size >= 3) // Rongali, Bhogali, Kongali
    }

    @Test
    fun testGetFestivalsForSpecificDate() {
        val diwaliDate = LocalDate.of(2026, 11, 8)
        val fests = repository.getFestivalsForDate(diwaliDate)
        assertTrue(fests.any { it.id == "fest_diwali" })
    }
}
