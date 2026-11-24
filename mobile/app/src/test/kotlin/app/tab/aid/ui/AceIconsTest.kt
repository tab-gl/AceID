package app.tab.aid.ui

import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import app.tab.aid.ui.components.AceIcons
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AceIconsTest {

    private val all: List<ImageVector> = listOf(
        AceIcons.Home, AceIcons.User, AceIcons.Shield, AceIcons.ShieldCheck,
        AceIcons.Login, AceIcons.Logout, AceIcons.Grid, AceIcons.Key,
        AceIcons.Link, AceIcons.LinkOff, AceIcons.Computer, AceIcons.Settings,
        AceIcons.Bell, AceIcons.BellOff, AceIcons.Mail, AceIcons.Edit,
        AceIcons.Compose, AceIcons.Delete, AceIcons.History, AceIcons.Eye,
        AceIcons.EyeOff, AceIcons.Copy, AceIcons.ClipboardCheck, AceIcons.Check,
        AceIcons.Close, AceIcons.Fingerprint, AceIcons.Scan, AceIcons.Refresh,
        AceIcons.Download, AceIcons.Upload, AceIcons.Open, AceIcons.Sun,
        AceIcons.Moon, AceIcons.Lock,
    )

    @Test
    fun `every icon uses the shared 24dp viewport`() {
        for (icon in all) {
            assertEquals(icon.name, 24.dp, icon.defaultWidth)
            assertEquals(icon.name, 24.dp, icon.defaultHeight)
            assertTrue(icon.name, icon.viewportWidth == 24f)
            assertTrue(icon.name, icon.viewportHeight == 24f)
        }
    }

    @Test
    fun `every icon has a stable nonblank name`() {
        for (icon in all) {
            assertTrue(icon.name, icon.name.isNotBlank())
        }
        assertEquals(all.size, all.map { it.name }.toSet().size)
    }

    @Test
    fun `aliases share their base vector`() {
        assertEquals(AceIcons.Computer, AceIcons.Devices)
        assertEquals(AceIcons.History, AceIcons.Clock)
        assertEquals(AceIcons.Open, AceIcons.External)
        assertEquals(AceIcons.Delete, AceIcons.Trash)
        assertEquals(AceIcons.Settings, AceIcons.Gear)
        assertEquals(AceIcons.Edit, AceIcons.Pencil)
    }

    @Test
    fun `grid and scan are distinct icons`() {
        assertTrue(AceIcons.Grid.name != AceIcons.Scan.name)
    }
}
