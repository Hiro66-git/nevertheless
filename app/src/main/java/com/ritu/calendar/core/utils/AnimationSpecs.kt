package com.ritu.calendar.core.utils

import androidx.compose.animation.core.*
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

object AnimationSpecs {
    val defaultSpringSpec: SpringSpec<Float> = spring(
        dampingRatio = Spring.DampingRatioLowBouncy,
        stiffness = Spring.StiffnessLow
    )

    val gentleTweenSpec: TweenSpec<Float> = tween(
        durationMillis = 400,
        easing = FastOutSlowInEasing
    )

    val seasonalTransitionSpec: TweenSpec<Float> = tween(
        durationMillis = 700,
        easing = FastOutSlowInEasing
    )
}
