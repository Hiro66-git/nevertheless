package com.ritu.calendar.core.panchang

import java.time.LocalDate

data class DailyPanchang(
    val date: LocalDate,
    val tithi: TithiInfo,
    val nakshatra: NakshatraInfo,
    val yoga: String,
    val yogaDevanagari: String,
    val karana: String,
    val lunarMonth: LunarMonth,
    val ritu: RituSeason,
    val celestial: EphemerisEngine.CelestialPositions,
    val sunTimes: SunTimes,
    val muhurats: DailyMuhurats,
    val regionalEras: RegionalErasInfo,
    val moonIlluminationPercentage: Int, // 0 to 100
    val moonPhaseName: String,
    val isPurnima: Boolean,
    val isAmavasya: Boolean,
    val isEkadashi: Boolean
)

object PanchangCalculator {

    private val YOGAS = listOf(
        "Vishkambha" to "विष्कम्भ",
        "Priti" to "प्रीति",
        "Ayushman" to "आयुष्मान्",
        "Saubhagya" to "सौभाग्य",
        "Shobhana" to "शोभन",
        "Atiganda" to "अतिगण्ड",
        "Sukarma" to "सुकर्मा",
        "Dhriti" to "धृति",
        "Shula" to "शूल",
        "Ganda" to "गण्ड",
        "Vriddhi" to "वृद्धि",
        "Dhruva" to "ध्रुव",
        "Vyaghata" to "व्याघात",
        "Harshana" to "हर्षण",
        "Vajra" to "वज्र",
        "Siddhi" to "सिद्धि",
        "Vyatipata" to "व्यतीपात",
        "Variyan" to "वरीयान्",
        "Parigha" to "परिघ",
        "Shiva" to "शिव",
        "Siddha" to "सिद्ध",
        "Sadhya" to "साध्य",
        "Shubha" to "शुभ",
        "Shukla" to "शुक्ल",
        "Brahma" to "ब्रह्म",
        "Indra" to "इन्द्र",
        "Vaidhriti" to "वैधृति"
    )

    private val KARANAS = listOf(
        "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)",
        "Shakuni", "Chatushpada", "Naga", "Kintughna"
    )

    /**
     * Calculates complete DailyPanchang for the specified date and geographic coordinates.
     */
    fun calculate(
        date: LocalDate,
        latitude: Double = 28.6139,
        longitude: Double = 77.2090,
        timezoneOffsetHours: Double = 5.5
    ): DailyPanchang {
        val jd = AstronomicalUtils.toJulianDay(date, 6.0)
        val positions = EphemerisEngine.computePositions(jd)

        val tithi = TithiDirectory.fromElongation(positions.elongation)
        val nakshatra = NakshatraDirectory.fromSiderealLongitude(positions.lunarLongitudeSidereal)
        val lunarMonth = LunarMonth.fromSolarLongitude(positions.solarLongitudeSidereal)
        val ritu = RituSeason.fromLunarMonth(lunarMonth)

        // Yoga calculation: (Solar Nirayana Long + Lunar Nirayana Long) / (360/27)
        val sumLong = AstronomicalUtils.normalizeDegrees(positions.solarLongitudeSidereal + positions.lunarLongitudeSidereal)
        val yogaIndex = (sumLong / (360.0 / 27.0)).toInt() % 27
        val yogaPair = YOGAS[yogaIndex]

        // Karana calculation: Elongation / 6 degrees (60 half-tithis)
        val halfTithiIndex = (positions.elongation / 6.0).toInt() % 60
        val karanaName = when {
            halfTithiIndex == 0 -> "Kintughna"
            halfTithiIndex in 1..56 -> KARANAS[(halfTithiIndex - 1) % 7]
            halfTithiIndex == 57 -> "Shakuni"
            halfTithiIndex == 58 -> "Chatushpada"
            halfTithiIndex == 59 -> "Naga"
            else -> "Bava"
        }

        val sunTimes = SolarCalculations.calculateSunTimes(
            date = date,
            latitudeDeg = latitude,
            longitudeDeg = longitude,
            timezoneOffsetHours = timezoneOffsetHours
        )

        val muhurats = MuhuratCalculator.calculate(date, sunTimes)
        val regionalEras = RegionalErasCalculator.calculate(date, lunarMonth)
        val illuminationPct = (positions.moonIllumination * 100.0).toInt().coerceIn(0, 100)

        val isPurnima = tithi.index == 15
        val isAmavasya = tithi.index == 30
        val isEkadashi = tithi.index == 11 || tithi.index == 26

        return DailyPanchang(
            date = date,
            tithi = tithi,
            nakshatra = nakshatra,
            yoga = yogaPair.first,
            yogaDevanagari = yogaPair.second,
            karana = karanaName,
            lunarMonth = lunarMonth,
            ritu = ritu,
            celestial = positions,
            sunTimes = sunTimes,
            muhurats = muhurats,
            regionalEras = regionalEras,
            moonIlluminationPercentage = illuminationPct,
            moonPhaseName = positions.moonPhaseName,
            isPurnima = isPurnima,
            isAmavasya = isAmavasya,
            isEkadashi = isEkadashi
        )
    }
}
