package com.ritu.calendar.core.designsystem.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Traditional Indian Toran / Temple Archway decorative divider.
 */
@Composable
fun IndianToranBorder(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFFFFB300),
    height: Dp = 16.dp,
    alpha: Float = 0.4f
) {
    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
    ) {
        val width = size.width
        val h = size.height
        val archCount = (width / 32.dp.toPx()).toInt().coerceAtLeast(4)
        val archWidth = width / archCount

        val path = Path()
        path.moveTo(0f, 0f)

        for (i in 0 until archCount) {
            val startX = i * archWidth
            val midX = startX + archWidth / 2f
            val endX = startX + archWidth
            val peakY = h * 0.85f

            path.lineTo(startX, 0f)
            path.quadraticBezierTo(midX, peakY, endX, 0f)

            // Small hanging teardrop/mango motif below each arch
            drawCircle(
                color = color.copy(alpha = alpha),
                radius = 2.dp.toPx(),
                center = Offset(midX, peakY + 2.dp.toPx())
            )
        }

        drawPath(
            path = path,
            color = color.copy(alpha = alpha),
            style = Stroke(width = 1.2.dp.toPx(), cap = StrokeCap.Round)
        )
    }
}

/**
 * Geometric Indian Jali lattice accent bar.
 */
@Composable
fun IndianJaliBar(
    modifier: Modifier = Modifier,
    color: Color = Color(0xFFD4AF37),
    height: Dp = 10.dp,
    alpha: Float = 0.35f
) {
    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
    ) {
        val width = size.width
        val h = size.height
        val diamondSize = 12.dp.toPx()
        val count = (width / diamondSize).toInt()

        for (i in 0 until count) {
            val cx = (i + 0.5f) * diamondSize
            val cy = h / 2f
            val path = Path().apply {
                moveTo(cx, cy - h / 2f + 1f)
                lineTo(cx + diamondSize / 2.5f, cy)
                lineTo(cx, cy + h / 2f - 1f)
                lineTo(cx - diamondSize / 2.5f, cy)
                close()
            }
            drawPath(
                path = path,
                color = color.copy(alpha = alpha),
                style = Stroke(width = 1.dp.toPx())
            )
        }
    }
}
