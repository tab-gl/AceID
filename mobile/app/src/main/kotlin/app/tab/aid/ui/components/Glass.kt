package app.tab.aid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.unit.dp
import app.tab.aid.ui.theme.LocalAceColors

/** Default corner radius for glass surfaces. */
val GlassShape: Shape = RoundedCornerShape(22.dp)

/**
 * Liquid-glass surface: a translucent vertical fill, a specular rim that is
 * brightest at the top-left and bottom-right edges, and a rounded clip. It stays
 * neutral (white/ink only) so the monochrome Ace ID palette is unchanged.
 * Pair it with [GlassBackdrop] so there is something behind the glass to catch.
 */
@Composable
fun Modifier.glass(shape: Shape = GlassShape): Modifier {
    val colors = LocalAceColors.current
    val light = colors.background.luminance() > 0.5f
    val fill = Brush.verticalGradient(
        listOf(
            Color.White.copy(alpha = if (light) 0.78f else 0.14f),
            Color.White.copy(alpha = if (light) 0.46f else 0.05f),
        ),
    )
    val rim = Brush.linearGradient(
        listOf(
            Color.White.copy(alpha = if (light) 0.95f else 0.38f),
            colors.content.copy(alpha = if (light) 0.10f else 0.06f),
            Color.White.copy(alpha = if (light) 0.55f else 0.16f),
        ),
    )
    return this
        .clip(shape)
        .background(fill, shape)
        .border(1.dp, rim, shape)
}

/**
 * Soft monochrome light pools drawn behind the whole app so glass surfaces have
 * depth to sit on. Draws only grayscale gradients (no accent colour).
 */
@Composable
fun GlassBackdrop(modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    val colors = LocalAceColors.current
    val light = colors.background.luminance() > 0.5f
    val pool = if (light) Color.Black else Color.White
    val strength = if (light) 0.09f else 0.13f
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(colors.background)
            .drawBehind {
                val w = size.width
                val h = size.height
                val a = Offset(w * 0.12f, h * 0.10f)
                val b = Offset(w * 0.95f, h * 0.55f)
                val c = Offset(w * 0.20f, h * 0.95f)
                drawCircle(
                    brush = Brush.radialGradient(listOf(pool.copy(alpha = strength), Color.Transparent), center = a, radius = w * 0.80f),
                    radius = w * 0.80f,
                    center = a,
                )
                drawCircle(
                    brush = Brush.radialGradient(listOf(pool.copy(alpha = strength * 0.8f), Color.Transparent), center = b, radius = w * 0.70f),
                    radius = w * 0.70f,
                    center = b,
                )
                drawCircle(
                    brush = Brush.radialGradient(listOf(pool.copy(alpha = strength * 0.6f), Color.Transparent), center = c, radius = w * 0.65f),
                    radius = w * 0.65f,
                    center = c,
                )
            },
    ) {
        content()
    }
}
