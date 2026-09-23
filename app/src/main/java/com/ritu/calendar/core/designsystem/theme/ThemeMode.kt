package com.ritu.calendar.core.designsystem.theme

enum class ThemeMode(
    val title: String,
    val description: String,
    val iconName: String
) {
    LIGHT(
        title = "Sandalwood Dawn",
        description = "Warm ivory, aged sandalwood, and subtle saffron accents.",
        iconName = "wb_sunny"
    ),
    DARK(
        title = "Midnight Starlight",
        description = "Deep slate obsidian, gentle starlight glows, and moonlit tones.",
        iconName = "nights_stay"
    ),
    INDIAN_HERITAGE(
        title = "Indian Heritage",
        description = "Rich terracotta, ancient temple bronze, turmeric ochre, and sacred gold.",
        iconName = "temple_hindu"
    ),
    MINIMAL(
        title = "Minimalist Slate",
        description = "Clean modern monochrome with purposeful accents and high readability.",
        iconName = "contrast"
    ),
    FESTIVAL_MODE(
        title = "Festival Mode",
        description = "Vibrant celebratory hues with royal purple, radiant amber, and peacock teal.",
        iconName = "celebration"
    );

    companion object {
        fun fromName(name: String?): ThemeMode {
            return entries.firstOrNull { it.name.equals(name, ignoreCase = true) } ?: LIGHT
        }
    }
}
