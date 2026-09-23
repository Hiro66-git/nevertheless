package com.ritu.calendar.core.panchang

import java.time.LocalDate
import java.time.LocalTime
import kotlin.math.*

data class SunTimes(
    val sunrise: String,
    val sunset: String,
    val solarNoon: String,
    val dayLengthMinutes: Int,
    val dayLengthFormatted: String,
    val sunriseDecimal: Double, // Hours decimal
    val sunsetDecimal: Double
)

object SolarCalculations {

    /**
     * Calculates NOAA solar sunrise, sunset, and solar noon for a given date, latitude, and longitude.
     * Timezone offset in hours (e.g. +5.5 for IST).
     */
    fun calculateSunTimes(
        date: LocalDate,
        latitudeDeg: Double = 28.6139, // Default: New Delhi (28.6139° N, 77.2090° E)
        longitudeDeg: Double = 77.2090,
        timezoneOffsetHours: Double = 5.5
    ): SunTimes {
        val dayOfYear = date.dayOfYear
        val gamma = 2.0 * Math.PI / 365.0 * (dayOfYear - 1.0 + (12.0 - 12.0) / 24.0)

        // Equation of time in minutes
        val eqTime = 229.18 * (0.000075 + 0.001868 * cos(gamma) - 0.032077 * sin(gamma) -
                0.014615 * cos(2 * gamma) - 0.040849 * sin(2 * gamma))

        // Solar declination in radians
        val declRad = 0.006918 - 0.399912 * cos(gamma) + 0.070257 * sin(gamma) -
                0.006758 * cos(2 * gamma) + 0.000907 * sin(2 * gamma) -
                0.002697 * cos(3 * gamma) + 0.00148 * sin(3 * gamma)

        val latRad = AstronomicalUtils.degToRad(latitudeDeg)
        val zenithRad = AstronomicalUtils.degToRad(90.833) // Standard refraction zenith for sunrise/sunset

        var cosHourAngle = (cos(zenithRad) - sin(latRad) * sin(declRad)) / (cos(latRad) * cos(declRad))
        cosHourAngle = cosHourAngle.coerceIn(-1.0, 1.0)
        val hourAngleDeg = AstronomicalUtils.radToDeg(acos(cosHourAngle))

        // Solar noon in minutes from midnight UTC
        val solarNoonUtcMinutes = 720.0 - (4.0 * longitudeDeg) - eqTime
        val solarNoonLocalMinutes = solarNoonUtcMinutes + (timezoneOffsetHours * 60.0)

        val sunriseMinutes = solarNoonLocalMinutes - (hourAngleDeg * 4.0)
        val sunsetMinutes = solarNoonLocalMinutes + (hourAngleDeg * 4.0)

        val dayLengthMinutes = (sunsetMinutes - sunriseMinutes).toInt()
        val dayLengthHours = dayLengthMinutes / 60
        val dayLengthRemainingMin = dayLengthMinutes % 60

        val sunriseHoursDecimal = sunriseMinutes / 60.0
        val sunsetHoursDecimal = sunsetMinutes / 60.0
        val solarNoonHoursDecimal = solarNoonLocalMinutes / 60.0

        return SunTimes(
            sunrise = AstronomicalUtils.formatHourMinute(sunriseHoursDecimal),
            sunset = AstronomicalUtils.formatHourMinute(sunsetHoursDecimal),
            solarNoon = AstronomicalUtils.formatHourMinute(solarNoonHoursDecimal),
            dayLengthMinutes = dayLengthMinutes,
            dayLengthFormatted = "${dayLengthHours}h ${dayLengthRemainingMin}m",
            sunriseDecimal = (sunriseHoursDecimal + 24.0) % 24.0,
            sunsetDecimal = (sunsetHoursDecimal + 24.0) % 24.0
        )
    }
}
