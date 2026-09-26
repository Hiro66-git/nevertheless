package com.ritu.calendar.data.festival

enum class FestivalCategory(val displayName: String, val devanagari: String) {
    ALL("All Categories", "सभी श्रेणियां"),
    MAJOR_FESTIVAL("Major Festival", "महापर्व"),
    HARVEST_AGRICULTURAL("Harvest & Agro", "कृषि एवं फसल"),
    DEVOTIONAL_VRAT("Devotion & Vrat", "भक्ति एवं व्रत"),
    SEASONAL_RITU("Seasonal / Ritu", "ऋतु उत्सव"),
    NEW_YEAR("New Year", "नव वर्ष"),
    NATIONAL_COMMEMORATIVE("National Day", "राष्ट्रीय दिवस"),
    FOLK_CULTURAL("Folk & Cultural", "लोक एवं संस्कृति")
}
