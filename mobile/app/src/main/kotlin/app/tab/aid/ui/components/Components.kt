package app.tab.aid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.graphics.vector.PathBuilder
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import app.tab.aid.ui.theme.LocalAceColors

/** The Ace ID wordmark: a square ink mark and the product name. */
@Composable
fun Brand(modifier: Modifier = Modifier) {
    val colors = LocalAceColors.current
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .background(colors.content)
                .border(1.dp, colors.content),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "A",
                fontFamily = FontFamily.Serif,
                fontSize = MaterialTheme.typography.titleLarge.fontSize,
                color = colors.background,
            )
        }
        Spacer(Modifier.width(10.dp))
        Text(
            text = "Ace ID",
            style = MaterialTheme.typography.titleLarge,
            color = colors.content,
        )
    }
}

@Composable
fun SectionHeading(title: String, count: Int? = null) {
    val colors = LocalAceColors.current
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = colors.content)
        if (count != null) {
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.labelSmall,
                color = colors.muted,
            )
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    val colors = LocalAceColors.current
    Column {
        Text(
            text = label.uppercase(java.util.Locale.ROOT),
            style = MaterialTheme.typography.labelSmall,
            color = colors.muted,
        )
        Spacer(Modifier.height(3.dp))
        Text(value, style = MaterialTheme.typography.bodyMedium, color = colors.content)
    }
}

/** A bordered, tappable row that leads somewhere. */
@Composable
fun ActionTile(
    icon: ImageVector,
    title: String,
    subtitle: String? = null,
    trailing: String? = null,
    danger: Boolean = false,
    onClick: () -> Unit,
) {
    val colors = LocalAceColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.panel)
            .border(1.dp, colors.border)
            .clickable(
                role = androidx.compose.ui.semantics.Role.Button,
                onClickLabel = title,
                onClick = onClick,
            )
            .padding(horizontal = 16.dp, vertical = 15.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = colors.content,
            modifier = Modifier.size(21.dp),
        )
        Spacer(Modifier.width(13.dp))
        Column(Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = if (danger) FontWeight.W800 else FontWeight.W700,
                color = colors.content,
            )
            if (!subtitle.isNullOrBlank()) {
                Spacer(Modifier.height(2.dp))
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = colors.muted)
            }
        }
        if (!trailing.isNullOrBlank()) {
            Spacer(Modifier.width(10.dp))
            Text(trailing, style = MaterialTheme.typography.labelLarge, color = colors.content)
        }
    }
}

/** A non-interactive row used in the device and activity lists. */
@Composable
fun DataTile(
    icon: ImageVector,
    title: String,
    subtitle: String,
    trailing: String? = null,
) {
    val colors = LocalAceColors.current
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(icon, contentDescription = null, tint = colors.content, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(13.dp))
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.bodyMedium, color = colors.content)
            if (subtitle.isNotBlank()) {
                Text(subtitle, style = MaterialTheme.typography.bodySmall, color = colors.muted)
            }
        }
        if (!trailing.isNullOrBlank()) {
            Spacer(Modifier.width(8.dp))
            Text(trailing, style = MaterialTheme.typography.bodySmall, color = colors.muted)
        }
    }
}

@Composable
fun ErrorPanel(message: String, onRetry: () -> Unit) {
    val colors = LocalAceColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, colors.border)
            .padding(horizontal = 14.dp, vertical = 12.dp),
    ) {
        Text(message, style = MaterialTheme.typography.bodySmall, color = colors.content)
        TextButton(onClick = onRetry, contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp)) {
            Text("Try again", style = MaterialTheme.typography.labelLarge, color = colors.content)
        }
    }
}

@Composable
fun EmptyPanel(message: String) {
    val colors = LocalAceColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, colors.border)
            .padding(18.dp),
    ) {
        Text(message, style = MaterialTheme.typography.bodySmall, color = colors.muted)
    }
}

/** A labelled input that matches the square, hairline field treatment. */
@Composable
fun LabeledField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    prefix: String? = null,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
) {
    val colors = LocalAceColors.current
    Column(Modifier.fillMaxWidth()) {
        Text(
            text = label.uppercase(java.util.Locale.ROOT),
            style = MaterialTheme.typography.labelSmall,
            color = colors.muted,
        )
        Spacer(Modifier.height(6.dp))
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth().semantics { contentDescription = label },
            singleLine = singleLine,
            shape = RoundedCornerShape(0.dp),
            textStyle = MaterialTheme.typography.bodyMedium,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            prefix = prefix?.let { { Text(it, color = colors.muted) } },
            // Border colour comes from the theme outline (ace.border); the field
            // itself is a filled, square-cornered surface with no underline.
            // OutlinedTextField draws its outline from the indicator colour, so
            // a transparent indicator would hide the border entirely.
            colors = TextFieldDefaults.colors(
                focusedContainerColor = colors.panel,
                unfocusedContainerColor = colors.panel,
                disabledContainerColor = colors.panel,
                focusedTextColor = colors.content,
                unfocusedTextColor = colors.content,
                cursorColor = colors.content,
                focusedIndicatorColor = colors.content,
                unfocusedIndicatorColor = colors.border,
                disabledIndicatorColor = colors.border,
                errorIndicatorColor = colors.content,
            ),
        )
    }
}


/**
 * Shared Ace ID 24dp outline icon set, matching the reference sheet: geometric,
 * square-capped, 1.8 stroke on a 24 viewport with a 3.5 safe margin. Geometry
 * is local and theme-tinted by Icon(). Names keep their pre-existing meanings
 * so call sites do not change; aliases (Devices, Clock, External, Trash, Gear)
 * point at the same vectors.
 */
object AceIcons {
    private fun icon(name: String, draw: ImageVector.Builder.() -> Unit): ImageVector =
        ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f).apply(draw).build()

    private fun ImageVector.Builder.line(block: PathBuilder.() -> Unit) {
        path(
            stroke = SolidColor(Color.Black),
            strokeLineWidth = 1.8f,
            strokeLineCap = StrokeCap.Square,
            strokeLineJoin = StrokeJoin.Miter,
            pathFillType = androidx.compose.ui.graphics.PathFillType.NonZero,
        ) { block() }
    }

    val Home = icon("AceHome") { line { moveTo(3.5f, 11.5f); lineTo(12f, 3.5f); lineTo(20.5f, 11.5f); lineTo(20.5f, 20.5f); lineTo(15f, 20.5f); lineTo(15f, 14f); lineTo(9f, 14f); lineTo(9f, 20.5f); lineTo(3.5f, 20.5f); close() } }
    val User = icon("AceUser") { line { moveTo(9f, 3f); lineTo(15f, 3f); lineTo(15f, 9f); lineTo(9f, 9f); close(); moveTo(4.5f, 20.5f); lineTo(4.5f, 17.5f); lineTo(7.5f, 14.5f); lineTo(16.5f, 14.5f); lineTo(19.5f, 17.5f); lineTo(19.5f, 20.5f); close() } }
    val Shield = icon("AceShield") { line { moveTo(6f, 3.5f); lineTo(18f, 3.5f); lineTo(18f, 12f); lineTo(12f, 20.5f); lineTo(6f, 12f); close(); moveTo(12f, 7.5f); cubicTo(13.1f, 7.5f, 14f, 8.4f, 14f, 9.5f); cubicTo(14f, 10.6f, 13.1f, 11.5f, 12f, 11.5f); cubicTo(10.9f, 11.5f, 10f, 10.6f, 10f, 9.5f); cubicTo(10f, 8.4f, 10.9f, 7.5f, 12f, 7.5f); moveTo(12f, 11.5f); lineTo(12f, 15f) } }
    val ShieldCheck = icon("AceShieldCheck") { line { moveTo(6f, 3.5f); lineTo(18f, 3.5f); lineTo(18f, 12f); lineTo(12f, 20.5f); lineTo(6f, 12f); close(); moveTo(8.5f, 12f); lineTo(11f, 14.5f); lineTo(15.5f, 9.5f) } }
    val Login = icon("AceLogin") { line { moveTo(9f, 4f); lineTo(20f, 4f); lineTo(20f, 20f); lineTo(9f, 20f); moveTo(3.5f, 12f); lineTo(16f, 12f); moveTo(12.5f, 8f); lineTo(16f, 12f); lineTo(12.5f, 16f) } }
    val Logout = icon("AceLogout") { line { moveTo(15f, 4f); lineTo(3.5f, 4f); lineTo(3.5f, 20f); lineTo(15f, 20f); moveTo(8f, 12f); lineTo(20.5f, 12f); moveTo(16.5f, 8f); lineTo(20.5f, 12f); lineTo(16.5f, 16f) } }
    val Grid = icon("AceGrid") { line { moveTo(4f, 4f); lineTo(9f, 4f); lineTo(9f, 9f); lineTo(4f, 9f); close(); moveTo(15f, 4f); lineTo(20f, 4f); lineTo(20f, 9f); lineTo(15f, 9f); close(); moveTo(4f, 15f); lineTo(9f, 15f); lineTo(9f, 20f); lineTo(4f, 20f); close(); moveTo(15f, 15f); lineTo(20f, 15f); lineTo(20f, 20f); lineTo(15f, 20f); close() } }
    val Key = icon("AceKey") { line { moveTo(16f, 4f); cubicTo(18.2f, 4f, 20f, 5.8f, 20f, 8f); cubicTo(20f, 10.2f, 18.2f, 12f, 16f, 12f); cubicTo(13.8f, 12f, 12f, 10.2f, 12f, 8f); cubicTo(12f, 5.8f, 13.8f, 4f, 16f, 4f); moveTo(13.2f, 10.8f); lineTo(4f, 20f); moveTo(7.7f, 16.3f); lineTo(9.2f, 17.8f); moveTo(5.8f, 18.2f); lineTo(7.3f, 19.7f) } }
    val Link = icon("AceLink") { line { moveTo(10.5f, 8f); lineTo(13f, 5.5f); lineTo(16.5f, 5.5f); lineTo(19f, 8f); lineTo(19f, 11.5f); lineTo(16.5f, 14f); moveTo(13.5f, 16f); lineTo(11f, 18.5f); lineTo(7.5f, 18.5f); lineTo(5f, 16f); lineTo(5f, 12.5f); lineTo(7.5f, 10f); moveTo(9.5f, 14.5f); lineTo(14.5f, 9.5f) } }
    val LinkOff = icon("AceLinkOff") { line { moveTo(13f, 5.5f); lineTo(16.5f, 5.5f); lineTo(19f, 8f); lineTo(19f, 11.5f); lineTo(16.5f, 14f); lineTo(14f, 14f); moveTo(10f, 10f); lineTo(7.5f, 10f); lineTo(5f, 12.5f); lineTo(5f, 16f); lineTo(7.5f, 18.5f); lineTo(11f, 18.5f); moveTo(13.5f, 10.5f); lineTo(14.5f, 9.5f); moveTo(10.5f, 10.5f); lineTo(9.5f, 9.5f); moveTo(13.5f, 13.5f); lineTo(14.5f, 14.5f); moveTo(10.5f, 13.5f); lineTo(9.5f, 14.5f) } }
    val Computer = icon("AceComputer") { line { moveTo(3f, 4.5f); lineTo(15f, 4.5f); lineTo(15f, 14.5f); lineTo(3f, 14.5f); close(); moveTo(9f, 14.5f); lineTo(9f, 19.5f); moveTo(6f, 19.5f); lineTo(12f, 19.5f); moveTo(16f, 8.5f); lineTo(21f, 8.5f); lineTo(21f, 19.5f); lineTo(16f, 19.5f); close() } }
    val Devices = Computer
    val Settings = icon("AceSettings") { line { moveTo(20f, 12f); lineTo(18f, 14.5f); lineTo(17.7f, 17.7f); lineTo(14.5f, 18f); lineTo(12f, 20f); lineTo(9.5f, 18f); lineTo(6.3f, 17.7f); lineTo(6f, 14.5f); lineTo(4f, 12f); lineTo(6f, 9.5f); lineTo(6.3f, 6.3f); lineTo(9.5f, 6f); lineTo(12f, 4f); lineTo(14.5f, 6f); lineTo(17.7f, 6.3f); lineTo(18f, 9.5f); close(); moveTo(12f, 9f); cubicTo(13.7f, 9f, 15f, 10.3f, 15f, 12f); cubicTo(15f, 13.7f, 13.7f, 15f, 12f, 15f); cubicTo(10.3f, 15f, 9f, 13.7f, 9f, 12f); cubicTo(9f, 10.3f, 10.3f, 9f, 12f, 9f) } }
    val Gear = Settings
    val Bell = icon("AceBell") { line { moveTo(6f, 18f); lineTo(6f, 11f); lineTo(12f, 4f); lineTo(18f, 11f); lineTo(18f, 18f); moveTo(4f, 18f); lineTo(20f, 18f); moveTo(10f, 20.5f); lineTo(14f, 20.5f); moveTo(10f, 18f); lineTo(10f, 20.5f); moveTo(14f, 18f); lineTo(14f, 20.5f) } }
    val BellOff = icon("AceBellOff") { line { moveTo(6f, 18f); lineTo(6f, 11f); lineTo(12f, 4f); lineTo(18f, 11f); lineTo(18f, 18f); moveTo(4f, 18f); lineTo(20f, 18f); moveTo(10f, 20.5f); lineTo(14f, 20.5f); moveTo(10f, 18f); lineTo(10f, 20.5f); moveTo(14f, 18f); lineTo(14f, 20.5f); moveTo(4f, 4f); lineTo(20f, 20f) } }
    val Mail = icon("AceMail") { line { moveTo(3.5f, 6f); lineTo(20.5f, 6f); lineTo(20.5f, 18f); lineTo(3.5f, 18f); close(); moveTo(3.5f, 6f); lineTo(12f, 13f); lineTo(20.5f, 6f) } }
    val Edit = icon("AceEdit") { line { moveTo(5.5f, 17f); lineTo(19f, 3.5f); lineTo(20.5f, 5f); lineTo(7f, 18.5f); lineTo(4f, 20f); close(); moveTo(14f, 6.5f); lineTo(17.5f, 10f) } }
    val Pencil = Edit
    val Compose = icon("AceCompose") { line { moveTo(4f, 6f); lineTo(13f, 6f); moveTo(4f, 6f); lineTo(4f, 20f); lineTo(20f, 20f); lineTo(20f, 13f); moveTo(11f, 15f); lineTo(17f, 9f); lineTo(19f, 11f); lineTo(13f, 17f); close() } }
    val Delete = icon("AceDelete") { line { moveTo(3.5f, 6.5f); lineTo(20.5f, 6.5f); moveTo(9f, 6.5f); lineTo(9f, 3.5f); lineTo(15f, 3.5f); lineTo(15f, 6.5f); moveTo(6f, 6.5f); lineTo(6f, 20.5f); lineTo(18f, 20.5f); lineTo(18f, 6.5f); moveTo(10f, 10.5f); lineTo(10f, 16.5f); moveTo(14f, 10.5f); lineTo(14f, 16.5f) } }
    val Trash = Delete
    val History = icon("AceHistory") { line { moveTo(8f, 3.5f); lineTo(16f, 3.5f); lineTo(20.5f, 8f); lineTo(20.5f, 16f); lineTo(16f, 20.5f); lineTo(8f, 20.5f); lineTo(3.5f, 16f); lineTo(3.5f, 8f); close(); moveTo(12f, 7.5f); lineTo(12f, 12f); lineTo(15f, 15f) } }
    val Clock = History
    val Eye = icon("AceEye") { line { moveTo(3.5f, 12f); lineTo(8f, 7f); lineTo(16f, 7f); lineTo(20.5f, 12f); lineTo(16f, 17f); lineTo(8f, 17f); close(); moveTo(12f, 10.2f); cubicTo(13f, 10.2f, 13.8f, 11f, 13.8f, 12f); cubicTo(13.8f, 13f, 13f, 13.8f, 12f, 13.8f); cubicTo(11f, 13.8f, 10.2f, 13f, 10.2f, 12f); cubicTo(10.2f, 11f, 11f, 10.2f, 12f, 10.2f) } }
    val EyeOff = icon("AceEyeOff") { line { moveTo(3.5f, 12f); lineTo(8f, 7f); lineTo(16f, 7f); lineTo(20.5f, 12f); lineTo(16f, 17f); lineTo(8f, 17f); close(); moveTo(5f, 5f); lineTo(19f, 19f) } }
    val Copy = icon("AceCopy") { line { moveTo(4f, 9f); lineTo(15f, 9f); lineTo(15f, 20f); lineTo(4f, 20f); close(); moveTo(9f, 4f); lineTo(20f, 4f); lineTo(20f, 15f); lineTo(15f, 15f) } }
    val ClipboardCheck = icon("AceClipboardCheck") { line { moveTo(6f, 6.5f); lineTo(10f, 6.5f); moveTo(14f, 6.5f); lineTo(18f, 6.5f); moveTo(6f, 6.5f); lineTo(6f, 20f); lineTo(18f, 20f); lineTo(18f, 6.5f); moveTo(10f, 3.5f); lineTo(14f, 3.5f); lineTo(14f, 6.5f); lineTo(10f, 6.5f); close(); moveTo(9f, 13f); lineTo(11.5f, 15.5f); lineTo(15f, 10.5f) } }
    val Check = icon("AceCheck") { line { moveTo(5f, 12.5f); lineTo(10f, 17.5f); lineTo(19f, 7f) } }
    val Close = icon("AceClose") { line { moveTo(6f, 6f); lineTo(18f, 18f); moveTo(18f, 6f); lineTo(6f, 18f) } }
    val Fingerprint = icon("AceFingerprint") { line { moveTo(6f, 20f); lineTo(6f, 12f); quadTo(6f, 4f, 12f, 4f); quadTo(18f, 4f, 18f, 12f); lineTo(18f, 20f); moveTo(9f, 20f); lineTo(9f, 12f); quadTo(9f, 7f, 12f, 7f); quadTo(15f, 7f, 15f, 12f); lineTo(15f, 20f); moveTo(12f, 20f); lineTo(12f, 11f) } }
    val Scan = icon("AceScan") { line { moveTo(3.5f, 8f); lineTo(3.5f, 3.5f); lineTo(8f, 3.5f); moveTo(16f, 3.5f); lineTo(20.5f, 3.5f); lineTo(20.5f, 8f); moveTo(20.5f, 16f); lineTo(20.5f, 20.5f); lineTo(16f, 20.5f); moveTo(8f, 20.5f); lineTo(3.5f, 20.5f); lineTo(3.5f, 16f); moveTo(8f, 8f); lineTo(11f, 8f); lineTo(11f, 11f); lineTo(8f, 11f); close(); moveTo(13f, 8f); lineTo(16f, 8f); lineTo(16f, 11f); lineTo(13f, 11f); close(); moveTo(8f, 13f); lineTo(11f, 13f); lineTo(11f, 16f); lineTo(8f, 16f); close(); moveTo(13f, 13f); lineTo(16f, 13f); lineTo(16f, 16f); lineTo(13f, 16f); close() } }
    val Refresh = icon("AceRefresh") { line { moveTo(7f, 7f); quadTo(12f, 4f, 17f, 7f); moveTo(14f, 4.5f); lineTo(17f, 7f); lineTo(14f, 9.5f); moveTo(17f, 17f); quadTo(12f, 20f, 7f, 17f); moveTo(10f, 14.5f); lineTo(7f, 17f); lineTo(10f, 19.5f) } }
    val Download = icon("AceDownload") { line { moveTo(12f, 4f); lineTo(12f, 15f); moveTo(8.5f, 11.5f); lineTo(12f, 15f); lineTo(15.5f, 11.5f); moveTo(4f, 16f); lineTo(4f, 20f); lineTo(20f, 20f); lineTo(20f, 16f) } }
    val Upload = icon("AceUpload") { line { moveTo(12f, 20f); lineTo(12f, 9f); moveTo(8.5f, 12.5f); lineTo(12f, 9f); lineTo(15.5f, 12.5f); moveTo(4f, 16f); lineTo(4f, 20f); lineTo(20f, 20f); lineTo(20f, 16f) } }
    val Open = icon("AceOpen") { line { moveTo(10f, 4f); lineTo(4f, 4f); lineTo(4f, 20f); lineTo(20f, 20f); lineTo(20f, 14f); moveTo(14f, 4f); lineTo(20f, 4f); lineTo(20f, 10f); moveTo(20f, 4f); lineTo(11f, 13f) } }
    val External = Open
    val Sun = icon("AceSun") { line { moveTo(12f, 8f); cubicTo(14.2f, 8f, 16f, 9.8f, 16f, 12f); cubicTo(16f, 14.2f, 14.2f, 16f, 12f, 16f); cubicTo(9.8f, 16f, 8f, 14.2f, 8f, 12f); cubicTo(8f, 9.8f, 9.8f, 8f, 12f, 8f); moveTo(12f, 2.5f); lineTo(12f, 5.5f); moveTo(12f, 18.5f); lineTo(12f, 21.5f); moveTo(2.5f, 12f); lineTo(5.5f, 12f); moveTo(18.5f, 12f); lineTo(21.5f, 12f); moveTo(5.3f, 5.3f); lineTo(7.3f, 7.3f); moveTo(16.7f, 16.7f); lineTo(18.7f, 18.7f); moveTo(5.3f, 18.7f); lineTo(7.3f, 16.7f); moveTo(16.7f, 7.3f); lineTo(18.7f, 5.3f) } }
    val Moon = icon("AceMoon") { line { moveTo(11f, 3.5f); cubicTo(5f, 5.5f, 3f, 8.5f, 3f, 12f); cubicTo(3f, 15.5f, 5f, 18.5f, 11f, 20.5f); cubicTo(9f, 17.5f, 8f, 15f, 8f, 12f); cubicTo(8f, 9f, 9f, 6.5f, 11f, 3.5f); close() } }
    val Lock = icon("AceLock") { line { moveTo(5.5f, 10.5f); lineTo(18.5f, 10.5f); lineTo(18.5f, 20.5f); lineTo(5.5f, 20.5f); close(); moveTo(8.5f, 10.5f); lineTo(8.5f, 7f); quadTo(8.5f, 3.5f, 12f, 3.5f); quadTo(15.5f, 3.5f, 15.5f, 7f); lineTo(15.5f, 10.5f); moveTo(12f, 13f); cubicTo(12.8f, 13f, 13.5f, 13.7f, 13.5f, 14.5f); cubicTo(13.5f, 15.3f, 12.8f, 16f, 12f, 16f); cubicTo(11.2f, 16f, 10.5f, 15.3f, 10.5f, 14.5f); cubicTo(10.5f, 13.7f, 11.2f, 13f, 12f, 13f); moveTo(12f, 16f); lineTo(12f, 18f) } }
}
