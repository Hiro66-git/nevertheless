package com.ritu.calendar.core.panchang

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import kotlin.math.*

/**
 * Astronomical and mathematical helper functions for Indian calendar (Panchang) calculations.
 * Uses high-precision algorithms based on astronomical ephemeris standards.
 */
object AstronomicalUtils {

    const val J2000_EPOCH = 2451545.0 // Julian Day for Jan 1.5, 2000 UTC
    const val RAD_TO_DEG = 180.0 / Math.PI
    const val DEG_TO_RAD = Math.PI / 180.0

    /**
     * Converts a LocalDate to Julian Day Number at 00:00:00 UTC.
     */
    fun toJulianDay(date: LocalDate, hour: Double = 6.0): Double {
        var y = date.year
        var m = date.monthValue
        val d = date.dayOfMonth + hour / 24.0

        if (m <= 2) {
            y -= 1
            m += 12
        }

        val a = floor(y / 100.0)
        val b = 2 - a + floor(a / 4.0)

        return floor(365.25 * (y + 4716)) + floor(30.6001 * (m + 1)) + d + b - 1524.5
    }

    /**
     * Normalizes an angle to [0.0, 360.0) degrees.
     */
    fun normalizeDegrees(deg: Double): Double {
        var angle = deg % 360.0
        if (angle < 0) {
            angle += 360.0
        }
        return angle
    }

    /**
     * Converts degrees to radians.
     */
    fun degToRad(deg: Double): Double = deg * DEG_TO_RAD

    /**
     * Converts radians to degrees.
     */
    fun radToDeg(rad: Double): Double = rad * RAD_TO_DEG

    /**
     * Calculates the Ayanamsha (Lahiri/Chitra Paksha) for a given Julian Day.
     * Lahiri Ayanamsha is the official Indian national calendar standard.
     */
    fun getLahiriAyanamsha(jd: Double): Double {
        val t = (jd - J2000_EPOCH) / 36525.0
        // Standard Lahiri Ayanamsha polynomial approximation
        return 23.85 + (50.29 / 3600.0) * ((jd - 2451545.0) / 365.25)
    }

    /**
     * Formats hours decimal to HH:mm string.
     */
    fun formatHourMinute(hoursDecimal: Double): String {
        val normalizedHours = (hoursDecimal + 24.0) % 24.0
        val h = normalizedHours.toInt()
        val m = ((normalizedHours - h) * 60).roundToInt()
        val finalH = if (m >= 60) (h + 1) % 24 else h
        val finalM = if (m >= 60) 0 else m
        return String.format("%02d:%02d", finalH, finalM)
    }
}
