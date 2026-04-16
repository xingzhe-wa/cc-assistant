package com.github.xingzhewa.ccassistant.ui.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import org.jetbrains.jewel.bridge.addComposeTab
import org.jetbrains.jewel.markdown.LazyMarkdown
import org.jetbrains.jewel.markdown.processing.MarkdownProcessor

fun registerComposeChatTab(toolWindow: ToolWindow, project: Project) {
    toolWindow.addComposeTab("CC Assistant", isLockable = true) {
        ChatScreen()
    }
}

private object C {
    val bg = Color(0xFF111214)
    val sf = Color(0xFF17181D)
    val ac = Color(0xFFC9873A)
    val fg = Color(0xFFD0D1D8)
    val fg2 = Color(0xFF87899A)
    val fg3 = Color(0xFF494B5A)
    val fg4 = Color(0xFF31333D)
    val bd = Color(0xFF23252E)
    val bd2 = Color(0xFF1B1D24)
}

private data class Msg(val role: String, val content: String)

@Composable
private fun ChatScreen() {
    var input by remember { mutableStateOf("") }
    val msgs = remember {
        mutableStateListOf(
            Msg("user", "帮我实现 SessionService，支持会话的创建、保存、获取、删除功能。"),
            Msg("ai", """
好的，下面是 `SessionService` 的完整实现：

### 数据模型

```kotlin
data class ChatSession(
    val id: String = UUID.randomUUID().toString(),
    val sessionId: String? = null,
    var title: String = "",
    val createdAt: Instant = Clock.System.now(),
    val messages: MutableList<Message> = mutableListOf()
)
```

### 核心实现

```kotlin
class SessionService {
    private val sessionsDir = Path(
        System.getProperty("user.home"), ".claude", "sessions"
    )

    fun createSession(workingDir: String): ChatSession {
        val s = ChatSession(workingDir = workingDir)
        saveSession(s)
        return s
    }
}
```

存储路径 `~/.claude/sessions/{id}.json`。
            """.trimIndent()),
            Msg("user", "帮我加上标题更新方法"),
            Msg("ai", """
```diff
@@ -25,6 +25,11 @@
     fun deleteSession(id: String) =
         sessionsDir.resolve("$" + "id.json").deleteIfExists()

+    fun updateTitle(id: String, newTitle: String) {
+        val s = getSession(id) ?: return
+        saveSession(s.copy(title = newTitle))
+    }
```

已添加 `updateTitle` 方法。
            """.trimIndent())
        )
    }

    Column(modifier = Modifier.fillMaxSize().background(C.bg)) {
        val listState = rememberLazyListState()
        LaunchedEffect(msgs.size) {
            if (msgs.isNotEmpty()) listState.animateScrollToItem(msgs.size - 1)
        }

        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f).padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(msgs) { m ->
                if (m.role == "user") {
                    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterEnd) {
                        Box(Modifier.widthIn(max = 500.dp)
                            .background(C.ac.copy(alpha = 0.08f), RoundedCornerShape(10.dp, 10.dp, 3.dp, 10.dp))
                            .padding(12.dp, 8.dp)
                        ) {
                            BasicText(m.content, style = TextStyle(color = C.fg, fontSize = 13.sp, lineHeight = 22.sp))
                        }
                    }
                } else {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                        Box(Modifier.size(26.dp)
                            .background(Brush.linearGradient(listOf(C.ac, Color(0xFFA06A28))), RoundedCornerShape(5.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            BasicText("C", style = TextStyle(color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold))
                        }
                        Spacer(Modifier.width(9.dp))
                        Column(Modifier.weight(1f)) {
                            val blocks = remember(m.content) { mp.processMarkdownDocument(m.content) }
                            LazyMarkdown(blocks = blocks, modifier = Modifier.fillMaxWidth())
                        }
                    }
                }
            }
        }

        // 输入区
        Column(Modifier.fillMaxWidth().background(C.sf)) {
            Box(Modifier.fillMaxWidth().height(1.dp).background(C.bd2))
            Row(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.weight(1f).heightIn(min = 36.dp, max = 80.dp)
                    .background(C.bg, RoundedCornerShape(10.dp))
                    .drawBehind { drawRoundRect(C.bd, style = Stroke(1.dp.toPx()), cornerRadius = CornerRadius(10.dp.toPx())) }
                    .padding(horizontal = 9.dp, vertical = 7.dp)
                ) {
                    BasicTextField(
                        value = input,
                        onValueChange = { input = it },
                        modifier = Modifier.fillMaxWidth(),
                        textStyle = TextStyle(color = C.fg, fontSize = 13.sp, lineHeight = 20.sp, fontFamily = FontFamily.SansSerif),
                        decorationBox = { inner ->
                            if (input.isEmpty()) BasicText("输入消息...", style = TextStyle(color = C.fg4, fontSize = 13.sp))
                            inner()
                        },
                        singleLine = false, maxLines = 4
                    )
                }
                Spacer(Modifier.width(6.dp))
                Box(Modifier.size(30.dp)
                    .background(if (input.isNotBlank()) C.ac else C.fg4, RoundedCornerShape(5.dp))
                    .then(if (input.isNotBlank()) Modifier.clickable { if (input.isNotBlank()) { msgs.add(Msg("user", input)); input = "" } } else Modifier),
                    contentAlignment = Alignment.Center
                ) {
                    BasicText("\u2191", style = TextStyle(color = C.bg, fontSize = 17.sp))
                }
            }
        }
    }
}

private val mp = MarkdownProcessor()
