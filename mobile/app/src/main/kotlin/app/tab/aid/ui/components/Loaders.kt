package app.tab.aid.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.util.lerp
import app.tab.aid.ui.theme.LocalAceColors
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin

/*
 * Material 3 Expressive style loader and progress bar, drawn with core Compose
 * so they need no extra dependency. They are deliberately solid (not glass).
 */

private const val TWO_PI = 6.2831855f
private const val SAMPLES = 120

private fun sampleShape(radius: (Float) -> Float): FloatArray =
    FloatArray(SAMPLES) { radius(TWO_PI * it / SAMPLES) }

/** Regular n-gon radius at angle [t], blended toward a circle so corners are soft. */
private fun softPolygon(n: Int, t: Float, softness: Float): Float {
    val sector = TWO_PI / n
    val local = ((t % sector) + sector) % sector - sector / 2f
    val polygon = cos(Math.PI.toFloat() / n) / cos(local)
    return lerp(polygon, 1f, softness)
}

private val morphShapes: List<FloatArray> = listOf(
    sampleShape { softPolygon(5, it, 0.45f) },
    sampleShape {
        val c = abs(cos(it)).pow(4)
        val s = abs(sin(it)).pow(4)
        (c + s).pow(-0.25f) / 1.1892071f
    },
    sampleShape { 0.80f + 0.20f * cos(6f * it) },
    sampleShape { softPolygon(3, it, 0.55f) },
    sampleShape { 1f },
    sampleShape { 0.82f + 0.18f * cos(9f * it) },
)

/** A solid shape that continuously morphs between rounded shapes while rotating. */
@Composable
fun ShapeMorphLoader(
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    color: Color = LocalAceColors.current.content,
) {
    val count = morphShapes.size
    val transition = rememberInfiniteTransition(label = "ace-shape-morph")
    val position by transition.animateFloat(
        initialValue = 0f,
        targetValue = count.toFloat(),
        animationSpec = infiniteRepeatable(tween(count * 800, easing = LinearEasing), RepeatMode.Restart),
        label = "position",
    )
    val rotation by transition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(4200, easing = LinearEasing), RepeatMode.Restart),
        label = "rotation",
    )

    Canvas(
        modifier = modifier
            .size(size)
            .semantics { contentDescription = "Loading" },
    ) {
        val index = floor(position).toInt().coerceIn(0, count - 1)
        val fraction = position - floor(position)
        // Hold each shape briefly, then ease into the next one.
        val t = FastOutSlowInEasing.transform(((fraction - 0.3f) / 0.7f).coerceIn(0f, 1f))
        val from = morphShapes[index]
        val to = morphShapes[(index + 1) % count]
        val radius = this.size.minDimension / 2f * 0.9f
        val cx = this.size.width / 2f
        val cy = this.size.height / 2f

        val path = Path()
        for (k in 0 until SAMPLES) {
            val angle = TWO_PI * k / SAMPLES
            val r = lerp(from[k], to[k], t) * radius
            val x = cx + r * cos(angle)
            val y = cy + r * sin(angle)
            if (k == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        path.close()

        rotate(degrees = rotation, pivot = Offset(cx, cy)) {
            drawPath(path = path, color = color)
        }
    }
}

/**
 * Wavy linear progress bar. Pass [progress] (0..1) for determinate, or leave it
 * null for an indeterminate sweep.
 */
@Composable
fun WavyProgressBar(
    modifier: Modifier = Modifier,
    progress: Float? = null,
    color: Color = LocalAceColors.current.content,
    trackColor: Color = color.copy(alpha = 0.22f),
) {
    val transition = rememberInfiniteTransition(label = "ace-wavy")
    val phase by transition.animateFloat(
        initialValue = 0f,
        targetValue = TWO_PI,
        animationSpec = infiniteRepeatable(tween(1400, easing = LinearEasing), RepeatMode.Restart),
        label = "phase",
    )
    val sweep by transition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1800, easing = LinearEasing), RepeatMode.Restart),
        label = "sweep",
    )

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .height(14.dp)
            .semantics { contentDescription = "Loading" },
    ) {
        val strokePx = 4.dp.toPx()
        val amplitude = 3.dp.toPx()
        val wavelength = 24.dp.toPx()
        val cy = size.height / 2f
        val startX = strokePx / 2f
        val endX = size.width - strokePx / 2f
        val span = max(endX - startX, 0f)

        val from: Float
        val to: Float
        if (progress != null) {
            from = startX
            to = startX + span * progress.coerceIn(0f, 1f)
        } else {
            val window = span * 0.4f
            val head = startX + (span + window) * sweep - window
            from = max(head, startX)
            to = min(head + window, endX)
        }

        drawLine(
            color = trackColor,
            start = Offset(startX, cy),
            end = Offset(endX, cy),
            strokeWidth = strokePx,
            cap = StrokeCap.Round,
        )

        if (to - from > 0.5f) {
            fun waveY(x: Float): Float = cy + amplitude * sin((x - startX) / wavelength * TWO_PI - phase)
            val path = Path()
            var x = from
            path.moveTo(x, waveY(x))
            while (x < to) {
                x = min(x + 3f, to)
                path.lineTo(x, waveY(x))
            }
            drawPath(
                path = path,
                color = color,
                style = Stroke(width = strokePx, cap = StrokeCap.Round, join = StrokeJoin.Round),
            )
        }
    }
}
