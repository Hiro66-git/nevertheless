package com.ritu.calendar.core.designsystem.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.cos
import kotlin.math.sin

/**
 * Procedural Indian Sacred Mandala / Kolam drawing component.
 * Renders 100% vector-sharp geometric art dynamically in Jetpack Compose Canvas.
 */
@Composable
fun IndianMandalaCanvas(
    modifier: Modifier = Modifier,
    size: Dp = 120.dp,
    petalCount: Int = 8,
    primaryColor: Color = Color(0xFFFFB300),
    secondaryColor: Color = Color(0xFFFF7A00),
    alpha: Float = 0.25f
) {
    Canvas(modifier = modifier.size(size)) {
        val center = Offset(this.size.width / 2f, this.size.height / 2f)
        val maxRadius = minOf(this.size.width, this.size.height) / 2f * 0.9f

        // Center lotus bindu
        drawCircle(
            color = primaryColor.copy(alpha = alpha * 1.2f),
            radius = maxRadius * 0.12f,
            center = center
        )

        // Concentric geometric rings
        drawCircle(
            color = secondaryColor.copy(alpha = alpha),
            radius = maxRadius * 0.35f,
            center = center,
            style = Stroke(width = 1.5.dp.toPx())
        )
        drawCircle(
            color = primaryColor.copy(alpha = alpha * 0.8f),
            radius = maxRadius * 0.65f,
            center = center,
            style = Stroke(width = 1.2.dp.toPx())
        )
        drawCircle(
            color = secondaryColor.copy(alpha = alpha * 0.6f),
            radius = maxRadius * 0.95f,
            center = center,
            style = Stroke(width = 1.5.dp.toPx())
        )

        // Inner Petals (8-fold / 12-fold symmetry)
        val innerPetalRadius = maxRadius * 0.45f
        val angleStep = (2.0 * Math.PI / petalCount).toFloat()

        for (i in 0 until petalCount) {
            val angle = i * angleStep
            val tipX = center.x + innerPetalRadius * cos(angle)
            val tipY = center.y + innerPetalRadius * sin(angle)

            val leftAngle = angle - angleStep / 2.5f
            val rightAngle = angle + angleStep / 2.5f
            val baseRadius = maxRadius * 0.15f
            val leftX = center.x + baseRadius * cos(leftAngle)
            val leftY = center.y + baseRadius * sin(leftAngle)
            val rightX = center.x + baseRadius * cos(rightAngle)
            val rightY = center.y + baseRadius * sin(rightAngle)

            val petalPath = Path().apply {
                moveTo(leftX, leftY)
                quadraticBezierTo(
                    center.x + (innerPetalRadius * 0.8f) * cos(angle - 0.2f),
                    center.y + (innerPetalRadius * 0.8f) * sin(angle - 0.2f),
                    tipX, tipY
                )
                quadraticBezierTo(
                    center.x + (innerPetalRadius * 0.8f) * cos(angle + 0.2f),
                    center.y + (innerPetalRadius * 0.8f) * sin(angle + 0.2f),
                    rightX, rightY
                )
            }
            drawPath(
                path = petalPath,
                color = primaryColor.copy(alpha = alpha),
                style = Stroke(width = 1.2.dp.toPx(), cap = StrokeCap.Round)
            )

            // Outer decorative lotus rays
            val outerTipX = center.x + maxRadius * cos(angle)
            val outerTipY = center.y + maxRadius * sin(angle)
            drawLine(
                color = secondaryColor.copy(alpha = alpha * 0.9f),
                start = Offset(tipX, tipY),
                end = Offset(outerTipX, outerTipY),
                strokeWidth = 1.2.dp.toPx()
            )

            // Small accent dots at outer nodes
            drawCircle(
                color = primaryColor.copy(alpha = alpha * 1.5f),
                radius = 2.dp.toPx(),
                center = Offset(outerTipX, outerTipY)
            )
        }
    }
}
