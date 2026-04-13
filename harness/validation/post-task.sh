#!/bin/bash
# ============================================================
# CC Assistant - 任务后验证脚本
# 完成任务后必须通过此检查才能提交
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKPOINT_ID="${1:-}"
TASK_SUMMARY="${2:-}"

echo "=============================================="
echo "  CC Assistant - 任务后验证"
echo "=============================================="
if [ -n "$CHECKPOINT_ID" ]; then
    echo "  检查点: $CHECKPOINT_ID"
fi
echo ""

fail_count=0

# 1. 编译检查
echo ">>> 1. 编译检查"
echo "----------------------------------------------"
cd "$PROJECT_ROOT"

echo -n "编译 Kotlin... "
if ./gradlew compileKotlin --warning-mode=none > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ 编译失败${NC}"
    ((fail_count++))
fi

# 2. 测试检查
echo ""
echo ">>> 2. 测试检查"
echo "----------------------------------------------"

echo -n "运行单元测试... "
if ./gradlew test --warning-mode=none > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ 测试失败${NC}"
    ((fail_count++))
fi

# 3. 代码质量检查
echo ""
echo ">>> 3. 代码质量检查"
echo "----------------------------------------------"

echo -n "Kotlin Lint... "
if ./gradlew lintKotlin --warning-mode=none > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ 有警告（可忽略强制错误）${NC}"
fi

# 4. 插件验证
echo ""
echo ">>> 4. 插件验证"
echo "----------------------------------------------"

echo -n "插件配置验证... "
if ./gradlew verifyPlugin --warning-mode=none > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ 插件配置无效${NC}"
    ((fail_count++))
fi

# 5. 安全扫描（快速检查）
echo ""
echo ">>> 5. 安全检查"
echo "----------------------------------------------"

# 检查是否有新的敏感信息泄露
if grep -rn "sk-ant\|sk-\|password\s*=" "$PROJECT_ROOT/src" --include="*.kt" 2>/dev/null | grep -v "example\|test\|mock\|TODO" | grep -v "\.example\."; then
    echo -e "${RED}✗ 发现疑似硬编码敏感信息${NC}"
    ((fail_count++))
else
    echo -e "敏感信息检查... ${GREEN}✓${NC}"
fi

# 6. 文件完整性检查
echo ""
echo ">>> 6. 文件完整性检查"
echo "----------------------------------------------"

# 检查是否有新增文件未追踪
untracked=$(git status --porcelain 2>/dev/null | grep "^??" | wc -l)
if [ "$untracked" -gt 0 ]; then
    echo -e "${YELLOW}⚠ 有 $untracked 个未追踪的新文件${NC}"
    echo "    请确认是否需要添加到 .gitignore"
fi

# 检查是否有删除了重要文件
if git status --porcelain 2>/dev/null | grep -q "^ D "; then
    deleted=$(git status --porcelain 2>/dev/null | grep "^ D " | wc -l)
    if [ "$deleted" -gt 0 ]; then
        echo -e "${YELLOW}⚠ 有 $deleted 个文件被删除${NC}"
    fi
fi

echo ""

# 7. 检查点验证
if [ -n "$CHECKPOINT_ID" ]; then
    echo ">>> 7. 检查点 [$CHECKPOINT_ID] 验证"
    echo "----------------------------------------------"

    case "$CHECKPOINT_ID" in
        cp-1-*)
            echo "Phase 1 检查: 脚手架"
            ./gradlew assemble || ((fail_count++))
            ;;
        cp-2-*)
            echo "Phase 2 检查: 核心模块"
            ./gradlew test --tests '*ServiceTest' || ((fail_count++))
            ;;
        cp-3-*)
            echo "Phase 3 检查: 功能集成"
            ./gradlew check || ((fail_count++))
            ;;
        cp-4-*)
            echo "Phase 4 检查: 端到端"
            ./gradlew build || ((fail_count++))
            ;;
    esac
fi

echo ""
echo "=============================================="

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ 任务后验证通过${NC}"
    echo "=============================================="
    exit 0
else
    echo -e "${RED}✗ $fail_count 项验证失败${NC}"
    echo "请修复上述问题后重试"
    echo "=============================================="
    exit 1
fi
