package com.ritu.calendar.core.panchang

import kotlin.math.*

/**
 * Solar and Lunar ephemeris calculations.
 * Calculates apparent solar and lunar positions, ecliptic coordinates,
 * moon elongation, moon illumination percentage, and phase names.
 */
object EphemerisEngine {

    data class CelestialPositions(
        val solarLongitudeTropical: Double,
        val lunarLongitudeTropical: Double,
        val solarLongitudeSidereal: Double, // Nirayana (Vedic)
        val lunarLongitudeSidereal: Double, // Nirayana (Vedic)
        val elongation: Double,             // Moon-Sun angular separation [0, 360)
        val moonIllumination: Double,       // 0.0 to 1.0 (0% to 100%)
        val moonPhaseName: String,
        val moonAgeDays: Double
    )

    /**
     * Computes solar and lunar positions for a given Julian Day.
     */
    fun computePositions(julianDay: Double): CelestialPositions {
        val d = julianDay - AstronomicalUtils.J2000_EPOCH
        val ayanamsha = AstronomicalUtils.getLahiriAyanamsha(julianDay)

        // --- Sun's Ecliptic Longitude ---
        val sunMeanLong = AstronomicalUtils.normalizeDegrees(280.460 + 0.9856474 * d)
        val sunMeanAnomaly = AstronomicalUtils.normalizeDegrees(357.528 + 0.9856003 * d)
        val gRad = AstronomicalUtils.degToRad(sunMeanAnomaly)

        // Equation of center for Sun
        val sunCenter = 1.915 * sin(gRad) + 0.020 * sin(2 * gRad)
        val sunEclipticTropical = AstronomicalUtils.normalizeDegrees(sunMeanLong + sunCenter)
        val sunEclipticSidereal = AstronomicalUtils.normalizeDegrees(sunEclipticTropical - ayanamsha)

        // --- Moon's Ecliptic Longitude ---
        val moonMeanLong = AstronomicalUtils.normalizeDegrees(218.316 + 13.176396 * d)
        val moonMeanAnomaly = AstronomicalUtils.normalizeDegrees(134.963 + 13.064993 * d)
        val moonElongation = AstronomicalUtils.normalizeDegrees(297.850 + 12.190749 * d)
        val moonNodeDist = AstronomicalUtils.normalizeDegrees(93.272 + 13.229350 * d)

        val mRad = AstronomicalUtils.degToRad(moonMeanAnomaly)
        val dRad = AstronomicalUtils.degToRad(moonElongation)
        val fRad = AstronomicalUtils.degToRad(moonNodeDist)

        // Major lunar periodic perturbations
        val moonCenter = 6.289 * sin(mRad) +
                1.274 * sin(2 * dRad - mRad) +
                0.658 * sin(2 * dRad) -
                0.186 * sin(gRad) -
                0.214 * sin(2 * mRad) -
                0.114 * sin(2 * fRad)

        val moonEclipticTropical = AstronomicalUtils.normalizeDegrees(moonMeanLong + moonCenter)
        val moonEclipticSidereal = AstronomicalUtils.normalizeDegrees(moonEclipticTropical - ayanamsha)

        // Phase angle / Elongation
        val separation = AstronomicalUtils.normalizeDegrees(moonEclipticTropical - sunEclipticTropical)

        // Moon phase illumination percentage (0 to 1)
        val phaseAngleRad = AstronomicalUtils.degToRad(separation)
        val illumination = (1.0 - cos(phaseAngleRad)) / 2.0
        val moonAgeDays = (separation / 360.0) * 29.530588

        val phaseName = when {
            separation < 6.0 || separation >= 354.0 -> "Amavasya (New Moon)"
            separation < 84.0 -> "Waxing Crescent"
            separation < 96.0 -> "Shukla Ashtami (First Quarter)"
            separation < 174.0 -> "Waxing Gibbous"
            separation < 186.0 -> "Purnima (Full Moon)"
            separation < 264.0 -> "Waning Gibbous"
            separation < 276.0 -> "Krishna Ashtami (Third Quarter)"
            else -> "Waning Crescent"
        }

        return CelestialPositions(
            solarLongitudeTropical = sunEclipticTropical,
            lunarLongitudeTropical = moonEclipticTropical,
            solarLongitudeSidereal = sunEclipticSidereal,
            lunarLongitudeSidereal = moonEclipticSidereal,
            elongation = separation,
            moonIllumination = illumination,
            moonPhaseName = phaseName,
            moonAgeDays = moonAgeDays
        )
    }
}
