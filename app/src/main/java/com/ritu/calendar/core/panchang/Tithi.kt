package com.ritu.calendar.core.panchang

enum class Paksha(val devanagari: String, val english: String) {
    SHUKLA("शुक्ल पक्ष", "Shukla Paksha (Waxing Phase)"),
    KRISHNA("कृष्ण पक्ष", "Krishna Paksha (Waning Phase)")
}

data class TithiInfo(
    val index: Int,            // 1 to 30
    val name: String,
    val devanagari: String,
    val paksha: Paksha,
    val deity: String,
    val nature: String,        // Nanda, Bhadra, Jaya, Rikta, Poorna
    val significance: String
)

object TithiDirectory {

    private val TITHI_NAMES = listOf(
        "Pratipada" to "प्रतिपदा",
        "Dwitiya" to "द्वितीया",
        "Tritiya" to "तृतीया",
        "Chaturthi" to "चतुर्थी",
        "Panchami" to "पञ्चमी",
        "Shashthi" to "षष्ठी",
        "Saptami" to "सप्तमी",
        "Ashtami" to "अष्टमी",
        "Navami" to "नवमी",
        "Dashami" to "दशमी",
        "Ekadashi" to "एकादशी",
        "Dwadashi" to "द्वादशी",
        "Trayodashi" to "त्रयोदशी",
        "Chaturdashi" to "चतुर्दशी",
        "Purnima" to "पूर्णिमा"
    )

    private val NATURES = listOf(
        "Nanda (Prosperity)",
        "Bhadra (Fortunate)",
        "Jaya (Victory)",
        "Rikta (Void/Spiritual)",
        "Poorna (Completeness)"
    )

    private val DEITIES = listOf(
        "Agni (Fire)",
        "Brahma (Creator)",
        "Gauri (Divine Mother)",
        "Ganesha (Obstacle Remover)",
        "Nagas (Serpent Guardians)",
        "Kartikeya (Commander)",
        "Surya (Sun God)",
        "Rudra / Shiva (Transformer)",
        "Durga (Protection)",
        "Yama / Dharmaraja (Truth)",
        "Vishnu (Preserver)",
        "Vishnu / Hari (Grace)",
        "Kamadeva (Love & Harmony)",
        "Shiva (Auspiciousness)",
        "Chandra / Soma (Moon)"
    )

    fun getTithi(index: Int): TithiInfo {
        val safeIndex = ((index - 1) % 30) + 1
        val isShukla = safeIndex <= 15
        val paksha = if (isShukla) Paksha.SHUKLA else Paksha.KRISHNA
        val dayInPaksha = if (isShukla) safeIndex else safeIndex - 15

        val namePair = if (!isShukla && dayInPaksha == 15) {
            "Amavasya" to "अमावस्या"
        } else {
            TITHI_NAMES[dayInPaksha - 1]
        }

        val natureIndex = (dayInPaksha - 1) % 5
        val deity = if (!isShukla && dayInPaksha == 15) "Pitrs (Ancestors)" else DEITIES[dayInPaksha - 1]
        val nature = NATURES[natureIndex]

        val significance = when {
            dayInPaksha == 11 -> "Sacred fasting day dedicated to Bhagavan Vishnu; ideal for meditation and spiritual purification."
            dayInPaksha == 13 -> "Pradosha Vrat; auspicious for evening prayers and seeking peace and inner clarity."
            dayInPaksha == 15 && isShukla -> "Full Moon (Satyanarayana Puja); time of heightened mental clarity, gratitude, and devotion."
            dayInPaksha == 15 && !isShukla -> "New Moon (Darsha Amavasya); day for honoring ancestors (Shraddha) and internal introspection."
            dayInPaksha == 4 -> "Sankashti / Vinayaka Chaturthi; dedicated to Lord Ganesha for wisdom and removing obstacles."
            else -> "Auspicious for positive endeavors, mindful living, and daily dharma."
        }

        return TithiInfo(
            index = safeIndex,
            name = "${paksha.english.substringBefore(" ")} ${namePair.first}",
            devanagari = "${paksha.devanagari} ${namePair.second}",
            paksha = paksha,
            deity = deity,
            nature = nature,
            significance = significance
        )
    }

    /**
     * Calculates Tithi from lunar elongation angle in degrees [0, 360).
     */
    fun fromElongation(elongationDegrees: Double): TithiInfo {
        val normalized = AstronomicalUtils.normalizeDegrees(elongationDegrees)
        val index = (normalized / 12.0).toInt() + 1
        return getTithi(index)
    }
}
