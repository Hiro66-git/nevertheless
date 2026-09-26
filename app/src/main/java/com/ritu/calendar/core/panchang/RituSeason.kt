package com.ritu.calendar.core.panchang

import androidx.compose.ui.graphics.Color

enum class RituSeason(
    val devanagari: String,
    val sanskrit: String,
    val englishName: String,
    val monthsPeriod: String,
    val lunarMonths: List<LunarMonth>,
    val shloka: String,
    val description: String,
    val climate: String,
    val ayurvedicDosha: String,
    val primaryColorHex: Long,
    val secondaryColorHex: Long,
    val accentColorHex: Long,
    val naturalMotif: String
) {
    VASANTA(
        devanagari = "वसन्त",
        sanskrit = "Vasanta",
        englishName = "Spring",
        monthsPeriod = "Mid-March to Mid-May",
        lunarMonths = listOf(LunarMonth.CHAITRA, LunarMonth.VAISHAKHA),
        shloka = "द्रुमाः सपुष्पाः सलिलं सपद्मं स्त्रियः सकामाः पवनः सुगन्धिः।",
        description = "Season of blooming Palash, mango blossoms, cuckoo song, new life, Rongali Bihu, Holi, and Vedic New Year.",
        climate = "Pleasant warmth, fragrant breezes, flowering trees",
        ayurvedicDosha = "Kapha Pacification; lighter foods recommended",
        primaryColorHex = 0xFFFF7A00,
        secondaryColorHex = 0xFFFFD54F,
        accentColorHex = 0xFF43A047,
        naturalMotif = "Mango blossoms & Kopou orchid (Assam)"
    ),
    GRISHMA(
        devanagari = "ग्रीष्म",
        sanskrit = "Grishma",
        englishName = "Summer",
        monthsPeriod = "Mid-May to Mid-July",
        lunarMonths = listOf(LunarMonth.JYESHTHA, LunarMonth.ASHADHA),
        shloka = "प्रचण्डसूर्यः स्पृहणीयचन्द्रमाः सदानवगाह्यक्षतवारिसञ्चयः।",
        description = "Intense golden sun, ripening fruits, moonlit night breezes, Ambubachi Mela, and waiting for welcoming rains.",
        climate = "Bright radiance, dry heat, thirst for monsoon",
        ayurvedicDosha = "Pitta Accumulation; cooling sandalwood and melons",
        primaryColorHex = 0xFFFFA000,
        secondaryColorHex = 0xFFFFE082,
        accentColorHex = 0xFFD84315,
        naturalMotif = "Golden Sun & Gulmohar blossom"
    ),
    VARSHA(
        devanagari = "वर्षा",
        sanskrit = "Varsha",
        englishName = "Monsoon",
        monthsPeriod = "Mid-July to Mid-September",
        lunarMonths = listOf(LunarMonth.SHRAVANA, LunarMonth.BHADRAPADA),
        shloka = "सशीकराम्भोधरमन्दमारुतः करोति चित्तं प्रसभं प्रहर्षितम्।",
        description = "Rejuvenating thunderclouds, peacock dances, green paddy fields, Shravan Somwar, Janmashtami, and Raksha Bandhan.",
        climate = "Lush rains, earthy petrichor, overflowing rivers",
        ayurvedicDosha = "Vata Aggravation; warm nourishing dishes",
        primaryColorHex = 0xFF00796B,
        secondaryColorHex = 0xFF80CBC4,
        accentColorHex = 0xFF00ACC1,
        naturalMotif = "Dancing Peacock & Lotus in Rain"
    ),
    SHARAD(
        devanagari = "शरद्",
        sanskrit = "Sharad",
        englishName = "Autumn",
        monthsPeriod = "Mid-September to Mid-November",
        lunarMonths = listOf(LunarMonth.ASHVINA, LunarMonth.KARTIKA),
        shloka = "काशांशुका विकचपद्ममनोज्ञवक्त्रा सोन्मादहंसरवनूपुरनादरम्या।",
        description = "Crystal clear azure skies, blooming Kash flowers, Durga Puja, Navratri, Sharad Purnima, Kongali Bihu, and Diwali.",
        climate = "Crisp clarity, mild days, silvery full moon nights",
        ayurvedicDosha = "Pitta Pacification; sweet and ghee-rich treats",
        primaryColorHex = 0xFFC84B31,
        secondaryColorHex = 0xFFFFCC80,
        accentColorHex = 0xFF7B1FA2,
        naturalMotif = "Kash grass & Silver Full Moon"
    ),
    HEMANTA(
        devanagari = "हेमन्त",
        sanskrit = "Hemanta",
        englishName = "Pre-Winter",
        monthsPeriod = "Mid-November to Mid-January",
        lunarMonths = listOf(LunarMonth.MARGASHIRSHA, LunarMonth.PAUSHA),
        shloka = "मनोज्ञगन्धाः प्रियकामिनीनां विमुच्य वस्त्राण्यरुणारुणाभैः।",
        description = "Morning golden mist, ripe golden paddy harvests, Gita Jayanti, Hornbill festival, and preparation for winter solstice.",
        climate = "Cool morning mist, dew drops, pleasant afternoon sun",
        ayurvedicDosha = "Agni (Digestive Fire) Strong; wholesome grains and sesame",
        primaryColorHex = 0xFFE5A93C,
        secondaryColorHex = 0xFFFFE082,
        accentColorHex = 0xFF5D4037,
        naturalMotif = "Golden Harvest Rice stalk & Morning Dew"
    ),
    SHISHIRA(
        devanagari = "शिशिर",
        sanskrit = "Shishira",
        englishName = "Winter / Deep Cool",
        monthsPeriod = "Mid-January to Mid-March",
        lunarMonths = listOf(LunarMonth.MAGHA, LunarMonth.PHALGUNA),
        shloka = "निरुद्धवातायनमन्दिरोदरं हुताशनो भानुमतो गभस्तयः।",
        description = "Crisp invigorating chill, Bhogali/Magh Bihu bonfires (Meji), Makar Sankranti kites, Pongal, Lohri, and Maha Shivratri.",
        climate = "Chilly nights, warm firesides, sweet jaggery & sesame",
        ayurvedicDosha = "Kapha Building; warming spices, ginger and til",
        primaryColorHex = 0xFF3949AB,
        secondaryColorHex = 0xFF9FA8DA,
        accentColorHex = 0xFFE65100,
        naturalMotif = "Meji Bonfire & Mustard flower field"
    );

    val primaryColor: Color get() = Color(primaryColorHex)
    val secondaryColor: Color get() = Color(secondaryColorHex)
    val accentColor: Color get() = Color(accentColorHex)

    companion object {
        fun fromLunarMonth(month: LunarMonth): RituSeason {
            return entries.firstOrNull { it.lunarMonths.contains(month) } ?: VASANTA
        }

        fun fromGregorianMonth(month: Int): RituSeason {
            return when (month) {
                3, 4 -> VASANTA
                5, 6 -> GRISHMA
                7, 8 -> VARSHA
                9, 10 -> SHARAD
                11, 12 -> HEMANTA
                1, 2 -> SHISHIRA
                else -> VASANTA
            }
        }
    }
}
