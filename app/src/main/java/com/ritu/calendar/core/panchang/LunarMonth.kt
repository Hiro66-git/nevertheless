package com.ritu.calendar.core.panchang

enum class LunarMonth(
    val devanagari: String,
    val sanskrit: String,
    val rashiEquivalent: String,
    val gregorianApprox: String
) {
    CHAITRA("चैत्र", "Chaitra", "Mesha (Aries)", "March - April"),
    VAISHAKHA("वैशाख", "Vaishakha", "Vrishabha (Taurus)", "April - May"),
    JYESHTHA("ज्येष्ठ", "Jyeshtha", "Mithuna (Gemini)", "May - June"),
    ASHADHA("आषाढ़", "Ashadha", "Karka (Cancer)", "June - July"),
    SHRAVANA("श्रावण", "Shravana", "Simha (Leo)", "July - August"),
    BHADRAPADA("भाद्रपद", "Bhadrapada", "Kanya (Virgo)", "August - September"),
    ASHVINA("आश्विन", "Ashvina", "Tula (Libra)", "September - October"),
    KARTIKA("कार्तिक", "Kartika", "Vrishchika (Scorpio)", "October - November"),
    MARGASHIRSHA("मार्गशीर्ष", "Margashirsha", "Dhanu (Sagittarius)", "November - December"),
    PAUSHA("पौष", "Pausha", "Makara (Capricorn)", "December - January"),
    MAGHA("माघ", "Magha", "Kumbha (Aquarius)", "January - February"),
    PHALGUNA("फाल्गुन", "Phalguna", "Meena (Pisces)", "February - March");

    companion object {
        fun fromSolarLongitude(siderealSolarLong: Double): LunarMonth {
            val normalized = AstronomicalUtils.normalizeDegrees(siderealSolarLong)
            val index = (normalized / 30.0).toInt() % 12
            return entries[index]
        }
    }
}
