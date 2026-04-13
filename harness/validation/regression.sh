#!/bin/bash
# ============================================================
# CC Assistant - 回归测试脚本
# 合并前必须通过全量回归测试
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=============================================="
echo "  CC Assistant - 回归测试"
echo "=============================================="
echo ""

fail_count=0
warn_count=0

cd "$PROJECT_ROOT"

# 1. 清理并重新构建
echo ">>> 1. 清洁构建"
echo "----------------------------------------------"
echo -n "清理 build 目录... "
./gradlew clean > /dev/null 2>&1
echo -e "${GREEN}✓${NC}"

echo -n "完整构建... "
if ./gradlew build --warning-mode=none > /tmp/build.log 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ 构建失败${NC}"
    cat /tmp/build.log | tail -20
    ((fail_count++))
fi

# 2. 全部测试
echo ""
echo ">>> 2. 测试套件"
echo "----------------------------------------------"

echo -n "运行所有测试... "
if ./gradlew test --warning-mode=none > /tmp/test.log 2>&1; then
    echo -e "${GREEN}✓${NC}"

    # 获取测试覆盖率
    if [ -f "build/reports/kover-report/xml/report.xml" ]; then
        coverage=$(grep -o 'counter type="LINE" missed="[0-9]*" covered="[0-9]*"' build/reports/kover-report/xml/report.xml | head -1)
        if [ -n "$coverage" ]; then
            echo "    覆盖率: $coverage"
        fi
    fi
else
    echo -e "${RED}✗ 测试失败${NC}"
    cat /tmp/test.log | tail -30
    ((fail_count++))
fi

# 3. 静态分析
echo ""
echo ">>> 3. 静态分析"
echo "----------------------------------------------"

echo -n "Kotlin Lint... "
if ./gradlew lintKotlin --warning-mode=none > /tmp/lint.log 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    lint_errors=$(grep -c "error:" /tmp/lint.log 2>/dev/null || echo "0")
    if [ "$lint_errors" -gt 0 ]; then
        echo -e "${RED}✗ 发现 $lint_errors 个错误${NC}"
        ((fail_count++))
    else
        echo -e "${YELLOW}⚠ 有警告${NC}"
        ((warn_count++))
    fi
fi

echo -n "Qodana 扫描... "
if ./gradlew qodana --warning-mode=none > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ Qodana 发现问题${NC}"
    ((warn_count++))
fi

# 4. 插件验证
echo ""
echo ">>> 4. 插件验证"
echo "----------------------------------------------"

echo -n "插件完整性验证... "
if ./gradlew verifyPlugin --warning-mode=none > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗ 插件验证失败${NC}"
    ((fail_count++))
fi

echo -n "插件签名检查... "
if ./gradlew signPlugin --warning-mode=none > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ 未配置签名（发布前必须配置）${NC}"
    ((warn_count++))
fi

# 5. 依赖检查
echo ""
echo ">>> 5. 依赖安全检查"
echo "----------------------------------------------"

echo -n "依赖漏洞扫描... "
if ./gradlew dependencyCheckAnalyze --warning-mode=none > /dev/null 2>&1; then
    if [ -f "build/reports/dependency-check-report.html" ]; then
        vulnerabilities=$(grep -c "vulnerability" build/reports/dependency-check-report.html 2>/dev/null || echo "0")
        if [ "$vulnerabilities" -gt 0 ]; then
            echo -e "${YELLOW}⚠ 发现 $vulnerabilities 个漏洞${NC}"
            ((warn_count++))
        else
            echo -e "${GREEN}✓ 无已知漏洞${NC}"
        fi
    else
        echo -e "${GREEN}✓${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 扫描未完成${NC}"
    ((warn_count++))
fi

# 6. 代码变更检查
echo ""
echo ">>> 6. 代码变更检查"
echo "----------------------------------------------"

# 检查是否有重大变更
changed_files=$(git diff --name-only HEAD~1 2>/dev/null | wc -l)
echo "    自上次提交变更: $changed_files 个文件"

# 检查是否修改了核心文件
core_files_modified=false
for file in "src/main/kotlin/com/github/xingzhewa/ccassistant/toolWindow/MyToolWindowFactory.kt" \
            "src/main/kotlin/com/github/xingzhewa/ccassistant/services/MyProjectService.kt" \
            "src/main/resources/META-INF/plugin.xml"; do
    if git diff --name-only HEAD~1 2>/dev/null | grep -q "$file"; then
        echo -e "    ${YELLOW}⚠ 核心文件变更: $file${NC}"
        core_files_modified=true
    fi
done

if [ "$core_files_modified" = true ]; then
    echo -e "    ${YELLOW}建议进行人工 Code Review${NC}"
fi

# 7. 性能基准（可选）
echo ""
echo ">>> 7. 构建性能"
echo "----------------------------------------------"

build_time=$(grep "BUILD SUCCESSFUL" -A 1 /tmp/build.log 2>/dev/null | grep "in" | sed 's/.*in //' || echo "unknown")
echo "    构建耗时: $build_time"

echo ""
echo "=============================================="
echo "  回归测试结果汇总"
echo "=============================================="
echo -e "  失败: ${RED}$fail_count${NC}"
echo -e "  警告: ${YELLOW}$warn_count${NC}"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ 回归测试通过${NC}"
    echo "可以安全合并"
    echo "=============================================="
    exit 0
else
    echo -e "${RED}✗ 回归测试失败${NC}"
    echo "请修复失败项后重试"
    echo "=============================================="
    exit 1
fi
