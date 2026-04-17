package com.github.xingzhewa.ccassistant.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.application.ApplicationManager
import org.jetbrains.annotations.NotNull
import java.time.LocalDate

/**
 * Token 使用量统计服务
 *
 * 记录会话和每日的 Token 使用情况，支持成本计算
 */
@Service(Service.Level.APP)
class UsageService {

    private val sessionUsages = mutableMapOf<String, SessionUsage>()
    private val dailyUsages = mutableMapOf<LocalDate, DailyUsage>()

    companion object {
        /**
         * 获取使用量统计服务实例
         */
        fun getInstance(): UsageService =
            ApplicationManager.getApplication().getService(UsageService::class.java)
    }

    /**
     * 记录 Token 使用量
     *
     * @param sessionId 会话 ID
     * @param costUsd 成本 (USD)
     * @param model 模型名称
     * @param provider 提供商
     */
    fun recordUsage(sessionId: String, costUsd: Double, model: String, provider: String) {
        // 会话级统计
        val sessionUsage = sessionUsages.getOrPut(sessionId) { SessionUsage(sessionId) }
        sessionUsage.totalCost += costUsd
        sessionUsage.messageCount++

        // 日级统计
        val today = LocalDate.now()
        val dailyUsage = dailyUsages.getOrPut(today) { DailyUsage(today) }
        dailyUsage.totalCost += costUsd
        dailyUsage.messageCount++

        // 按模型统计
        dailyUsage.modelBreakdown[model] = (dailyUsage.modelBreakdown[model] ?: 0.0) + costUsd

        // 事件发布 - 简化版本（可选扩展）
        // ApplicationManager.getApplication().messageBus
        //     .syncPublisher(UsageTopics.USAGE_UPDATED)
        //     .onUsageUpdated(sessionId, sessionUsage)
    }

    /**
     * 获取会话使用量
     *
     * @param sessionId 会话 ID
     * @return 会话使用量
     */
    @NotNull
    fun getSessionUsage(sessionId: String): SessionUsage {
        return sessionUsages.getOrPut(sessionId) { SessionUsage(sessionId) }
    }

    /**
     * 获取日使用量
     *
     * @param date 日期
     * @return 日使用量
     */
    @NotNull
    fun getDailyUsage(date: LocalDate = LocalDate.now()): DailyUsage {
        return dailyUsages.getOrPut(date) { DailyUsage(date) }
    }

    /**
     * 获取今日使用量
     */
    @NotNull
    fun getTodayUsage(): DailyUsage = getDailyUsage(LocalDate.now())

    /**
     * 获取使用报告
     *
     * @param days 统计天数
     * @return 使用报告
     */
    @NotNull
    fun getUsageReport(days: Int = 7): UsageReport {
        val history = (0 until days).map { daysAgo ->
            getDailyUsage(LocalDate.now().minusDays(daysAgo.toLong()))
        }.filter { it.messageCount > 0 }

        return UsageReport(
            totalCost = history.sumOf { it.totalCost },
            totalMessages = history.sumOf { it.messageCount },
            dailyBreakdown = history.reversed(),
            modelBreakdown = history.flatMap { it.modelBreakdown.entries }
                .groupBy { it.key }
                .mapValues { entry -> entry.value.sumOf { it.value } }
                .toMutableMap()
        )
    }

    /**
     * 计算成本
     *
     * @param model 模型名称
     * @param inputTokens 输入 Token 数
     * @param outputTokens 输出 Token 数
     * @return 成本 (USD)
     */
    fun calculateCost(model: String, inputTokens: Int, outputTokens: Int): Double {
        val pricing = getPricing(model)
        return (inputTokens / 1_000_000.0) * pricing.inputPrice +
                (outputTokens / 1_000_000.0) * pricing.outputPrice
    }

    /**
     * 获取模型定价
     */
    private fun getPricing(model: String): Pricing {
        return when {
            model.contains("opus") -> Pricing(15.0, 75.0)
            model.contains("sonnet") -> Pricing(3.0, 15.0)
            model.contains("haiku") -> Pricing(0.8, 4.0)
            else -> Pricing(3.0, 15.0) // 默认定价
        }
    }

    /**
     * 清除会话统计
     */
    fun clearSessionUsage(sessionId: String) {
        sessionUsages.remove(sessionId)
    }

    /**
     * 清除日统计
     */
    fun clearDailyUsage(date: LocalDate = LocalDate.now()) {
        dailyUsages.remove(date)
    }
}

/**
 * 会话使用量
 *
 * @param sessionId 会话 ID
 * @param totalCost 总成本
 * @param messageCount 消息数
 */
data class SessionUsage(
    val sessionId: String,
    var totalCost: Double = 0.0,
    var messageCount: Int = 0
)

/**
 * 日使用量
 *
 * @param date 日期
 * @param totalCost 总成本
 * @param messageCount 消息数
 * @param modelBreakdown 按模型统计
 */
data class DailyUsage(
    val date: LocalDate,
    var totalCost: Double = 0.0,
    var messageCount: Int = 0,
    val modelBreakdown: MutableMap<String, Double> = mutableMapOf()
)

/**
 * 使用报告
 *
 * @param totalCost 总成本
 * @param totalMessages 总消息数
 * @param dailyBreakdown 日统计
 * @param modelBreakdown 按模型统计
 */
data class UsageReport(
    val totalCost: Double,
    val totalMessages: Int,
    val dailyBreakdown: List<DailyUsage>,
    val modelBreakdown: MutableMap<String, Double>
)

/**
 * 模型定价
 *
 * @param inputPrice 输入价格 (per 1M tokens)
 * @param outputPrice 输出价格 (per 1M tokens)
 */
data class Pricing(
    val inputPrice: Double,
    val outputPrice: Double
)