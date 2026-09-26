package com.ritu.calendar.core.designsystem.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.cos
import kotlin.math.sin

/**
 * Realistic Moon Phase visualizer with shadow curve, lunar craters, and golden aura.
 */
@Composable
fun MoonPhaseVisual(
    moonElongation: Double, // 0 to 360 degrees
    illuminationPct: Int,   // 0 to 100
    modifier: Modifier = Modifier,
    size: Dp = 56.dp,
    showLabel: Boolean = false,
    phaseName: String = ""
) {
    val animatedIllumination by animateFloatAsState(
        targetValue = illuminationPct / 100f,
        animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        label = "MoonIllumination"
    )

    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier.size(size),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(this.size.width / 2f, this.size.height / 2f)
                val radius = this.size.width / 2f * 0.85f

                // Outer Lunar Glow Aura
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Color(0xFFFFE082).copy(alpha = 0.35f * animatedIllumination),
                            Color.Transparent
                        ),
                        center = center,
                        radius = radius * 1.35f
                    ),
                    radius = radius * 1.35f,
                    center = center
                )

                // Dark side of the moon base (Shadow disc)
                drawCircle(
                    color = Color(0xFF1E222B),
                    radius = radius,
                    center = center
                )

                // Moon Disc Clip
                val moonPath = Path().apply {
                    addOval(Rect(center.x - radius, center.y - radius, center.x + radius, center.y + radius))
                }

                clipPath(moonPath) {
                    // Lit surface with subtle lunar texture
                    val isWaxing = moonElongation in 0.0..180.0
                    val k = animatedIllumination // 0.0 (New) to 1.0 (Full)

                    // Draw illuminated portion
                    val litPath = Path()
                    if (isWaxing) {
                        // Waxing: Lit on the right side
                        val terminatorWidth = radius * (1f - 2f * k).coerceIn(-1f, 1f)
                        litPath.moveTo(center.x, center.y - radius)
                        litPath.arcTo(
                            Rect(center.x - radius, center.y - radius, center.x + radius, center.y + radius),
                            -90f,
                            180f,
                            false
                        )
                        litPath.cubicTo(
                            center.x + terminatorWidth, center.y + radius * 0.55f,
                            center.x + terminatorWidth, center.y - radius * 0.55f,
                            center.x, center.y - radius
                        )
                        litPath.close()
                    } else {
                        // Waning: Lit on the left side
                        val terminatorWidth = radius * (2f * k - 1f).coerceIn(-1f, 1f)
                        litPath.moveTo(center.x, center.y - radius)
                        litPath.arcTo(
                            Rect(center.x - radius, center.y - radius, center.x + radius, center.y + radius),
                            90f,
                            180f,
                            false
                        )
                        litPath.cubicTo(
                            center.x + terminatorWidth, center.y - radius * 0.55f,
                            center.x + terminatorWidth, center.y + radius * 0.55f,
                            center.x, center.y - radius
                        )
                        litPath.close()
                    }

                    // Fill lit area with glowing lunar cream color
                    drawPath(
                        path = litPath,
                        brush = Brush.linearGradient(
                            colors = listOf(
                                Color(0xFFFFFDE7),
                                Color(0xFFFFE082),
                                Color(0xFFFFD54F)
                            ),
                            start = Offset(center.x - radius, center.y - radius),
                            end = Offset(center.x + radius, center.y + radius)
                        )
                    )

                    // Moon craters / maria surface accents (subtle)
                    drawCircle(
                        color = Color(0xFFD4AF37).copy(alpha = 0.18f),
                        radius = radius * 0.2f,
                        center = Offset(center.x + radius * 0.25f, center.y - radius * 0.2f)
                    )
                    drawCircle(
                        color = Color(0xFFBCAAA4).copy(alpha = 0.15f),
                        radius = radius * 0.15f,
                        center = Offset(center.x - radius * 0.3f, center.y + radius * 0.15f)
                    )
                }

                // Fine outer golden rim
                drawCircle(
                    color = Color(0xFFD4AF37).copy(alpha = 0.4f),
                    radius = radius,
                    center = center,
                    style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.dp.toPx())
                )
            }
        }

        if (showLabel) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "$illuminationPct%",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            if (phaseName.isNotEmpty()) {
                Text(
                    text = phaseName,
                    style = MaterialTheme.typography.bodySmall,
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
