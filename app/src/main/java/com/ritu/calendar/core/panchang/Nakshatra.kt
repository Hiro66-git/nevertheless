package com.ritu.calendar.core.panchang

data class NakshatraInfo(
    val index: Int,            // 1 to 27
    val name: String,
    val devanagari: String,
    val planetaryLord: String,
    val deity: String,
    val symbol: String,
    val qualities: String
)

object NakshatraDirectory {

    private val NAKSHATRAS = listOf(
        NakshatraInfo(1, "Ashwini", "अश्विनी", "Ketu", "Ashwini Kumaras (Divine Healers)", "Horse's Head", "Speed, healing, initiative, pioneering energy"),
        NakshatraInfo(2, "Bharani", "भरणी", "Venus", "Yama (God of Dharma & Justice)", "Yoni / Boat", "Transformation, restraint, determination, creativity"),
        NakshatraInfo(3, "Krittika", "कृत्तिका", "Sun", "Agni (God of Sacred Fire)", "Razor / Flame", "Purity, decisive action, sharpness, digestive power"),
        NakshatraInfo(4, "Rohini", "रोहिणी", "Moon", "Brahma / Prajapati", "Chariot / Temple Tree", "Nurturing, beauty, fertility, artistic elegance"),
        NakshatraInfo(5, "Mrigashirsha", "मृगशीर्षा", "Mars", "Soma (Moon God / Nectar)", "Deer's Head", "Curiosity, exploration, gentle quest for truth"),
        NakshatraInfo(6, "Ardra", "आर्द्रा", "Rahu", "Rudra (Storm & Transformation)", "Teardrop / Diamond", "Overcoming struggle, emotional cleansing, breakthrough"),
        NakshatraInfo(7, "Punarvasu", "पुनर्वसु", "Jupiter", "Aditi (Cosmic Mother)", "Bow and Quiver", "Renewal, return of light, benevolence, wisdom"),
        NakshatraInfo(8, "Pushya", "पुष्य", "Saturn", "Brihaspati (Guru of Gods)", "Cow's Udder / Lotus", "Most auspicious for all endeavors, nourishment, spiritual strength"),
        NakshatraInfo(9, "Ashlesha", "अश्लेषा", "Mercury", "Sarpas / Nagas (Serpent Wisdom)", "Coiled Serpent", "Intuition, mystical insight, protective vigilance"),
        NakshatraInfo(10, "Magha", "मघा", "Ketu", "Pitrs (Ancestral Spirits)", "Royal Throne Room", "Ancestral blessings, leadership, dignity, noble heritage"),
        NakshatraInfo(11, "Purva Phalguni", "पूर्व फाल्गुनी", "Venus", "Bhaga (God of Fortune & Delight)", "Hammock / Front Legs of Bed", "Joy, love, celebration, creative harvest"),
        NakshatraInfo(12, "Uttara Phalguni", "उत्तर फाल्गुनी", "Sun", "Aryaman (God of Friendship & Honor)", "Back Legs of Bed", "Loyalty, steadfast relationships, generous philanthropy"),
        NakshatraInfo(13, "Hasta", "हस्त", "Moon", "Savitr (Sun at Dawn)", "Open Hand / Fist", "Craftsmanship, skill, healing touch, precision"),
        NakshatraInfo(14, "Chitra", "चित्रा", "Mars", "Twashtar / Vishwakarma (Cosmic Architect)", "Bright Jewel / Pearl", "Architectural genius, aesthetic brilliance, artistry"),
        NakshatraInfo(15, "Swati", "स्वाति", "Rahu", "Vayu (Wind God)", "Coral / Sprout in Breeze", "Independence, flexibility, breathwork, trade"),
        NakshatraInfo(16, "Vishakha", "विशाखा", "Jupiter", "Indra & Agni (Power and Purpose)", "Triumphal Arch / Potter's Wheel", "Single-minded focus, triumph, devotion to goals"),
        NakshatraInfo(17, "Anuradha", "अनुराधा", "Saturn", "Mitra (God of Divine Friendship)", "Lotus Flower", "Devotion, harmony, enduring friendship, deep meditation"),
        NakshatraInfo(18, "Jyeshtha", "ज्येष्ठा", "Mercury", "Indra (King of Celestial Realm)", "Earring / Protective Amulet", "Elder wisdom, protection, courage in responsibility"),
        NakshatraInfo(19, "Mula", "मूल", "Ketu", "Nirriti (Goddess of Dissolution)", "Tied Roots", "Uncovering root causes, spiritual inquiry, fundamental truth"),
        NakshatraInfo(20, "Purva Ashadha", "पूर्वाषाढ़ा", "Venus", "Apas (Sacred Waters)", "Elephant Tusk / Fan", "Invincibility, purity of intention, emotional depth"),
        NakshatraInfo(21, "Uttara Ashadha", "उत्तराषाढ़ा", "Sun", "Vishwa Devas (Universal Virtues)", "Small Cot / Elephant Tusk", "Enduring victory, noble character, righteousness"),
        NakshatraInfo(22, "Shravana", "श्रवण", "Moon", "Vishnu (Cosmic Preserver)", "Three Footprints / Ear", "Sacred listening, oral tradition, scholarship, learning"),
        NakshatraInfo(23, "Dhanishta", "धनिष्ठा", "Mars", "Ashta Vasus (Eight Cosmic Elements)", "Drum (Mridangam) / Flute", "Rhythm, musical harmony, material prosperity, grace"),
        NakshatraInfo(24, "Shatabhisha", "शतभिषा", "Rahu", "Varuna (God of Cosmic Oceans)", "Empty Circle / 100 Physicians", "Healing, holistic wellness, mystery, cosmic rhythm"),
        NakshatraInfo(25, "Purva Bhadrapada", "पूर्वभाद्रपदा", "Jupiter", "Aja Ekapada (One-Footed Sun)", "Front of Funeral Cot / Sword", "Spiritual devotion, inner fire, deep philosophical inquiry"),
        NakshatraInfo(26, "Uttara Bhadrapada", "उत्तरभाद्रपदा", "Saturn", "Ahirbudhnya (Serpent of Deep Depths)", "Back of Funeral Cot / Twin", "Serenity, wisdom of stillness, compassionate patience"),
        NakshatraInfo(27, "Revati", "रेवती", "Mercury", "Pushan (Nourisher of Travelers)", "Fish / Pair of Fish", "Safe journeys, nourishment of beings, gentle transcendence")
    )

    fun getByIndex(index: Int): NakshatraInfo {
        val safeIndex = ((index - 1) % 27 + 27) % 27
        return NAKSHATRAS[safeIndex]
    }

    /**
     * Calculates Nakshatra from Nirayana (Sidereal) lunar longitude in degrees [0, 360).
     */
    fun fromSiderealLongitude(longitude: Double): NakshatraInfo {
        val normalized = AstronomicalUtils.normalizeDegrees(longitude)
        val span = 360.0 / 27.0 // 13.333333 degrees per nakshatra
        val index = (normalized / span).toInt() + 1
        return getByIndex(index)
    }
}
