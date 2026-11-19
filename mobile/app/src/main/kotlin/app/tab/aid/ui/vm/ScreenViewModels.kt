package app.tab.aid.ui.vm

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import app.tab.aid.data.AceIdApi
import app.tab.aid.data.activityLogs
import app.tab.aid.data.optObjects
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject

data class OverviewUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val account: JSONObject? = null,
    val error: String? = null,
)

class OverviewViewModel(private val api: AceIdApi) : ViewModel() {
    private val _state = MutableStateFlow(OverviewUiState())
    val state: StateFlow<OverviewUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        val current = _state.value
        _state.value = current.copy(
            loading = current.account == null,
            refreshing = current.account != null,
            error = null,
        )
        viewModelScope.launch {
            try {
                val account = api.account()
                _state.value = OverviewUiState(
                    loading = false,
                    refreshing = false,
                    account = account,
                    error = null,
                )
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    refreshing = false,
                    error = error.message ?: "Could not load your ID.",
                )
            }
        }
    }
}

data class SecurityUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val devices: List<JSONObject> = emptyList(),
    val logs: List<JSONObject> = emptyList(),
    val error: String? = null,
)

class SecurityViewModel(private val api: AceIdApi) : ViewModel() {
    private val _state = MutableStateFlow(SecurityUiState())
    val state: StateFlow<SecurityUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        val current = _state.value
        val firstLoad = current.devices.isEmpty() && current.logs.isEmpty()
        _state.value = current.copy(loading = firstLoad, refreshing = !firstLoad, error = null)
        viewModelScope.launch {
            // Fetch in parallel so one slow endpoint does not block the other,
            // and keep whichever half succeeded instead of discarding both.
            val (devicesResult, logsResult) = coroutineScope {
                val devicesDeferred = async { runCatching { api.devices() } }
                val logsDeferred = async { runCatching { api.logs() } }
                devicesDeferred.await() to logsDeferred.await()
            }
            val devicesError = devicesResult.exceptionOrNull()
            val logsError = logsResult.exceptionOrNull()
            if (devicesError is CancellationException) throw devicesError
            if (logsError is CancellationException) throw logsError
            val devices = devicesResult.getOrNull()?.optObjects("devices") ?: _state.value.devices
            val logs = logsResult.getOrNull()?.let { activityLogs(it) } ?: _state.value.logs
            val error = when {
                devicesError != null && logsError != null ->
                    devicesError.message ?: "Could not load your security activity."
                devicesError != null -> devicesError.message ?: "Could not load signed-in devices."
                logsError != null -> logsError.message ?: "Could not load recent activity."
                else -> null
            }
            _state.value = SecurityUiState(
                loading = false,
                refreshing = false,
                devices = devices,
                logs = logs,
                error = error,
            )
        }
    }
}

data class ConnectedAppsUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val apps: List<JSONObject> = emptyList(),
    val error: String? = null,
    val revoking: Boolean = false,
)

class ConnectedAppsViewModel(private val api: AceIdApi) : ViewModel() {
    private val _state = MutableStateFlow(ConnectedAppsUiState())
    val state: StateFlow<ConnectedAppsUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        val current = _state.value
        _state.value = current.copy(
            loading = current.apps.isEmpty(),
            refreshing = current.apps.isNotEmpty(),
            error = null,
        )
        viewModelScope.launch {
            try {
                val apps = api.connectedApps().optObjects("connectedApps")
                _state.value = ConnectedAppsUiState(
                    loading = false,
                    refreshing = false,
                    apps = apps,
                    error = null,
                )
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    refreshing = false,
                    error = error.message ?: "Could not load connected apps.",
                )
            }
        }
    }

    fun revoke(grantId: String, onResult: (String) -> Unit) {
        if (_state.value.revoking) return
        _state.value = _state.value.copy(revoking = true)
        viewModelScope.launch {
            try {
                api.revokeApp(grantId)
                onResult("App disconnected.")
                refresh()
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                onResult(error.message ?: "Could not disconnect that app.")
            } finally {
                _state.value = _state.value.copy(revoking = false)
            }
        }
    }
}

data class ProfileUiState(
    val loading: Boolean = true,
    val refreshing: Boolean = false,
    val account: JSONObject? = null,
    val error: String? = null,
    val saving: Boolean = false,
)

class ProfileViewModel(private val api: AceIdApi) : ViewModel() {
    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        val current = _state.value
        _state.value = current.copy(
            loading = current.account == null,
            refreshing = current.account != null,
            error = null,
        )
        viewModelScope.launch {
            try {
                val account = api.account()
                _state.value = ProfileUiState(
                    loading = false,
                    refreshing = false,
                    account = account,
                    error = null,
                )
            } catch (error: CancellationException) {
                throw error
            } catch (error: Exception) {
                _state.value = _state.value.copy(
                    loading = false,
                    refreshing = false,
                    error = error.message ?: "Could not load your ID.",
                )
            }
        }
    }

    fun save(values: JSONObject, onResult: (Boolean, String?) -> Unit) {
        if (_state.value.saving) return
        _state.value = _state.value.copy(saving = true)
        viewModelScope.launch {
            try {
                val account = api.updateAccount(values)
                _state.value = _state.value.copy(
                    saving = false,
                    account = if (account.length() > 0) account else _state.value.account,
                )
                onResult(true, null)
                refresh()
            } catch (error: CancellationException) {
                _state.value = _state.value.copy(saving = false)
                throw error
            } catch (error: Exception) {
                _state.value = _state.value.copy(saving = false)
                onResult(false, error.message ?: "Could not save your changes.")
            }
        }
    }
}
