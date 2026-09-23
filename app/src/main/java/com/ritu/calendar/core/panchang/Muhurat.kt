package com.ritu.calendar.core.panchang

import java.time.DayOfWeek
import java.time.LocalDate

data class MuhuratTiming(
    val name: String,
    val devanagari: String,
    val startTime: String,
    val endTime: String,
    val isAuspicious: Boolean,
    val description: String
)

data class DailyMuhurats(
    val abhijitMuhurat: MuhuratTiming,
    val brahmaMuhurat: MuhuratTiming,
    val rahuKaal: MuhuratTiming,
    val yamaganda: MuhuratTiming,
    val gulikaKaal: MuhuratTiming,
    val amritKaal: MuhuratTiming?
)

object MuhuratCalculator {

    /**
     * Calculates daily auspicious and inauspicious Muhurats based on local sunrise and sunset.
     */
    fun calculate(
        date: LocalDate,
        sunTimes: SunTimes
    ): DailyMuhurats {
        val sunrise = sunTimes.sunriseDecimal
        val sunset = sunTimes.sunsetDecimal
        val dayDuration = if (sunset > sunrise) sunset - sunrise else (sunset + 24.0) - sunrise
        val segment = dayDuration / 8.0 // 1/8th of daytime (~1.5 hours)

        // Day of week index (Monday = 1, Sunday = 7)
        val dow = date.dayOfWeek

        // Rahu Kaal segment index (1 to 8):
        // Mon: 2nd, Tue: 7th, Wed: 5th, Thu: 6th, Fri: 4th, Sat: 3rd, Sun: 8th
        val rahuSegment = when (dow) {
            DayOfWeek.MONDAY -> 2
            DayOfWeek.TUESDAY -> 7
            DayOfWeek.WEDNESDAY -> 5
            DayOfWeek.THURSDAY -> 6
            DayOfWeek.FRIDAY -> 4
            DayOfWeek.SATURDAY -> 3
            DayOfWeek.SUNDAY -> 8
        }

        val rahuStart = sunrise + (rahuSegment - 1) * segment
        val rahuEnd = sunrise + rahuSegment * segment

        // Yamaganda segment:
        // Mon: 4th, Tue: 3rd, Wed: 2nd, Thu: 1st, Fri: 7th, Sat: 6th, Sun: 5th
        val yamaSegment = when (dow) {
            DayOfWeek.MONDAY -> 4
            DayOfWeek.TUESDAY -> 3
            DayOfWeek.WEDNESDAY -> 2
            DayOfWeek.THURSDAY -> 1
            DayOfWeek.FRIDAY -> 7
            DayOfWeek.SATURDAY -> 6
            DayOfWeek.SUNDAY -> 5
        }

        val yamaStart = sunrise + (yamaSegment - 1) * segment
        val yamaEnd = sunrise + yamaSegment * segment

        // Gulika segment:
        // Mon: 6th, Tue: 5th, Wed: 4th, Thu: 3rd, Fri: 2nd, Sat: 1st, Sun: 7th
        val gulikaSegment = when (dow) {
            DayOfWeek.MONDAY -> 6
            DayOfWeek.TUESDAY -> 5
            DayOfWeek.WEDNESDAY -> 4
            DayOfWeek.THURSDAY -> 3
            DayOfWeek.FRIDAY -> 2
            DayOfWeek.SATURDAY -> 1
            DayOfWeek.SUNDAY -> 7
        }

        val gulikaStart = sunrise + (gulikaSegment - 1) * segment
        val gulikaEnd = sunrise + gulikaSegment * segment

        // Abhijit Muhurat: 8th Muhurat of the day (each muhurat is 1/15th of day duration = ~48 min)
        val muhuratSpan = dayDuration / 15.0
        val abhijitStart = sunrise + 7 * muhuratSpan
        val abhijitEnd = sunrise + 8 * muhuratSpan

        // Brahma Muhurat: 2 muhurats before sunrise (~96 min to 48 min before sunrise)
        val brahmaStart = (sunrise - (96.0 / 60.0) + 24.0) % 24.0
        val brahmaEnd = (sunrise - (48.0 / 60.0) + 24.0) % 24.0

        return DailyMuhurats(
            abhijitMuhurat = MuhuratTiming(
                name = "Abhijit Muhurat",
                devanagari = "अभिजित मुहूर्त",
                startTime = AstronomicalUtils.formatHourMinute(abhijitStart),
                endTime = AstronomicalUtils.formatHourMinute(abhijitEnd),
                isAuspicious = true,
                description = "Most auspicious window of the afternoon to initiate important tasks and journeys."
            ),
            brahmaMuhurat = MuhuratTiming(
                name = "Brahma Muhurat",
                devanagari = "ब्रह्म मुहूर्त",
                startTime = AstronomicalUtils.formatHourMinute(brahmaStart),
                endTime = AstronomicalUtils.formatHourMinute(brahmaEnd),
                isAuspicious = true,
                description = "Pre-dawn divine hour ideal for meditation, yoga, study, and spiritual contemplation."
            ),
            rahuKaal = MuhuratTiming(
                name = "Rahu Kaal",
                devanagari = "राहु काल",
                startTime = AstronomicalUtils.formatHourMinute(rahuStart),
                endTime = AstronomicalUtils.formatHourMinute(rahuEnd),
                isAuspicious = false,
                description = "Inauspicious daytime period influenced by Rahu; avoid starting new ventures."
            ),
            yamaganda = MuhuratTiming(
                name = "Yamaganda Kaal",
                devanagari = "यमगण्ड काल",
                startTime = AstronomicalUtils.formatHourMinute(yamaStart),
                endTime = AstronomicalUtils.formatHourMinute(yamaEnd),
                isAuspicious = false,
                description = "Inauspicious period ruled by Yama; best for spiritual reflection rather than material trade."
            ),
            gulikaKaal = MuhuratTiming(
                name = "Gulika Kaal",
                devanagari = "गुलिक काल",
                startTime = AstronomicalUtils.formatHourMinute(gulikaStart),
                endTime = AstronomicalUtils.formatHourMinute(gulikaEnd),
                isAuspicious = false,
                description = "Period ruled by Saturn's son Gulikan; actions performed during this time tend to repeat."
            ),
            amritKaal = null
        )
    }
}
