package com.ritu.calendar.data.event

import androidx.compose.ui.graphics.Color
import com.ritu.calendar.core.designsystem.theme.*

enum class EventCategory(
    val displayName: String,
    val devanagari: String,
    val defaultColor: Color
) {
    PERSONAL("Personal", "व्यक्तिगत", ColorPersonalEvent),
    PUJA_VRAT("Puja & Vrat", "पूजा एवं व्रत", ColorPujaEvent),
    BIRTHDAY("Birthday", "जन्मदिन", ColorBirthdayEvent),
    ANNIVERSARY("Anniversary", "विवाह वर्षगांठ", ColorAnniversaryEvent),
    FESTIVAL("Festival Observance", "उत्सव", ColorFestivalEvent),
    HOLIDAY("Holiday / Vacation", "अवकाश", ColorHolidayEvent),
    WORK("Work & Tasks", "कार्य", ColorWorkEvent);

    companion object {
        fun fromName(name: String?): EventCategory {
            return entries.firstOrNull { it.name.equals(name, ignoreCase = true) } ?: PERSONAL
        }
    }
}
