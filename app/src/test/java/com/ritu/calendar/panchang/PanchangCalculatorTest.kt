package com.ritu.calendar.panchang

import com.ritu.calendar.core.panchang.*
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class PanchangCalculatorTest {

    @Test
    fun testPanchangCalculationForKnownDate() {
        // Oct 20, 2026 (Dussehra period)
        val date = LocalDate.of(2026, 10, 20)
        val panchang = PanchangCalculator.calculate(date)

        assertNotNull(panchang)
        assertEquals(date, panchang.date)
        assertNotNull(panchang.tithi)
        assertNotNull(panchang.nakshatra)
        assertNotNull(panchang.yoga)
        assertNotNull(panchang.karana)
        assertNotNull(panchang.lunarMonth)
        assertNotNull(panchang.ritu)
        assertTrue(panchang.moonIlluminationPercentage in 0..100)
    }

    @Test
    fun testTithiDirectoryBoundaries() {
        val tithi1 = TithiDirectory.getTithi(1)
        assertEquals(Paksha.SHUKLA, tithi1.paksha)
        assertTrue(tithi1.name.contains("Pratipada"))

        val tithi15 = TithiDirectory.getTithi(15)
        assertEquals(Paksha.SHUKLA, tithi15.paksha)
        assertTrue(tithi15.name.contains("Purnima"))

        val tithi16 = TithiDirectory.getTithi(16)
        assertEquals(Paksha.KRISHNA, tithi16.paksha)
        assertTrue(tithi16.name.contains("Pratipada"))

        val tithi30 = TithiDirectory.getTithi(30)
        assertEquals(Paksha.KRISHNA, tithi30.paksha)
        assertTrue(tithi30.name.contains("Amavasya"))
    }

    @Test
    fun testNakshatraDirectory27() {
        val firstNakshatra = NakshatraDirectory.getByIndex(1)
        assertEquals("Ashwini", firstNakshatra.name)

        val lastNakshatra = NakshatraDirectory.getByIndex(27)
        assertEquals("Revati", lastNakshatra.name)
    }

    @Test
    fun testRegionalErasCalculation() {
        val date = LocalDate.of(2026, 6, 15)
        val eras = RegionalErasCalculator.calculate(date, LunarMonth.JYESHTHA)

        assertEquals(2083, eras.vikramSamvat)
        assertEquals(1948, eras.sakaSamvat)
        assertEquals(1433, eras.bhaskarEra)
    }
}
