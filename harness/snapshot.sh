#!/bin/bash
# ============================================================
# CC Assistant - 快照管理脚本
# 用于保存和恢复任务状态，防止断点丢失
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SNAPSHOT_DIR="$PROJECT_ROOT/harness/snapshots"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 颜色输出函数
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 创建快照
create_snapshot() {
    local task_id="${1:-$(date +%Y%m%d_%H%M%S)}"
    local description="${2:-}"
    local snapshot_path="$SNAPSHOT_DIR/$task_id"

    info "创建快照: $task_id"

    # 创建快照目录
    mkdir -p "$snapshot_path"

    # 保存 git 状态
    git stash push -m "Auto snapshot: $task_id" > /dev/null 2>&1 || true

    # 复制源码
    info "保存源码..."
    rsync -a --exclude='.gradle' --exclude='build' --exclude='.idea' \
          --exclude='*.class' --exclude='.git' \
          "$PROJECT_ROOT/src" "$snapshot_path/"

    # 复制构建配置
    cp "$PROJECT_ROOT/build.gradle.kts" "$snapshot_path/"
    cp "$PROJECT_ROOT/settings.gradle.kts" "$snapshot_path/"

    # 复制 Harness 配置
    cp -r "$PROJECT_ROOT/harness" "$snapshot_path/harness_copy" 2>/dev/null || true

    # 创建元数据
    cat > "$snapshot_path/metadata.json" << EOF
{
    "task_id": "$task_id",
    "description": "$description",
    "created_at": "$(date -Iseconds)",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "gradle_version": "$(./gradlew --version 2>/dev/null | head -1 || echo 'unknown')"
}
EOF

    # 保存状态摘要
    git status --short > "$snapshot_path/git_status.txt" 2>/dev/null || true
    git stash list > "$snapshot_path/stash_list.txt" 2>/dev/null || true

    success "快照已保存: $snapshot_path"
    echo ""
    echo "  快照ID: $task_id"
    echo "  位置: $snapshot_path"
    echo ""
    echo "恢复命令: $0 restore $task_id [下一任务描述]"
}

# 列出快照
list_snapshots() {
    info "可用快照:"

    if [ ! -d "$SNAPSHOT_DIR" ] || [ -z "$(ls -A "$SNAPSHOT_DIR" 2>/dev/null)" ]; then
        warn "没有找到快照"
        return
    fi

    echo ""
    printf "  %-25s %-20s %s\n" "快照ID" "创建时间" "描述"
    printf "  %-25s %-20s %s\n" "--------" "--------" "----"

    for snapshot in "$SNAPSHOT_DIR"/*/; do
        if [ -d "$snapshot" ]; then
            local id=$(basename "$snapshot")
            local metadata="$snapshot/metadata.json"

            if [ -f "$metadata" ]; then
                local created=$(grep -o '"created_at"[[:space:]]*:[[:space:]]*"[^"]*"' "$metadata" | cut -d'"' -f4 | head -c10)
                local desc=$(grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' "$metadata" | cut -d'"' -f4 | head -c40)

                printf "  ${BLUE}%-25s${NC} %-20s %s\n" "$id" "$created" "${desc:-无描述}"
            else
                printf "  ${BLUE}%-25s${NC} %-20s %s\n" "$id" "unknown" "无元数据"
            fi
        fi
    done
    echo ""
}

# 恢复快照
restore_snapshot() {
    local task_id="$1"
    local next_task="${2:-}"
    local snapshot_path="$SNAPSHOT_DIR/$task_id"

    if [ ! -d "$snapshot_path" ]; then
        error "快照不存在: $task_id"
        list_snapshots
        exit 1
    fi

    info "恢复快照: $task_id"

    # 读取元数据
    if [ -f "$snapshot_path/metadata.json" ]; then
        echo ""
        echo "  快照信息:"
        grep -o '"[^"]*":[[:space:]]*"[^"]*"' "$snapshot_path/metadata.json" | while read line; do
            echo "    $line"
        done
        echo ""
    fi

    # 确认操作
    read -p "确认恢复此快照? 这将覆盖当前工作目录 (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        info "取消恢复"
        exit 0
    fi

    # 恢复源码
    info "恢复源码..."
    rsync -a --exclude='.gradle' --exclude='build' --exclude='.idea' \
          "$snapshot_path/src/" "$PROJECT_ROOT/src/"

    # 恢复构建配置
    cp "$snapshot_path/build.gradle.kts" "$PROJECT_ROOT/"
    cp "$snapshot_path/settings.gradle.kts" "$PROJECT_ROOT/"

    # 恢复 git stash
    info "恢复 Git stash..."
    git stash pop > /dev/null 2>&1 || true

    # 创建恢复标记
    cat > "$snapshot_path/restored_at.txt" << EOF
Restored at: $(date -Iseconds)
Next task: $next_task
EOF

    success "快照已恢复"
    echo ""
    echo "  当前目录已恢复到快照: $task_id"
    echo "  下一任务: ${next_task:-未指定}"
    echo ""
    echo "请运行以下命令继续:"
    echo "  ${YELLOW}./harness/snapshot.sh status${NC}"
}

# 删除快照
delete_snapshot() {
    local task_id="$1"

    if [ ! -d "$SNAPSHOT_DIR/$task_id" ]; then
        error "快照不存在: $task_id"
        exit 1
    fi

    read -p "确认删除快照 '$task_id'? (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        info "取消删除"
        exit 0
    fi

    rm -rf "$SNAPSHOT_DIR/$task_id"
    success "快照已删除: $task_id"
}

# 显示状态
show_status() {
    echo ""
    echo "=============================================="
    echo "  CC Assistant - 当前状态"
    echo "=============================================="
    echo ""

    echo "  Git 状态:"
    git status --short 2>/dev/null | head -5
    echo ""

    echo "  最近提交:"
    git log --oneline -3 2>/dev/null || echo "    无提交记录"
    echo ""

    echo "  Stash:"
    local stash_count=$(git stash list 2>/dev/null | wc -l)
    if [ "$stash_count" -gt 0 ]; then
        git stash list 2>/dev/null | head -3
    else
        echo "    无 stash"
    fi
    echo ""

    echo "  可用快照: $(ls -d "$SNAPSHOT_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ')"
    echo ""
}

# 导出快照
export_snapshot() {
    local task_id="$1"
    local snapshot_path="$SNAPSHOT_DIR/$task_id"

    if [ ! -d "$snapshot_path" ]; then
        error "快照不存在: $task_id"
        exit 1
    fi

    local export_file="$PROJECT_ROOT/harness/${task_id}.tar.gz"
    info "导出快照到: $export_file"

    tar -czf "$export_file" -C "$SNAPSHOT_DIR" "$task_id"
    success "导出完成: $export_file"
}

# 导入快照
import_snapshot() {
    local import_file="$1"
    local task_id="$(basename "$import_file" .tar.gz)"

    if [ ! -f "$import_file" ]; then
        error "文件不存在: $import_file"
        exit 1
    fi

    info "导入快照: $import_file"
    tar -xzf "$import_file" -C "$SNAPSHOT_DIR"

    success "导入完成: $task_id"
}

# 清理旧快照
cleanup_old() {
    local max_snapshots="${1:-10}"

    info "清理旧快照，保留最近 $max_snapshots 个"

    local count=$(ls -d "$SNAPSHOT_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ')
    if [ "$count" -le "$max_snapshots" ]; then
        success "快照数量在限制内，无需清理"
        return
    fi

    local to_delete=$((count - max_snapshots))
    info "将删除 $to_delete 个旧快照"

    ls -dt "$SNAPSHOT_DIR"/*/ 2>/dev/null | tail -n "$to_delete" | while read dir; do
        rm -rf "$dir"
        echo "  已删除: $(basename "$dir")"
    done

    success "清理完成"
}

# 显示帮助
show_help() {
    cat << EOF
CC Assistant 快照管理工具

用法: $0 <命令> [参数]

命令:
  save <任务ID> [描述]    保存当前状态为快照
  list                    列出所有快照
  restore <任务ID> [下一任务]  恢复指定快照
  delete <任务ID>          删除快照
  export <任务ID>          导出会话为压缩包
  import <文件>            导入快照压缩包
  status                  显示当前状态
  cleanup [数量]          清理旧快照（默认保留10个）

示例:
  $0 save feature-chat-panel "实现聊天面板初步结构"
  $0 list
  $0 restore feature-chat-panel "继续完善消息渲染"
  $0 cleanup 5

快照位置: $SNAPSHOT_DIR
EOF
}

# 主逻辑
case "${1:-}" in
    save)
        create_snapshot "$2" "$3"
        ;;
    list)
        list_snapshots
        ;;
    restore)
        restore_snapshot "$2" "$3"
        ;;
    delete)
        delete_snapshot "$2"
        ;;
    export)
        export_snapshot "$2"
        ;;
    import)
        import_snapshot "$2"
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup_old "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
