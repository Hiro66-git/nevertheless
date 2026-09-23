package com.ritu.calendar.core.designsystem.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.ritu.calendar.core.panchang.RituSeason

/**
 * Ambient background container that applies subtle seasonal gradient tinting
 * without overwhelming readability or content contrast.
 */
@Composable
fun SeasonalBackground(
    season: RituSeason,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    val baseBackground = MaterialTheme.colorScheme.background
    val seasonColor = season.primaryColor

    val gradient = Brush.verticalGradient(
        colors = listOf(
            seasonColor.copy(alpha = 0.07f),
            baseBackground,
            baseBackground
        )
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(baseBackground)
            .background(gradient)
    ) {
        content()
    }
}
