package com.ritu.calendar.core.designsystem.theme

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import com.ritu.calendar.core.panchang.RituSeason

private val LightColorScheme = lightColorScheme(
    primary = SaffronPrimary,
    onPrimary = Color.White,
    primaryContainer = SaffronContainer,
    onPrimaryContainer = SaffronDark,
    secondary = PeacockTeal,
    onSecondary = Color.White,
    secondaryContainer = PeacockTealLight.copy(alpha = 0.2f),
    onSecondaryContainer = PeacockTeal,
    tertiary = TempleGold,
    onTertiary = Color.Black,
    background = SandalwoodBackground,
    onBackground = SandalwoodTextPrimary,
    surface = SandalwoodSurface,
    onSurface = SandalwoodTextPrimary,
    surfaceVariant = SandalwoodSurfaceVariant,
    onSurfaceVariant = SandalwoodTextSecondary,
    outline = SandalwoodBorder
)

private val DarkColorScheme = darkColorScheme(
    primary = SaffronLight,
    onPrimary = Color.Black,
    primaryContainer = SaffronContainerDark,
    onPrimaryContainer = SaffronLight,
    secondary = PeacockTealLight,
    onSecondary = Color.Black,
    secondaryContainer = PeacockTeal.copy(alpha = 0.3f),
    onSecondaryContainer = PeacockTealLight,
    tertiary = TempleGoldLight,
    onTertiary = Color.Black,
    background = MidnightBackground,
    onBackground = MidnightTextPrimary,
    surface = MidnightSurface,
    onSurface = MidnightTextPrimary,
    surfaceVariant = MidnightSurfaceVariant,
    onSurfaceVariant = MidnightTextSecondary,
    outline = MidnightBorder
)

private val HeritageColorScheme = darkColorScheme(
    primary = HeritagePrimary,
    onPrimary = Color.Black,
    primaryContainer = HeritageSurfaceVariant,
    onPrimaryContainer = HeritageSecondary,
    secondary = HeritageSecondary,
    onSecondary = Color.Black,
    secondaryContainer = Color(0xFF4A3423),
    onSecondaryContainer = HeritageSecondary,
    tertiary = DeepTerracotta,
    onTertiary = Color.White,
    background = HeritageBackground,
    onBackground = HeritageTextPrimary,
    surface = HeritageSurface,
    onSurface = HeritageTextPrimary,
    surfaceVariant = HeritageSurfaceVariant,
    onSurfaceVariant = HeritageTextSecondary,
    outline = HeritageBorder
)

private val MinimalColorScheme = lightColorScheme(
    primary = Color(0xFF212121),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFEEEEEE),
    onPrimaryContainer = Color(0xFF212121),
    secondary = Color(0xFF616161),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE0E0E0),
    onSecondaryContainer = Color(0xFF212121),
    tertiary = Color(0xFF424242),
    onTertiary = Color.White,
    background = MinimalBackground,
    onBackground = MinimalTextPrimary,
    surface = MinimalSurface,
    onSurface = MinimalTextPrimary,
    surfaceVariant = MinimalSurfaceVariant,
    onSurfaceVariant = MinimalTextSecondary,
    outline = MinimalBorder
)

private val FestivalColorScheme = darkColorScheme(
    primary = FestivalPrimary,
    onPrimary = Color.Black,
    primaryContainer = FestivalSurfaceVariant,
    onPrimaryContainer = FestivalPrimary,
    secondary = FestivalSecondary,
    onSecondary = Color.Black,
    secondaryContainer = Color(0xFF38235C),
    onSecondaryContainer = FestivalSecondary,
    tertiary = FestivalAccent,
    onTertiary = Color.White,
    background = FestivalBackground,
    onBackground = FestivalTextPrimary,
    surface = FestivalSurface,
    onSurface = FestivalTextPrimary,
    surfaceVariant = FestivalSurfaceVariant,
    onSurfaceVariant = FestivalTextSecondary,
    outline = FestivalBorder
)

data class RituSeasonColors(
    val primarySeasonColor: Color,
    val secondarySeasonColor: Color,
    val accentSeasonColor: Color
)

val LocalSeasonColors = staticCompositionLocalOf {
    RituSeasonColors(
        primarySeasonColor = SaffronPrimary,
        secondarySeasonColor = TempleGold,
        accentSeasonColor = PeacockTeal
    )
}

@Composable
fun RituTheme(
    themeMode: ThemeMode = ThemeMode.LIGHT,
    currentSeason: RituSeason? = null,
    content: @Composable () -> Unit
) {
    val colorScheme = when (themeMode) {
        ThemeMode.LIGHT -> LightColorScheme
        ThemeMode.DARK -> DarkColorScheme
        ThemeMode.INDIAN_HERITAGE -> HeritageColorScheme
        ThemeMode.MINIMAL -> MinimalColorScheme
        ThemeMode.FESTIVAL_MODE -> FestivalColorScheme
    }

    val seasonPrimary = currentSeason?.primaryColor ?: SaffronPrimary
    val seasonSecondary = currentSeason?.secondaryColor ?: TempleGold
    val seasonAccent = currentSeason?.accentColor ?: PeacockTeal

    val animatedSeasonPrimary = animateColorAsState(
        targetValue = seasonPrimary,
        animationSpec = tween(durationMillis = 600),
        label = "SeasonPrimaryColor"
    ).value

    val animatedSeasonSecondary = animateColorAsState(
        targetValue = seasonSecondary,
        animationSpec = tween(durationMillis = 600),
        label = "SeasonSecondaryColor"
    ).value

    val animatedSeasonAccent = animateColorAsState(
        targetValue = seasonAccent,
        animationSpec = tween(durationMillis = 600),
        label = "SeasonAccentColor"
    ).value

    val seasonColors = RituSeasonColors(
        primarySeasonColor = animatedSeasonPrimary,
        secondarySeasonColor = animatedSeasonSecondary,
        accentSeasonColor = animatedSeasonAccent
    )

    CompositionLocalProvider(
        LocalSeasonColors provides seasonColors
    ) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = RituTypography,
            shapes = RituShapes,
            content = content
        )
    }
}
