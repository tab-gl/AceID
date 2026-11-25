package app.tab.aid.ui

import app.tab.aid.ui.components.glass
import androidx.compose.animation.Crossfade
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import app.tab.aid.auth.AceIdConfig
import app.tab.aid.data.AceIdApi
import app.tab.aid.data.IdentityProfile
import app.tab.aid.ui.components.AceIcons
import app.tab.aid.ui.components.Brand
import app.tab.aid.ui.theme.LocalAceColors
import kotlinx.coroutines.launch

private enum class Tab(val label: String, val icon: ImageVector) {
    Home("Home", AceIcons.Home),
    Security("Security", AceIcons.Shield),
    Connected("Connected", AceIcons.Link),
    Id("ID", AceIcons.User),
}

@Composable
fun HomeScreen(
    profile: IdentityProfile,
    api: AceIdApi,
    darkTheme: Boolean,
    onToggleTheme: () -> Unit,
    onSignOut: () -> Unit,
) {
    val colors = LocalAceColors.current
    val uriHandler = LocalUriHandler.current
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    var selected by rememberSaveable { mutableIntStateOf(Tab.Home.ordinal) }

    val showMessage: (String) -> Unit = { message ->
        scope.launch { snackbarHostState.showSnackbar(message) }
    }
    val openWeb: (String) -> Unit = { path ->
        uriHandler.openUri(AceIdConfig.fromBuild.webUrl(path))
    }

    Scaffold(
        containerColor = Color.Transparent,
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Brand(Modifier.weight(1f))
                IconButton(onClick = onToggleTheme) {
                    Icon(
                        imageVector = if (darkTheme) AceIcons.Sun else AceIcons.Moon,
                        contentDescription = if (darkTheme) "Switch to light mode" else "Switch to dark mode",
                        tint = colors.content,
                    )
                }
                IconButton(onClick = onSignOut) {
                    Icon(AceIcons.Logout, contentDescription = "Sign out", tint = colors.content)
                }
            }
        },
        bottomBar = {
            FloatingNavigationBar(
                selected = selected,
                onSelect = { selected = it },
            )
        },
    ) { padding ->
        Crossfade(
            targetState = selected,
            label = "ace-id-tab",
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) { index ->
            when (Tab.entries.getOrElse(index) { Tab.Home }) {
                Tab.Home -> OverviewScreen(
                    profile = profile,
                    api = api,
                    onOpenId = { selected = Tab.Id.ordinal },
                    onOpenSecurity = { selected = Tab.Security.ordinal },
                    onOpenConnected = { selected = Tab.Connected.ordinal },
                )

                Tab.Security -> SecurityScreen(
                    api = api,
                    onOpenWeb = { openWeb("/account/security") },
                )

                Tab.Connected -> ConnectedAppsScreen(
                    api = api,
                    onMessage = showMessage,
                )

                Tab.Id -> ProfileScreen(
                    profile = profile,
                    api = api,
                    onOpenWeb = openWeb,
                    onSignOut = onSignOut,
                    onMessage = showMessage,
                )
            }
        }
    }
}

@Composable
private fun FloatingNavigationBar(selected: Int, onSelect: (Int) -> Unit) {
    val colors = LocalAceColors.current
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 16.dp, vertical = 10.dp)
            .glass(RoundedCornerShape(28.dp)),
        color = Color.Transparent,
        shape = RoundedCornerShape(28.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(6.dp)
                .selectableGroup(),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Tab.entries.forEachIndexed { index, tab ->
                val active = index == selected
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(22.dp))
                        .background(if (active) colors.content else Color.Transparent)
                        .selectable(
                            selected = active,
                            role = Role.Tab,
                            onClick = { onSelect(index) },
                        )
                        .padding(vertical = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Icon(
                        imageVector = tab.icon,
                        contentDescription = null,
                        tint = if (active) colors.background else colors.muted,
                        modifier = Modifier.size(19.dp),
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = tab.label,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (active) colors.background else colors.muted,
                    )
                }
            }
        }
    }
}
