import { AndroidFile, ProjectConfig } from '../types/androidProject';

function escapeKotlinString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
    .replace(/\$/g, '\\$');
}

export function generateKotlinFiles(config: ProjectConfig): AndroidFile[] {
  const pkg = config.packageName.trim() || 'com.samurai.shiftmonitor';
  const pkgPath = pkg.replace(/\./g, '/');
  const baseJavaDir = `app/src/main/java/${pkgPath}`;

  const appConfigKt = `package ${pkg}.config

enum class ExecutionMode(val labelAr: String) {
    HYBRID("الوضع المزدوج (واجهة + API)"),
    ACCESSIBILITY_ONLY("التفاعل مع الواجهة فقط"),
    API_ONLY("طلبات الشبكة (API) فقط")
}

object AppConfig {
    const val DEFAULT_APP_NAME = "${escapeKotlinString(config.appName)}"
    const val DEFAULT_TARGET_APP_PACKAGE = "${escapeKotlinString(config.targetAppPackage)}"
    const val DEFAULT_TARGET_HOUR = ${config.targetHour}
    const val DEFAULT_TARGET_MINUTE = ${config.targetMinute}
    const val DEFAULT_TARGET_SECOND = ${config.targetSecond}
    const val DEFAULT_PRE_FIRE_OFFSET_MS = ${config.preFireOffsetMs}L
    val DEFAULT_EXECUTION_MODE = ExecutionMode.${config.executionMode}
    const val DEFAULT_TARGET_KEYWORDS = "${escapeKotlinString(config.targetKeywords)}"
    const val DEFAULT_TARGET_VIEW_ID = "${escapeKotlinString(config.targetViewId)}"
    const val DEFAULT_API_ENDPOINT = "${escapeKotlinString(config.apiEndpointUrl)}"
    const val DEFAULT_API_METHOD = "${config.apiHttpMethod}"
    const val DEFAULT_API_HEADERS_JSON = "${escapeKotlinString(config.apiHeadersJson)}"
    const val DEFAULT_API_PAYLOAD_JSON = "${escapeKotlinString(config.apiPayloadJson)}"
    const val DEFAULT_BURST_COUNT = ${config.burstCount}
    const val DEFAULT_BURST_INTERVAL_MS = ${config.burstIntervalMs}L
    const val DEFAULT_NTP_HOST = "${escapeKotlinString(config.ntpServerHost)}"
}
`;

  const logRepositoryKt = `package ${pkg}.data

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

enum class LogLevel {
    INFO,
    SUCCESS,
    WARN,
    ERROR
}

data class LogEntry(
    val id: Long,
    val timestamp: String,
    val level: LogLevel,
    val message: String
)

object LogRepository {
    private const val MAX_LOGS = 250
    private var counter = 0L
    private val formatter = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)

    private val _logs = MutableStateFlow<List<LogEntry>>(emptyList())
    val logs: StateFlow<List<LogEntry>> = _logs.asStateFlow()

    @Synchronized
    fun log(message: String, level: LogLevel = LogLevel.INFO) {
        counter += 1
        val entry = LogEntry(
            id = counter,
            timestamp = formatter.format(Date()),
            level = level,
            message = message
        )
        val updated = (listOf(entry) + _logs.value).take(MAX_LOGS)
        _logs.value = updated
    }

    @Synchronized
    fun clear() {
        _logs.value = emptyList()
    }
}
`;

  const prefsManagerKt = `package ${pkg}.data

import android.content.Context
import android.content.SharedPreferences
import ${pkg}.config.AppConfig
import ${pkg}.config.ExecutionMode
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class MonitorSettings(
    val isArmed: Boolean = false,
    val targetHour: Int = AppConfig.DEFAULT_TARGET_HOUR,
    val targetMinute: Int = AppConfig.DEFAULT_TARGET_MINUTE,
    val targetSecond: Int = AppConfig.DEFAULT_TARGET_SECOND,
    val preFireOffsetMs: Long = AppConfig.DEFAULT_PRE_FIRE_OFFSET_MS,
    val executionMode: ExecutionMode = AppConfig.DEFAULT_EXECUTION_MODE,
    val targetAppPackage: String = AppConfig.DEFAULT_TARGET_APP_PACKAGE,
    val targetKeywords: String = AppConfig.DEFAULT_TARGET_KEYWORDS,
    val targetViewId: String = AppConfig.DEFAULT_TARGET_VIEW_ID,
    val tapX: Float = 0f,
    val tapY: Float = 0f,
    val useCoordinateFallback: Boolean = true,
    val watchWindowMs: Long = 4500L,
    val autoLaunchSamurai: Boolean = true,
    val apiEndpointUrl: String = AppConfig.DEFAULT_API_ENDPOINT,
    val apiMethod: String = AppConfig.DEFAULT_API_METHOD,
    val apiHeadersJson: String = AppConfig.DEFAULT_API_HEADERS_JSON,
    val apiPayloadJson: String = AppConfig.DEFAULT_API_PAYLOAD_JSON,
    val burstCount: Int = AppConfig.DEFAULT_BURST_COUNT,
    val burstIntervalMs: Long = AppConfig.DEFAULT_BURST_INTERVAL_MS,
    val ntpServerHost: String = AppConfig.DEFAULT_NTP_HOST,
    val ntpOffsetMs: Long = 0L,
    val ntpLastRttMs: Long = 0L
)

class PrefsManager private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.applicationContext.getSharedPreferences("samurai_monitor_prefs", Context.MODE_PRIVATE)

    private val _settings = MutableStateFlow(loadFromPrefs())
    val settings: StateFlow<MonitorSettings> = _settings.asStateFlow()

    private fun loadFromPrefs(): MonitorSettings {
        val modeName = prefs.getString("execution_mode", AppConfig.DEFAULT_EXECUTION_MODE.name)
        val mode = runCatching { ExecutionMode.valueOf(modeName ?: "") }
            .getOrDefault(AppConfig.DEFAULT_EXECUTION_MODE)

        return MonitorSettings(
            isArmed = prefs.getBoolean("is_armed", false),
            targetHour = prefs.getInt("target_hour", AppConfig.DEFAULT_TARGET_HOUR),
            targetMinute = prefs.getInt("target_minute", AppConfig.DEFAULT_TARGET_MINUTE),
            targetSecond = prefs.getInt("target_second", AppConfig.DEFAULT_TARGET_SECOND),
            preFireOffsetMs = prefs.getLong("pre_fire_offset_ms", AppConfig.DEFAULT_PRE_FIRE_OFFSET_MS),
            executionMode = mode,
            targetAppPackage = prefs.getString("target_app_package", AppConfig.DEFAULT_TARGET_APP_PACKAGE)
                ?: AppConfig.DEFAULT_TARGET_APP_PACKAGE,
            targetKeywords = prefs.getString("target_keywords", AppConfig.DEFAULT_TARGET_KEYWORDS)
                ?: AppConfig.DEFAULT_TARGET_KEYWORDS,
            targetViewId = prefs.getString("target_view_id", AppConfig.DEFAULT_TARGET_VIEW_ID)
                ?: AppConfig.DEFAULT_TARGET_VIEW_ID,
            tapX = prefs.getFloat("tap_x", 0f),
            tapY = prefs.getFloat("tap_y", 0f),
            useCoordinateFallback = prefs.getBoolean("use_coordinate_fallback", true),
            watchWindowMs = prefs.getLong("watch_window_ms", 4500L),
            autoLaunchSamurai = prefs.getBoolean("auto_launch_samurai", true),
            apiEndpointUrl = prefs.getString("api_endpoint_url", AppConfig.DEFAULT_API_ENDPOINT)
                ?: AppConfig.DEFAULT_API_ENDPOINT,
            apiMethod = prefs.getString("api_method", AppConfig.DEFAULT_API_METHOD)
                ?: AppConfig.DEFAULT_API_METHOD,
            apiHeadersJson = prefs.getString("api_headers_json", AppConfig.DEFAULT_API_HEADERS_JSON)
                ?: AppConfig.DEFAULT_API_HEADERS_JSON,
            apiPayloadJson = prefs.getString("api_payload_json", AppConfig.DEFAULT_API_PAYLOAD_JSON)
                ?: AppConfig.DEFAULT_API_PAYLOAD_JSON,
            burstCount = prefs.getInt("burst_count", AppConfig.DEFAULT_BURST_COUNT),
            burstIntervalMs = prefs.getLong("burst_interval_ms", AppConfig.DEFAULT_BURST_INTERVAL_MS),
            ntpServerHost = prefs.getString("ntp_server_host", AppConfig.DEFAULT_NTP_HOST)
                ?: AppConfig.DEFAULT_NTP_HOST,
            ntpOffsetMs = prefs.getLong("ntp_offset_ms", 0L),
            ntpLastRttMs = prefs.getLong("ntp_last_rtt_ms", 0L)
        )
    }

    @Synchronized
    fun update(transform: (MonitorSettings) -> MonitorSettings) {
        val next = transform(_settings.value)
        prefs.edit()
            .putBoolean("is_armed", next.isArmed)
            .putInt("target_hour", next.targetHour)
            .putInt("target_minute", next.targetMinute)
            .putInt("target_second", next.targetSecond)
            .putLong("pre_fire_offset_ms", next.preFireOffsetMs)
            .putString("execution_mode", next.executionMode.name)
            .putString("target_app_package", next.targetAppPackage)
            .putString("target_keywords", next.targetKeywords)
            .putString("target_view_id", next.targetViewId)
            .putFloat("tap_x", next.tapX)
            .putFloat("tap_y", next.tapY)
            .putBoolean("use_coordinate_fallback", next.useCoordinateFallback)
            .putLong("watch_window_ms", next.watchWindowMs)
            .putBoolean("auto_launch_samurai", next.autoLaunchSamurai)
            .putString("api_endpoint_url", next.apiEndpointUrl)
            .putString("api_method", next.apiMethod)
            .putString("api_headers_json", next.apiHeadersJson)
            .putString("api_payload_json", next.apiPayloadJson)
            .putInt("burst_count", next.burstCount)
            .putLong("burst_interval_ms", next.burstIntervalMs)
            .putString("ntp_server_host", next.ntpServerHost)
            .putLong("ntp_offset_ms", next.ntpOffsetMs)
            .putLong("ntp_last_rtt_ms", next.ntpLastRttMs)
            .apply()
        _settings.value = next
    }

    companion object {
        @Volatile
        private var instance: PrefsManager? = null

        fun getInstance(context: Context): PrefsManager {
            return instance ?: synchronized(this) {
                instance ?: PrefsManager(context).also { instance = it }
            }
        }
    }
}
`;

  const ntpTimeSyncKt = `package ${pkg}.time

import android.os.SystemClock
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

data class NtpSyncResult(
    val offsetMs: Long,
    val roundTripMs: Long,
    val serverHost: String
)

object NtpTimeSync {
    private const val NTP_PORT = 123
    private const val NTP_PACKET_SIZE = 48
    private const val OFFSET_1900_TO_1970 = 2208988800L
    private const val ORIGINATE_TIME_OFFSET = 24
    private const val RECEIVE_TIME_OFFSET = 32
    private const val TRANSMIT_TIME_OFFSET = 40

    suspend fun sync(host: String, timeoutMs: Int = 2500): Result<NtpSyncResult> =
        withContext(Dispatchers.IO) {
            runCatching {
                val address = InetAddress.getByName(host.ifBlank { "time.google.com" })
                val socket = DatagramSocket()
                socket.soTimeout = timeoutMs

                socket.use { udp ->
                    val buffer = ByteArray(NTP_PACKET_SIZE)
                    buffer[0] = 0x1B // LI = 0, VN = 3, Mode = 3 (client)

                    val requestTime = System.currentTimeMillis()
                    val requestTicks = SystemClock.elapsedRealtime()
                    writeTimeStamp(buffer, TRANSMIT_TIME_OFFSET, requestTime)

                    val requestPacket = DatagramPacket(buffer, buffer.size, address, NTP_PORT)
                    udp.send(requestPacket)

                    val responsePacket = DatagramPacket(buffer, buffer.size)
                    udp.receive(responsePacket)

                    val responseTicks = SystemClock.elapsedRealtime()
                    val responseTime = requestTime + (responseTicks - requestTicks)

                    val originateTime = readTimeStamp(buffer, ORIGINATE_TIME_OFFSET)
                    val receiveTime = readTimeStamp(buffer, RECEIVE_TIME_OFFSET)
                    val transmitTime = readTimeStamp(buffer, TRANSMIT_TIME_OFFSET)

                    val roundTripMs = (responseTicks - requestTicks) - (transmitTime - receiveTime)
                    val clockOffsetMs = ((receiveTime - originateTime) + (transmitTime - responseTime)) / 2L

                    NtpSyncResult(
                        offsetMs = clockOffsetMs,
                        roundTripMs = roundTripMs.coerceAtLeast(0L),
                        serverHost = host
                    )
                }
            }
        }

    private fun read32(buffer: ByteArray, offset: Int): Long {
        val b0 = (buffer[offset].toInt() and 0xFF).toLong()
        val b1 = (buffer[offset + 1].toInt() and 0xFF).toLong()
        val b2 = (buffer[offset + 2].toInt() and 0xFF).toLong()
        val b3 = (buffer[offset + 3].toInt() and 0xFF).toLong()
        return (b0 shl 24) or (b1 shl 16) or (b2 shl 8) or b3
    }

    private fun readTimeStamp(buffer: ByteArray, offset: Int): Long {
        val seconds = read32(buffer, offset)
        val fraction = read32(buffer, offset + 4)
        return ((seconds - OFFSET_1900_TO_1970) * 1000L) + ((fraction * 1000L) / 0x100000000L)
    }

    private fun writeTimeStamp(buffer: ByteArray, offset: Int, timeMs: Long) {
        val seconds = (timeMs / 1000L) + OFFSET_1900_TO_1970
        val milliseconds = timeMs % 1000L
        val fraction = (milliseconds * 0x100000000L) / 1000L

        buffer[offset] = (seconds shr 24).toByte()
        buffer[offset + 1] = (seconds shr 16).toByte()
        buffer[offset + 2] = (seconds shr 8).toByte()
        buffer[offset + 3] = seconds.toByte()

        buffer[offset + 4] = (fraction shr 24).toByte()
        buffer[offset + 5] = (fraction shr 16).toByte()
        buffer[offset + 6] = (fraction shr 8).toByte()
        buffer[offset + 7] = fraction.toByte()
    }
}
`;

  const apiBookingEngineKt = `package ${pkg}.network

import ${pkg}.data.LogLevel
import ${pkg}.data.LogRepository
import ${pkg}.data.MonitorSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import okhttp3.ConnectionPool
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object ApiBookingEngine {

    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectionPool(ConnectionPool(6, 2, TimeUnit.MINUTES))
        .connectTimeout(3, TimeUnit.SECONDS)
        .readTimeout(4, TimeUnit.SECONDS)
        .writeTimeout(3, TimeUnit.SECONDS)
        .retryOnConnectionFailure(false)
        .build()

    suspend fun preWarmConnection(settings: MonitorSettings) = withContext(Dispatchers.IO) {
        val url = settings.apiEndpointUrl.trim()
        if (!url.startsWith("http")) return@withContext

        runCatching {
            val reqBuilder = Request.Builder().url(url).head()
            applyHeaders(reqBuilder, settings.apiHeadersJson)
            val start = System.currentTimeMillis()
            client.newCall(reqBuilder.build()).execute().use { response ->
                val elapsed = System.currentTimeMillis() - start
                LogRepository.log(
                    "تم تسخين اتصال TLS/TCP بنجاح (HTTP \${response.code}) خلال \${elapsed}ms",
                    LogLevel.INFO
                )
            }
        }.onFailure { err ->
            LogRepository.log("تنبيه تسخين الاتصال: \${err.message}", LogLevel.WARN)
        }
    }

    suspend fun fireBookingBurst(settings: MonitorSettings): Boolean = withContext(Dispatchers.IO) {
        val url = settings.apiEndpointUrl.trim()
        if (!url.startsWith("http")) {
            LogRepository.log("رابط API غير صالح: \$url", LogLevel.ERROR)
            return@withContext false
        }

        val count = settings.burstCount.coerceIn(1, 10)
        val intervalMs = settings.burstIntervalMs.coerceIn(0L, 1000L)

        LogRepository.log("بدء إرسال دفعة API (\$count طلبات بفاصل \${intervalMs}ms)...", LogLevel.INFO)

        val jobs = (0 until count).map { index ->
            async {
                if (index > 0 && intervalMs > 0L) {
                    delay(index * intervalMs)
                }
                executeSingleRequest(index + 1, settings)
            }
        }

        val results = jobs.awaitAll()
        results.any { it }
    }

    private fun executeSingleRequest(attempt: Int, settings: MonitorSettings): Boolean {
        val url = settings.apiEndpointUrl.trim()
        val mediaType = "application/json; charset=utf-8".toMediaType()
        val method = settings.apiMethod.uppercase()

        val builder = Request.Builder().url(url)
        applyHeaders(builder, settings.apiHeadersJson)

        when (method) {
            "GET" -> builder.get()
            "PUT" -> builder.put(settings.apiPayloadJson.toRequestBody(mediaType))
            else -> builder.post(settings.apiPayloadJson.toRequestBody(mediaType))
        }

        val startMs = System.currentTimeMillis()
        return try {
            client.newCall(builder.build()).execute().use { response ->
                val elapsedMs = System.currentTimeMillis() - startMs
                val snippet = response.body?.string()?.take(140).orEmpty()
                if (response.isSuccessful) {
                    LogRepository.log(
                        "نجح طلب الحجز #\$attempt (HTTP \${response.code}) في \${elapsedMs}ms: \$snippet",
                        LogLevel.SUCCESS
                    )
                    true
                } else {
                    LogRepository.log(
                        "استجابة طلب #\$attempt: HTTP \${response.code} خلال \${elapsedMs}ms - \$snippet",
                        LogLevel.WARN
                    )
                    false
                }
            }
        } catch (e: Exception) {
            val elapsedMs = System.currentTimeMillis() - startMs
            LogRepository.log("فشل طلب #\$attempt بعد \${elapsedMs}ms: \${e.message}", LogLevel.ERROR)
            false
        }
    }

    private fun applyHeaders(builder: Request.Builder, headersJson: String) {
        if (headersJson.isBlank()) return
        runCatching {
            val obj = JSONObject(headersJson)
            val keys = obj.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                val value = obj.optString(key, "")
                if (key.isNotBlank() && value.isNotBlank()) {
                    builder.header(key, value)
                }
            }
        }
    }
}
`;

  const accessibilityServiceKt = `package ${pkg}.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import ${pkg}.data.LogLevel
import ${pkg}.data.LogRepository
import ${pkg}.data.PrefsManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class SamuraiAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var watchJob: Job? = null

    @Volatile
    private var watchDeadlineElapsedMs: Long = 0L

    @Volatile
    private var tapDispatchedInCurrentWindow: Boolean = false

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        LogRepository.log("تم ربط خدمة الوصول (Accessibility) بنجاح", LogLevel.SUCCESS)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val now = SystemClock.elapsedRealtime()
        if (now <= watchDeadlineElapsedMs && !tapDispatchedInCurrentWindow) {
            val pkg = event.packageName?.toString().orEmpty()
            val targetPkg = PrefsManager.getInstance(this).settings.value.targetAppPackage.trim()
            if (targetPkg.isEmpty() || pkg == targetPkg) {
                scanAndTapOnce(source = "Event")
            }
        }
    }

    override fun onInterrupt() {
        LogRepository.log("تمت مقاطعة خدمة الوصول", LogLevel.WARN)
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance === this) {
            instance = null
        }
        serviceScope.cancel()
    }

    fun armWatchWindow(durationMs: Long) {
        val prefs = PrefsManager.getInstance(this).settings.value
        tapDispatchedInCurrentWindow = false
        watchDeadlineElapsedMs = SystemClock.elapsedRealtime() + durationMs.coerceIn(500L, 15000L)

        LogRepository.log("بدء نافذة المراقبة السريعة للواجهة لمدة \${durationMs}ms", LogLevel.INFO)

        // Immediate attempt at T-0
        if (scanAndTapOnce(source = "T0-Scan")) {
            return
        }

        // If configured to tap calibrated coordinates immediately when node isn't exposed yet
        if (prefs.useCoordinateFallback && prefs.tapX > 0f && prefs.tapY > 0f) {
            performCoordinateTap(prefs.tapX, prefs.tapY, "T0-Gesture")
        }

        watchJob?.cancel()
        watchJob = serviceScope.launch {
            while (isActive && SystemClock.elapsedRealtime() <= watchDeadlineElapsedMs && !tapDispatchedInCurrentWindow) {
                if (scanAndTapOnce(source = "Loop-Scan")) {
                    break
                }
                delay(25L)
            }
            if (!tapDispatchedInCurrentWindow) {
                LogRepository.log("انتهت نافذة مراقبة الواجهة دون العثور على زر مطابق", LogLevel.WARN)
            }
        }
    }

    fun scanAndTapOnce(source: String): Boolean {
        val settings = PrefsManager.getInstance(this).settings.value
        val root = rootInActiveWindow ?: return false

        val keywords = settings.targetKeywords
            .split(",", "،", "\\n")
            .map { it.trim().lowercase() }
            .filter { it.isNotEmpty() }

        val viewId = settings.targetViewId.trim()

        val targetNode = findMatchingNode(root, viewId, keywords)
        if (targetNode != null) {
            val clickableNode = findClickableParent(targetNode) ?: targetNode
            val clicked = clickableNode.performAction(AccessibilityNodeInfo.ACTION_CLICK)
            if (clicked) {
                tapDispatchedInCurrentWindow = true
                val label = targetNode.text?.toString() ?: targetNode.contentDescription?.toString() ?: viewId
                LogRepository.log("تم الضغط التلقائي على زر '\$label' عبر [\$source]", LogLevel.SUCCESS)
                return true
            }
        }
        return false
    }

    fun performCoordinateTap(x: Float, y: Float, source: String = "Manual"): Boolean {
        if (x <= 0f || y <= 0f) return false
        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0L, 15L)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        val dispatched = dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                LogRepository.log("تم تنفيذ نقرة الإحداثيات (\${x.toInt()}, \${y.toInt()}) [\$source]", LogLevel.SUCCESS)
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                LogRepository.log("تم إلغاء نقرة الإحداثيات [\$source]", LogLevel.WARN)
            }
        }, null)

        if (dispatched) {
            tapDispatchedInCurrentWindow = true
        }
        return dispatched
    }

    private fun findMatchingNode(
        node: AccessibilityNodeInfo?,
        targetViewId: String,
        keywords: List<String>
    ): AccessibilityNodeInfo? {
        if (node == null) return null

        if (targetViewId.isNotEmpty() && node.viewIdResourceName == targetViewId && node.isEnabled) {
            return node
        }

        val text = node.text?.toString()?.trim()?.lowercase().orEmpty()
        val desc = node.contentDescription?.toString()?.trim()?.lowercase().orEmpty()

        if (node.isEnabled && keywords.isNotEmpty()) {
            val matched = keywords.any { kw -> text.contains(kw) || desc.contains(kw) }
            if (matched) {
                return node
            }
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i) ?: continue
            val match = findMatchingNode(child, targetViewId, keywords)
            if (match != null) return match
        }
        return null
    }

    private fun findClickableParent(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        var current = node
        var depth = 0
        while (current != null && depth < 5) {
            if (current.isClickable && current.isEnabled) {
                return current
            }
            current = current.parent
            depth++
        }
        return null
    }

    companion object {
        @Volatile
        var instance: SamuraiAccessibilityService? = null
            private set
    }
}
`;

  const alarmTriggerReceiverKt = `package ${pkg}.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import ${pkg}.data.LogLevel
import ${pkg}.data.LogRepository
import ${pkg}.service.ShiftMonitorService

class AlarmTriggerReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        LogRepository.log("تم استيقاظ الجهاز عبر المنبه الدقيق للاستعداد للحجز", LogLevel.INFO)
        val serviceIntent = Intent(context, ShiftMonitorService::class.java).apply {
            action = ShiftMonitorService.ACTION_START_PRECISION_MONITOR
        }
        ContextCompat.startForegroundService(context, serviceIntent)
    }
}
`;

  const shiftMonitorServiceKt = `package ${pkg}.service

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.os.SystemClock
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import ${pkg}.R
import ${pkg}.accessibility.SamuraiAccessibilityService
import ${pkg}.config.ExecutionMode
import ${pkg}.data.LogLevel
import ${pkg}.data.LogRepository
import ${pkg}.data.MonitorSettings
import ${pkg}.data.PrefsManager
import ${pkg}.network.ApiBookingEngine
import ${pkg}.receiver.AlarmTriggerReceiver
import ${pkg}.time.NtpTimeSync
import ${pkg}.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.Locale

class ShiftMonitorService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private var monitorJob: Job? = null
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP_MONITOR -> {
                stopMonitoring()
                return START_NOT_STICKY
            }
            ACTION_START_PRECISION_MONITOR, null -> {
                val notification = buildNotification("المراقب نشط — بانتظار توقيت فتح الشفتات")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    ServiceCompat.startForeground(
                        this,
                        NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }
                startPrecisionLoop()
            }
        }
        return START_STICKY
    }

    private fun startPrecisionLoop() {
        monitorJob?.cancel()
        monitorJob = serviceScope.launch {
            val prefs = PrefsManager.getInstance(this@ShiftMonitorService)
            val initialSettings = prefs.settings.value

            val targetWallTimeMs = computeNextTargetMillis(
                initialSettings.targetHour,
                initialSettings.targetMinute,
                initialSettings.targetSecond
            )

            scheduleWakeAlarm(this@ShiftMonitorService, targetWallTimeMs - 20_000L)
            LogRepository.log(
                String.format(
                    Locale.US,
                    "تم تفعيل المراقبة للهدف %02d:%02d:%02d (تعويض %dms)",
                    initialSettings.targetHour,
                    initialSettings.targetMinute,
                    initialSettings.targetSecond,
                    initialSettings.preFireOffsetMs
                ),
                LogLevel.INFO
            )

            // Sync NTP clock drift right upon arming
            NtpTimeSync.sync(initialSettings.ntpServerHost).onSuccess { res ->
                prefs.update { it.copy(ntpOffsetMs = res.offsetMs, ntpLastRttMs = res.roundTripMs) }
                LogRepository.log(
                    "مزامنة NTP: فرق الساعة \${res.offsetMs}ms (RTT \${res.roundTripMs}ms)",
                    LogLevel.INFO
                )
            }

            var preWarmed = false
            var appLaunched = false

            while (isActive && prefs.settings.value.isArmed) {
                val currentSettings = prefs.settings.value
                val correctedNowMs = System.currentTimeMillis() + currentSettings.ntpOffsetMs
                val fireAtMs = targetWallTimeMs - currentSettings.preFireOffsetMs
                val remainingMs = fireAtMs - correctedNowMs

                if (remainingMs <= 25_000L) {
                    acquireWakeLock()
                }

                if (!preWarmed && remainingMs <= 5_000L && currentSettings.executionMode != ExecutionMode.ACCESSIBILITY_ONLY) {
                    preWarmed = true
                    launch { ApiBookingEngine.preWarmConnection(currentSettings) }
                }

                if (!appLaunched && remainingMs <= 2_500L && currentSettings.autoLaunchSamurai &&
                    currentSettings.executionMode != ExecutionMode.API_ONLY
                ) {
                    appLaunched = true
                    launchTargetApp(currentSettings.targetAppPackage)
                }

                if (remainingMs <= 400L) {
                    // Sub-millisecond spin-wait in final 400ms window
                    val deadlineNanos = SystemClock.elapsedRealtimeNanos() + (remainingMs.coerceAtLeast(0L) * 1_000_000L)
                    while (SystemClock.elapsedRealtimeNanos() < deadlineNanos) {
                        // Busy wait for sub-ms precision
                    }
                    executeTrigger(currentSettings)
                    break
                }

                if (remainingMs > 2_000L) {
                    updateNotification(
                        String.format(
                            Locale.US,
                            "العد التنازلي: %02d:%02d:%02d متبقية",
                            (remainingMs / 3600000),
                            (remainingMs % 3600000) / 60000,
                            (remainingMs % 60000) / 1000
                        )
                    )
                    delay(500L)
                } else {
                    delay(20L)
                }
            }

            releaseWakeLock()
            prefs.update { it.copy(isArmed = false) }
            stopForeground(STOP_FOREGROUND_REMOVE)
            stopSelf()
        }
    }

    private fun executeTrigger(settings: MonitorSettings) {
        LogRepository.log("لحظة الصفر! بدء تنفيذ الحجز التلقائي...", LogLevel.SUCCESS)

        if (settings.executionMode == ExecutionMode.HYBRID || settings.executionMode == ExecutionMode.ACCESSIBILITY_ONLY) {
            val accService = SamuraiAccessibilityService.instance
            if (accService != null) {
                accService.armWatchWindow(settings.watchWindowMs)
            } else {
                LogRepository.log("تنبيه: خدمة الوصول (Accessibility) غير مفعلة!", LogLevel.ERROR)
            }
        }

        if (settings.executionMode == ExecutionMode.HYBRID || settings.executionMode == ExecutionMode.API_ONLY) {
            serviceScope.launch {
                ApiBookingEngine.fireBookingBurst(settings)
            }
        }
    }

    private fun launchTargetApp(packageName: String) {
        val pkg = packageName.trim()
        if (pkg.isEmpty()) return
        runCatching {
            val launchIntent = packageManager.getLaunchIntentForPackage(pkg)
            if (launchIntent != null) {
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                startActivity(launchIntent)
                LogRepository.log("تم فتح تطبيق ساموراي في المقدمة (\$pkg)", LogLevel.INFO)
            } else {
                LogRepository.log("لم يتم العثور على تطبيق بالحزمة: \$pkg", LogLevel.WARN)
            }
        }
    }

    private fun stopMonitoring() {
        monitorJob?.cancel()
        releaseWakeLock()
        cancelWakeAlarm(this)
        PrefsManager.getInstance(this).update { it.copy(isArmed = false) }
        LogRepository.log("تم إيقاف المراقب يدوياً", LogLevel.INFO)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun acquireWakeLock() {
        if (wakeLock?.isHeld == true) return
        val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "${pkg}:PrecisionWakeLock").apply {
            acquire(60_000L)
        }
    }

    private fun releaseWakeLock() {
        runCatching {
            if (wakeLock?.isHeld == true) wakeLock?.release()
        }
        wakeLock = null
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "مراقب حجز الشفتات",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "إشعار استمرار مراقبة توقيت حجز شفتات ساموراي"
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(text: String): Notification {
        val openAppIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        val stopIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, ShiftMonitorService::class.java).apply { action = ACTION_STOP_MONITOR },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("مراقب ساموراي نشط")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_bolt_timer)
            .setContentIntent(openAppIntent)
            .addAction(0, "إيقاف", stopIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(text: String) {
        val manager = getSystemService(NotificationManager::class.java)
        manager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    override fun onDestroy() {
        super.onDestroy()
        releaseWakeLock()
        serviceScope.cancel()
    }

    companion object {
        const val CHANNEL_ID = "samurai_precision_monitor"
        const val NOTIFICATION_ID = 4001
        const val ACTION_START_PRECISION_MONITOR = "${pkg}.START_PRECISION_MONITOR"
        const val ACTION_STOP_MONITOR = "${pkg}.STOP_PRECISION_MONITOR"

        fun computeNextTargetMillis(hour: Int, minute: Int, second: Int): Long {
            val now = Calendar.getInstance()
            val target = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, second)
                set(Calendar.MILLISECOND, 0)
            }
            if (target.timeInMillis <= now.timeInMillis) {
                target.add(Calendar.DAY_OF_YEAR, 1)
            }
            return target.timeInMillis
        }

        fun scheduleWakeAlarm(context: Context, triggerAtMs: Long) {
            if (triggerAtMs <= System.currentTimeMillis() + 3_000L) return
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                901,
                Intent(context, AlarmTriggerReceiver::class.java),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
            } else {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pendingIntent)
            }
        }

        fun cancelWakeAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                901,
                Intent(context, AlarmTriggerReceiver::class.java),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
            alarmManager.cancel(pendingIntent)
        }
    }
}
`;

  const floatingOverlayServiceKt = `package ${pkg}.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import ${pkg}.R
import ${pkg}.data.LogLevel
import ${pkg}.data.LogRepository
import ${pkg}.data.PrefsManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.util.Locale

class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var panelView: View? = null
    private var reticleView: View? = null
    private var reticleParams: WindowManager.LayoutParams? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createChannel()
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            ServiceCompat.startForeground(
                this,
                4002,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(4002, notification)
        }
        showFloatingPanel()
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun showFloatingPanel() {
        val prefs = PrefsManager.getInstance(this)
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 18, 24, 18)
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#E6111827"))
                cornerRadius = 24f
                setStroke(2, Color.parseColor("#F59E0B"))
            }
        }

        val clockLabel = TextView(this).apply {
            setTextColor(Color.WHITE)
            textSize = 14f
            text = "00:00:00.000"
        }

        val btnRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 10, 0, 0)
        }

        val btnTarget = Button(this).apply {
            text = "تحديد الزر"
            textSize = 11f
            setOnClickListener {
                if (reticleView == null) {
                    showCrosshairReticle()
                    text = "حفظ الموضع"
                } else {
                    saveReticleCoordinates()
                    removeCrosshairReticle()
                    text = "تحديد الزر"
                }
            }
        }

        val btnClose = Button(this).apply {
            text = "إغلاق"
            textSize = 11f
            setOnClickListener { stopSelf() }
        }

        btnRow.addView(btnTarget)
        btnRow.addView(btnClose)
        container.addView(clockLabel)
        container.addView(btnRow)

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 40
            y = 220
        }

        var initialX = 0
        var initialY = 0
        var touchX = 0f
        var touchY = 0f

        container.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    touchX = event.rawX
                    touchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - touchX).toInt()
                    params.y = initialY + (event.rawY - touchY).toInt()
                    windowManager.updateViewLayout(container, params)
                    true
                }
                else -> false
            }
        }

        panelView = container
        windowManager.addView(container, params)

        scope.launch {
            while (isActive) {
                val s = prefs.settings.value
                val targetMs = ShiftMonitorService.computeNextTargetMillis(s.targetHour, s.targetMinute, s.targetSecond)
                val nowMs = System.currentTimeMillis() + s.ntpOffsetMs
                val rem = (targetMs - s.preFireOffsetMs - nowMs).coerceAtLeast(0L)
                val hrs = rem / 3600000
                val mins = (rem % 3600000) / 60000
                val secs = (rem % 60000) / 1000
                val ms = rem % 1000
                clockLabel.text = String.format(Locale.US, "الهدف: %02d:%02d:%02d.%03d", hrs, mins, secs, ms)
                delay(50L)
            }
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun showCrosshairReticle() {
        val reticle = TextView(this).apply {
            text = "⊕"
            textSize = 26f
            setTextColor(Color.parseColor("#F59E0B"))
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#44F59E0B"))
                setStroke(4, Color.parseColor("#F59E0B"))
            }
            width = 120
            height = 120
        }

        val params = WindowManager.LayoutParams(
            120,
            120,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 420
            y = 900
        }

        var initialX = 0
        var initialY = 0
        var touchX = 0f
        var touchY = 0f

        reticle.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    touchX = event.rawX
                    touchY = event.rawY
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    params.x = initialX + (event.rawX - touchX).toInt()
                    params.y = initialY + (event.rawY - touchY).toInt()
                    windowManager.updateViewLayout(reticle, params)
                    true
                }
                else -> false
            }
        }

        reticleView = reticle
        reticleParams = params
        windowManager.addView(reticle, params)
    }

    private fun saveReticleCoordinates() {
        val view = reticleView ?: return
        val loc = IntArray(2)
        view.getLocationOnScreen(loc)
        val centerX = loc[0] + (view.width / 2f)
        val centerY = loc[1] + (view.height / 2f)

        PrefsManager.getInstance(this).update {
            it.copy(tapX = centerX, tapY = centerY)
        }
        LogRepository.log("تم حفظ إحداثيات زر الحجز: (\${centerX.toInt()}, \${centerY.toInt()})", LogLevel.SUCCESS)
    }

    private fun removeCrosshairReticle() {
        reticleView?.let { runCatching { windowManager.removeView(it) } }
        reticleView = null
        reticleParams = null
    }

    private fun createChannel() {
        val channel = NotificationChannel(
            "samurai_overlay_channel",
            "النافذة العائمة",
            NotificationManager.IMPORTANCE_LOW
        )
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, "samurai_overlay_channel")
            .setContentTitle("أداة تحديد زر ساموراي العائمة")
            .setSmallIcon(R.drawable.ic_bolt_timer)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        panelView?.let { runCatching { windowManager.removeView(it) } }
        removeCrosshairReticle()
        scope.cancel()
    }
}
`;

  const themeKt = `package ${pkg}.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val SamuraiDarkColors = darkColorScheme(
    primary = Color(0xFFF59E0B),
    onPrimary = Color(0xFF0B0F14),
    secondary = Color(0xFF10B981),
    onSecondary = Color(0xFF06281E),
    background = Color(0xFF0B0F14),
    onBackground = Color(0xFFF1F5F9),
    surface = Color(0xFF131A24),
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = Color(0xFF1E293B),
    onSurfaceVariant = Color(0xFF94A3B8),
    error = Color(0xFFEF4444),
    onError = Color.White
)

@Composable
fun SamuraiMonitorTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = SamuraiDarkColors,
        content = content
    )
}
`;

  const mainActivityKt = `package ${pkg}.ui

import android.Manifest
import android.app.AlarmManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import ${pkg}.accessibility.SamuraiAccessibilityService
import ${pkg}.config.ExecutionMode
import ${pkg}.data.LogLevel
import ${pkg}.data.LogRepository
import ${pkg}.data.MonitorSettings
import ${pkg}.data.PrefsManager
import ${pkg}.network.ApiBookingEngine
import ${pkg}.service.FloatingOverlayService
import ${pkg}.service.ShiftMonitorService
import ${pkg}.time.NtpTimeSync
import ${pkg}.ui.theme.SamuraiMonitorTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
                SamuraiMonitorTheme {
                    SamuraiMonitorApp()
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SamuraiMonitorApp() {
    val context = LocalContext.current
    val prefs = remember { PrefsManager.getInstance(context) }
    val settings by prefs.settings.collectAsState()
    val logs by LogRepository.logs.collectAsState()
    val scope = rememberCoroutineScope()

    var selectedTab by remember { mutableIntStateOf(0) }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "مراقب حجز ساموراي",
                        fontWeight = FontWeight.Bold
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    icon = { Icon(Icons.Default.AccessTime, contentDescription = null) },
                    label = { Text("المؤقت") }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    icon = { Icon(Icons.Default.TouchApp, contentDescription = null) },
                    label = { Text("الواجهة") }
                )
                NavigationBarItem(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    icon = { Icon(Icons.Default.Http, contentDescription = null) },
                    label = { Text("API") }
                )
                NavigationBarItem(
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3 },
                    icon = { Icon(Icons.Default.History, contentDescription = null) },
                    label = { Text("السجل") }
                )
            }
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (selectedTab) {
                0 -> DashboardTab(
                    settings = settings,
                    onUpdate = { prefs.update(it) },
                    onToggleArm = {
                        val nextArm = !settings.isArmed
                        prefs.update { it.copy(isArmed = nextArm) }
                        val intent = Intent(context, ShiftMonitorService::class.java).apply {
                            action = if (nextArm) {
                                ShiftMonitorService.ACTION_START_PRECISION_MONITOR
                            } else {
                                ShiftMonitorService.ACTION_STOP_MONITOR
                            }
                        }
                        if (nextArm) {
                            ContextCompat.startForegroundService(context, intent)
                        } else {
                            context.startService(intent)
                        }
                    },
                    onSyncNtp = {
                        scope.launch {
                            NtpTimeSync.sync(settings.ntpServerHost)
                                .onSuccess { res ->
                                    prefs.update {
                                        it.copy(ntpOffsetMs = res.offsetMs, ntpLastRttMs = res.roundTripMs)
                                    }
                                    LogRepository.log(
                                        "تمت مزامنة التوقيت: فرق \${res.offsetMs}ms (RTT \${res.roundTripMs}ms)",
                                        LogLevel.SUCCESS
                                    )
                                }
                                .onFailure { err ->
                                    LogRepository.log("فشل مزامنة NTP: \${err.message}", LogLevel.ERROR)
                                }
                        }
                    }
                )
                1 -> AccessibilityConfigTab(settings = settings, onUpdate = { prefs.update(it) })
                2 -> ApiConfigTab(
                    settings = settings,
                    onUpdate = { prefs.update(it) },
                    onTestPreWarm = {
                        scope.launch { ApiBookingEngine.preWarmConnection(settings) }
                    }
                )
                3 -> LogsTab(logs = logs, onClear = { LogRepository.clear() })
            }
        }
    }
}

@Composable
private fun DashboardTab(
    settings: MonitorSettings,
    onUpdate: ((MonitorSettings) -> MonitorSettings) -> Unit,
    onToggleArm: () -> Unit,
    onSyncNtp: () -> Unit
) {
    val context = LocalContext.current
    var nowMs by remember { mutableLongStateOf(System.currentTimeMillis()) }

    LaunchedEffect(Unit) {
        while (true) {
            nowMs = System.currentTimeMillis()
            delay(50L)
        }
    }

    val correctedNow = nowMs + settings.ntpOffsetMs
    val targetMs = ShiftMonitorService.computeNextTargetMillis(
        settings.targetHour,
        settings.targetMinute,
        settings.targetSecond
    )
    val remainingMs = (targetMs - settings.preFireOffsetMs - correctedNow).coerceAtLeast(0L)

    val timeFormatter = remember { SimpleDateFormat("HH:mm:ss.SSS", Locale.US) }
    val accConnected = SamuraiAccessibilityService.instance != null
    val overlayGranted = Settings.canDrawOverlays(context)
    val exactAlarmGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        (context.getSystemService(Context.ALARM_SERVICE) as AlarmManager).canScheduleExactAlarms()
    } else true
    val batteryIgnored = (context.getSystemService(Context.POWER_SERVICE) as PowerManager)
        .isIgnoringBatteryOptimizations(context.packageName)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Countdown Card
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "العد التنازلي للحجز التلقائي",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = formatDurationMs(remainingMs),
                    style = MaterialTheme.typography.headlineLarge,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    color = if (settings.isArmed) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary
                )
                Text(
                    text = "الوقت المتزامن: \${timeFormatter.format(Date(correctedNow))}  |  فرق NTP: \${settings.ntpOffsetMs}ms",
                    style = MaterialTheme.typography.bodySmall,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(6.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = onToggleArm,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (settings.isArmed) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Icon(
                            imageVector = if (settings.isArmed) Icons.Default.Stop else Icons.Default.PlayArrow,
                            contentDescription = null
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(if (settings.isArmed) "إيقاف المراقبة" else "تفعيل المراقب")
                    }

                    OutlinedButton(onClick = onSyncNtp) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Spacer(Modifier.width(4.dp))
                        Text("مزامنة")
                    }
                }
            }
        }

        // Target Time Configuration
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("توقيت فتح الشفتات المستهدف", fontWeight = FontWeight.SemiBold)

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = settings.targetHour.toString(),
                        onValueChange = { v ->
                            v.toIntOrNull()?.let { h ->
                                if (h in 0..23) onUpdate { it.copy(targetHour = h) }
                            }
                        },
                        label = { Text("الساعة (0-23)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = settings.targetMinute.toString(),
                        onValueChange = { v ->
                            v.toIntOrNull()?.let { m ->
                                if (m in 0..59) onUpdate { it.copy(targetMinute = m) }
                            }
                        },
                        label = { Text("الدقيقة") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = settings.targetSecond.toString(),
                        onValueChange = { v ->
                            v.toIntOrNull()?.let { s ->
                                if (s in 0..59) onUpdate { it.copy(targetSecond = s) }
                            }
                        },
                        label = { Text("الثانية") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                }

                OutlinedTextField(
                    value = settings.preFireOffsetMs.toString(),
                    onValueChange = { v ->
                        v.toLongOrNull()?.let { offset ->
                            onUpdate { it.copy(preFireOffsetMs = offset.coerceIn(-1000L, 2000L)) }
                        }
                    },
                    label = { Text("الإطلاق المسبق بالمللي ثانية (لتعويض زمن الاستجابة)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Text("وضع التنفيذ:", style = MaterialTheme.typography.labelMedium)
                ExecutionMode.entries.forEach { mode ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        RadioButton(
                            selected = settings.executionMode == mode,
                            onClick = { onUpdate { it.copy(executionMode = mode) } }
                        )
                        Text(mode.labelAr, style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }

        // System Permissions Checklist
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = MaterialTheme.shapes.medium,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text("جاهزية صلاحيات النظام", fontWeight = FontWeight.SemiBold)

                PermissionRow(
                    title = "خدمة إمكانية الوصول (Accessibility)",
                    granted = accConnected,
                    onClick = {
                        context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                    }
                )
                PermissionRow(
                    title = "الظهور فوق التطبيقات (Floating Overlay)",
                    granted = overlayGranted,
                    onClick = {
                        val intent = Intent(
                            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:\${context.packageName}")
                        )
                        context.startActivity(intent)
                    }
                )
                PermissionRow(
                    title = "المنبه الدقيق (Exact Alarm)",
                    granted = exactAlarmGranted,
                    onClick = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                            context.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM))
                        }
                    }
                )
                PermissionRow(
                    title = "استثناء تحسين البطارية",
                    granted = batteryIgnored,
                    onClick = {
                        val intent = Intent(
                            Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                            Uri.parse("package:\${context.packageName}")
                        )
                        context.startActivity(intent)
                    }
                )

                OutlinedButton(
                    onClick = {
                        if (overlayGranted) {
                            ContextCompat.startForegroundService(
                                context,
                                Intent(context, FloatingOverlayService::class.java)
                            )
                        } else {
                            val intent = Intent(
                                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                Uri.parse("package:\${context.packageName}")
                            )
                            context.startActivity(intent)
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Layers, contentDescription = null)
                    Spacer(Modifier.width(6.dp))
                    Text("تشغيل الأداة العائمة فوق تطبيق ساموراي")
                }
            }
        }
    }
}

@Composable
private fun PermissionRow(title: String, granted: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            Icon(
                imageVector = if (granted) Icons.Default.CheckCircle else Icons.Default.Warning,
                contentDescription = null,
                tint = if (granted) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary
            )
            Text(title, style = MaterialTheme.typography.bodyMedium)
        }
        TextButton(onClick = onClick) {
            Text(if (granted) "مفعل" else "تفعيل")
        }
    }
}

@Composable
private fun AccessibilityConfigTab(
    settings: MonitorSettings,
    onUpdate: ((MonitorSettings) -> MonitorSettings) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("إعدادات التفاعل مع واجهة ساموراي", fontWeight = FontWeight.Bold)

        OutlinedTextField(
            value = settings.targetAppPackage,
            onValueChange = { v -> onUpdate { it.copy(targetAppPackage = v) } },
            label = { Text("معرّف حزمة تطبيق ساموراي (Package Name)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = settings.targetKeywords,
            onValueChange = { v -> onUpdate { it.copy(targetKeywords = v) } },
            label = { Text("الكلمات المفتاحية لزر الحجز (مفصولة بفاصلة)") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 2
        )

        OutlinedTextField(
            value = settings.targetViewId,
            onValueChange = { v -> onUpdate { it.copy(targetViewId = v) } },
            label = { Text("معرّف الزر اختياري (View ID مثل com.samurai.courier:id/btnBook)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = settings.tapX.toInt().toString(),
                onValueChange = { v ->
                    v.toFloatOrNull()?.let { x -> onUpdate { it.copy(tapX = x) } }
                },
                label = { Text("إحداثي X") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            OutlinedTextField(
                value = settings.tapY.toInt().toString(),
                onValueChange = { v ->
                    v.toFloatOrNull()?.let { y -> onUpdate { it.copy(tapY = y) } }
                },
                label = { Text("إحداثي Y") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("النقر على الإحداثيات كخيار احتياطي")
            Switch(
                checked = settings.useCoordinateFallback,
                onCheckedChange = { checked -> onUpdate { it.copy(useCoordinateFallback = checked) } }
            )
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("فتح تطبيق ساموراي تلقائياً قبل الموعد بـ 2.5 ثانية")
            Switch(
                checked = settings.autoLaunchSamurai,
                onCheckedChange = { checked -> onUpdate { it.copy(autoLaunchSamurai = checked) } }
            )
        }
    }
}

@Composable
private fun ApiConfigTab(
    settings: MonitorSettings,
    onUpdate: ((MonitorSettings) -> MonitorSettings) -> Unit,
    onTestPreWarm: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("إعدادات محرك طلبات الشبكة (API Burst)", fontWeight = FontWeight.Bold)

        OutlinedTextField(
            value = settings.apiEndpointUrl,
            onValueChange = { v -> onUpdate { it.copy(apiEndpointUrl = v) } },
            label = { Text("رابط Endpoint للحجز") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = settings.apiMethod,
            onValueChange = { v -> onUpdate { it.copy(apiMethod = v.uppercase()) } },
            label = { Text("نوع الطلب (POST / PUT / GET)") },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true
        )

        OutlinedTextField(
            value = settings.apiHeadersJson,
            onValueChange = { v -> onUpdate { it.copy(apiHeadersJson = v) } },
            label = { Text("الترويسات Headers (JSON)") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )

        OutlinedTextField(
            value = settings.apiPayloadJson,
            onValueChange = { v -> onUpdate { it.copy(apiPayloadJson = v) } },
            label = { Text("جسم الطلب Payload (JSON)") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = settings.burstCount.toString(),
                onValueChange = { v ->
                    v.toIntOrNull()?.let { c -> onUpdate { it.copy(burstCount = c.coerceIn(1, 10)) } }
                },
                label = { Text("عدد الدفعات") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
            OutlinedTextField(
                value = settings.burstIntervalMs.toString(),
                onValueChange = { v ->
                    v.toLongOrNull()?.let { ms -> onUpdate { it.copy(burstIntervalMs = ms.coerceIn(0L, 1000L)) } }
                },
                label = { Text("الفاصل (ms)") },
                modifier = Modifier.weight(1f),
                singleLine = true
            )
        }

        Button(
            onClick = onTestPreWarm,
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Bolt, contentDescription = null)
            Spacer(Modifier.width(6.dp))
            Text("اختبار تسخين الاتصال (TLS Pre-warm)")
        }
    }
}

@Composable
private fun LogsTab(
    logs: List<${pkg}.data.LogEntry>,
    onClear: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("سجل العمليات الدقيق (\${logs.size})", fontWeight = FontWeight.Bold)
            TextButton(onClick = onClear) {
                Icon(Icons.Default.Delete, contentDescription = null)
                Spacer(Modifier.width(4.dp))
                Text("مسح")
            }
        }
        Spacer(Modifier.height(8.dp))
        if (logs.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    "لا توجد عمليات مسجلة بعد. فعّل المراقب أو اختبر الاتصال.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                items(logs, key = { it.id }) { entry ->
                    val color = when (entry.level) {
                        LogLevel.SUCCESS -> Color(0xFF10B981)
                        LogLevel.WARN -> Color(0xFFF59E0B)
                        LogLevel.ERROR -> Color(0xFFEF4444)
                        LogLevel.INFO -> MaterialTheme.colorScheme.onSurface
                    }
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        shape = MaterialTheme.shapes.small,
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Column(modifier = Modifier.fillMaxWidth().padding(10.dp)) {
                            Text(
                                text = entry.timestamp,
                                fontFamily = FontFamily.Monospace,
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = entry.message,
                                style = MaterialTheme.typography.bodySmall,
                                color = color
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun formatDurationMs(ms: Long): String {
    val hours = ms / 3_600_000L
    val minutes = (ms % 3_600_000L) / 60_000L
    val seconds = (ms % 60_000L) / 1_000L
    val millis = ms % 1_000L
    return String.format(Locale.US, "%02d:%02d:%02d.%03d", hours, minutes, seconds, millis)
}
`;

  return [
    {
      path: `${baseJavaDir}/config/AppConfig.kt`,
      name: 'AppConfig.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'ملف الثوابت والإعدادات الافتراضية المدمجة في التطبيق (التوقيت، الحزمة، الكلمات المفتاحية، API).',
      content: appConfigKt,
    },
    {
      path: `${baseJavaDir}/data/LogRepository.kt`,
      name: 'LogRepository.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'مخزن سجلات التنفيذ الفوري بدقة المللي ثانية.',
      content: logRepositoryKt,
    },
    {
      path: `${baseJavaDir}/data/PrefsManager.kt`,
      name: 'PrefsManager.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'إدارة الإعدادات الدائمة عبر SharedPreferences وتدفق StateFlow التفاعلي.',
      content: prefsManagerKt,
    },
    {
      path: `${baseJavaDir}/time/NtpTimeSync.kt`,
      name: 'NtpTimeSync.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'عميل SNTP عبر UDP لقياس فارق التوقيت الذري بدقة أجزاء الثانية.',
      content: ntpTimeSyncKt,
    },
    {
      path: `${baseJavaDir}/network/ApiBookingEngine.kt`,
      name: 'ApiBookingEngine.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'محرك OkHttp لتسخين اتصال TLS وإرسال دفعات طلبات الحجز المتزامنة.',
      content: apiBookingEngineKt,
    },
    {
      path: `${baseJavaDir}/accessibility/SamuraiAccessibilityService.kt`,
      name: 'SamuraiAccessibilityService.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'خدمة الوصول لاكتشاف زر الحجز في واجهة ساموراي والنقر عليه فوراً أو بالإحداثيات.',
      content: accessibilityServiceKt,
    },
    {
      path: `${baseJavaDir}/receiver/AlarmTriggerReceiver.kt`,
      name: 'AlarmTriggerReceiver.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'مستقبل المنبه الدقيق لإيقاظ الجهاز من وضع السكون (Doze Mode) قبل الموعد.',
      content: alarmTriggerReceiverKt,
    },
    {
      path: `${baseJavaDir}/service/ShiftMonitorService.kt`,
      name: 'ShiftMonitorService.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'الخدمة الرئيسية في الخلفية: WakeLock + تسخين TLS + حلقة الانتظار النانوية + إطلاق الحجز.',
      content: shiftMonitorServiceKt,
    },
    {
      path: `${baseJavaDir}/service/FloatingOverlayService.kt`,
      name: 'FloatingOverlayService.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'النافذة العائمة فوق تطبيق ساموراي مع مؤشر تصويب لحفظ إحداثيات زر الحجز.',
      content: floatingOverlayServiceKt,
    },
    {
      path: `${baseJavaDir}/ui/theme/Theme.kt`,
      name: 'Theme.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'ألوان وتصميم Material 3 الداكن لتطبيق الأندرويد.',
      content: themeKt,
    },
    {
      path: `${baseJavaDir}/ui/MainActivity.kt`,
      name: 'MainActivity.kt',
      language: 'kotlin',
      category: 'kotlin',
      description: 'الواجهة الكاملة بـ Jetpack Compose (RTL عربي) للمؤقت والصلاحيات وإعدادات الواجهة والـ API والسجل.',
      content: mainActivityKt,
    },
  ];
}
