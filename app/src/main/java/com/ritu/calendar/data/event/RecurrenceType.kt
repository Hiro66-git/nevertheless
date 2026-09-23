package com.ritu.calendar.data.event

enum class RecurrenceType(val displayName: String, val devanagari: String) {
    NONE("Does Not Repeat", "पुनरावृत्ति नहीं"),
    DAILY("Daily", "प्रतिदिन"),
    WEEKLY("Weekly", "साप्ताहिक"),
    MONTHLY("Monthly", "मासिक"),
    YEARLY("Yearly (Gregorian)", "वार्षिक"),
    LUNAR_ANNUAL("Yearly (Vedic Lunar Tithi)", "वार्षिक (चंद्र तिथि अनुसार)");

    companion object {
        fun fromName(name: String?): RecurrenceType {
            return entries.firstOrNull { it.name.equals(name, ignoreCase = true) } ?: NONE
        }
    }
}
