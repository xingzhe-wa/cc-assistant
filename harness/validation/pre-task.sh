#!/bin/bash
# ============================================================
# CC Assistant - 任务前验证脚本
# 在开始任何编码任务前必须通过此检查
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  CC Assistant - 任务前检查"
echo "=============================================="
echo ""

# 检查函数
check() {
    local name="$1"
    local command="$2"

    echo -n "检查 $name... "
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        return 1
    fi
}

fail_count=0

# 1. 环境检查
echo ">>> 环境验证"
echo "----------------------------------------------"

check "Gradle Wrapper" "test -f '$PROJECT_ROOT/gradlew'"
check "Java" "java -version > /dev/null 2>&1"
check "Kotlin 插件" "test -d '$PROJECT_ROOT/.gradle'"

# 检查 Java 版本
java_version=$(java -version 2>&1 | head -1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$java_version" -ge 21 ]; then
    echo -e "Java 版本 $java_version... ${GREEN}✓${NC}"
else
    echo -e "Java 版本 $java_version... ${RED}✗ 需要 21+${NC}"
    ((fail_count++))
fi

echo ""

# 2. 项目结构检查
echo ">>> 项目结构验证"
echo "----------------------------------------------"

check "主源码目录" "test -d '$PROJECT_ROOT/src/main/kotlin'"
check "测试源码目录" "test -d '$PROJECT_ROOT/src/test/kotlin'"
check "资源目录" "test -d '$PROJECT_ROOT/src/main/resources'"
check "plugin.xml" "test -f '$PROJECT_ROOT/src/main/resources/META-INF/plugin.xml'"
check "build.gradle.kts" "test -f '$PROJECT_ROOT/build.gradle.kts'"

echo ""

# 3. 依赖检查
echo ">>> 依赖验证"
echo "----------------------------------------------"

# 检查 Gradle 能否解析依赖
cd "$PROJECT_ROOT"
if ./gradlew dependencies --configuration compileClasspath > /dev/null 2>&1; then
    echo -e "Gradle 依赖解析... ${GREEN}✓${NC}"
else
    echo -e "Gradle 依赖解析... ${RED}✗${NC}"
    ((fail_count++))
fi

echo ""

# 4. 代码质量基础检查
echo ">>> 代码质量基础检查"
echo "----------------------------------------------"

# 检查是否有明显错误（语法错误、缺失文件引用等）
if grep -r "TODO.*FIXME\|FIXME.*TODO" "$PROJECT_ROOT/src" --include="*.kt" -l 2>/dev/null | head -5; then
    echo -e "发现 TODO/FIXME 标记... ${YELLOW}⚠${NC}"
fi

# 检查是否有可疑的硬编码密钥
if grep -r "sk-ant\|sk-\|api.*key.*=" "$PROJECT_ROOT/src" --include="*.kt" 2>/dev/null | grep -v "example\|test\|mock" | head -1; then
    echo -e "${RED}发现疑似硬编码密钥！${NC}"
    ((fail_count++))
fi

echo ""

# 5. 测试框架检查
echo ">>> 测试框架验证"
echo "----------------------------------------------"

check "测试数据目录" "test -d '$PROJECT_ROOT/src/test/testData'"
check "示例测试" "test -f '$PROJECT_ROOT/src/test/kotlin/com/github/xingzhewa/ccassistant/MyPluginTest.kt'"

echo ""

# 6. Harness 配置检查
echo ">>> Harness 配置验证"
echo "----------------------------------------------"

check "Harness 目录" "test -d '$PROJECT_ROOT/harness'"
check "约束文件" "test -f '$PROJECT_ROOT/harness/constraints.md'"
check "检查点配置" "test -f '$PROJECT_ROOT/harness/harness.yaml'"

echo ""
echo "=============================================="

# 总结
if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ 所有检查通过，环境就绪${NC}"
    echo "=============================================="
    exit 0
else
    echo -e "${RED}✗ $fail_count 项检查失败${NC}"
    echo "请修复上述问题后重试"
    echo "=============================================="
    exit 1
fi
