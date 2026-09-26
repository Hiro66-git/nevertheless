package com.ritu.calendar.core.utils

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

object DateTimeExtensions {

    private val INDIAN_MONTH_NAMES_GREGORIAN = listOf(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    )

    fun LocalDate.formatDisplayFull(): String {
        val dayName = this.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.ENGLISH)
        val monthName = this.month.getDisplayName(TextStyle.FULL, Locale.ENGLISH)
        return "$dayName, $monthName ${this.dayOfMonth}, ${this.year}"
    }

    fun LocalDate.formatDisplayMedium(): String {
        val monthName = this.month.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)
        return "$monthName ${this.dayOfMonth}, ${this.year}"
    }

    fun LocalDate.formatMonthYear(): String {
        val monthName = this.month.getDisplayName(TextStyle.FULL, Locale.ENGLISH)
        return "$monthName ${this.year}"
    }

    fun LocalTime.formatDisplay(): String {
        val hour = if (this.hour == 0 || this.hour == 12) 12 else this.hour % 12
        val amPm = if (this.hour < 12) "AM" else "PM"
        return String.format("%d:%02d %s", hour, this.minute, amPm)
    }

    fun getDayOfWeekDevanagari(dayOfWeek: DayOfWeek): String {
        return when (dayOfWeek) {
            DayOfWeek.MONDAY -> "सोमवार (Somavara)"
            DayOfWeek.TUESDAY -> "मंगलवार (Mangalavara)"
            DayOfWeek.WEDNESDAY -> "बुधवार (Budhavara)"
            DayOfWeek.THURSDAY -> "गुरुवार (Guruvara)"
            DayOfWeek.FRIDAY -> "शुक्रवार (Shukravara)"
            DayOfWeek.SATURDAY -> "शनिवार (Shanivara)"
            DayOfWeek.SUNDAY -> "रविवार (Ravivara)"
        }
    }
}
