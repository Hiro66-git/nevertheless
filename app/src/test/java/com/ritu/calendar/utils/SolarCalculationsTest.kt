package com.ritu.calendar.utils

import com.ritu.calendar.core.panchang.MuhuratCalculator
import com.ritu.calendar.core.panchang.SolarCalculations
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class SolarCalculationsTest {

    @Test
    fun testSolarTimesCalculation() {
        val date = LocalDate.of(2026, 6, 21) // Summer Solstice
        val sunTimes = SolarCalculations.calculateSunTimes(
            date = date,
            latitudeDeg = 28.6139,
            longitudeDeg = 77.2090,
            timezoneOffsetHours = 5.5
        )

        assertNotNull(sunTimes.sunrise)
        assertNotNull(sunTimes.sunset)
        assertTrue(sunTimes.dayLengthMinutes in 700..900)
    }

    @Test
    fun testMuhuratCalculation() {
        val date = LocalDate.of(2026, 10, 20)
        val sunTimes = SolarCalculations.calculateSunTimes(date)
        val muhurats = MuhuratCalculator.calculate(date, sunTimes)

        assertNotNull(muhurats.abhijitMuhurat)
        assertTrue(muhurats.abhijitMuhurat.isAuspicious)

        assertNotNull(muhurats.rahuKaal)
        assertFalse(muhurats.rahuKaal.isAuspicious)

        assertNotNull(muhurats.brahmaMuhurat)
        assertTrue(muhurats.brahmaMuhurat.isAuspicious)
    }
}
