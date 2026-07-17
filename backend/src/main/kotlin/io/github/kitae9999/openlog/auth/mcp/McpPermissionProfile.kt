package io.github.kitae9999.openlog.auth.mcp

enum class McpPermissionProfile(val wireValue: String) {
    READ_ONLY("read-only"),
    SAFE_WRITE("safe-write"),
    FULL("full"),
    ;

    companion object {
        fun fromWireValue(value: String): McpPermissionProfile = entries.firstOrNull {
            it.wireValue == value
        } ?: throw IllegalArgumentException("지원하지 않는 MCP 권한 프로필입니다.")
    }
}
