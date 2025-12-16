/**
 * 上下文窗口使用情况计算 Hook
 *
 * 参考 Claude Code v2.0.64 的 current_usage 功能
 * 计算当前会话的上下文窗口使用百分比
 */

import { useMemo } from 'react';
import { getContextWindowSize } from '@/lib/tokenCounter';
import { calculateSessionTokenTotals } from '@/lib/tokenExtractor';
import { ContextWindowUsage, ContextUsageLevel, getUsageLevel } from '@/types/contextWindow';
import type { ClaudeStreamMessage } from '@/types/claude';

export interface UseContextWindowUsageResult extends ContextWindowUsage {
  /** 使用级别 */
  level: ContextUsageLevel;
  /** 是否有有效数据 */
  hasData: boolean;
  /** 格式化的百分比字符串 */
  formattedPercentage: string;
  /** 格式化的 token 使用字符串 */
  formattedTokens: string;
}

/**
 * 计算上下文窗口使用情况
 *
 * @param messages - 会话消息列表
 * @param model - 当前使用的模型名称
 * @returns 上下文窗口使用情况
 *
 * @example
 * const { percentage, level, formattedPercentage } = useContextWindowUsage(messages, 'sonnet');
 * // percentage: 42.5
 * // level: 'low'
 * // formattedPercentage: '42.5%'
 */
export function useContextWindowUsage(
  messages: ClaudeStreamMessage[],
  model?: string
): UseContextWindowUsageResult {
  return useMemo(() => {
    // 获取上下文窗口大小
    const contextWindowSize = getContextWindowSize(model);

    // 如果没有消息，返回空数据
    if (!messages || messages.length === 0) {
      return {
        currentTokens: 0,
        contextWindowSize,
        percentage: 0,
        breakdown: {
          inputTokens: 0,
          outputTokens: 0,
          cacheCreationTokens: 0,
          cacheReadTokens: 0,
        },
        level: 'low' as ContextUsageLevel,
        hasData: false,
        formattedPercentage: '0%',
        formattedTokens: '0 / 200K',
      };
    }

    // 计算 token 总量
    const totals = calculateSessionTokenTotals(messages);

    // 根据 Claude Code 官方公式计算当前使用量
    // CURRENT_TOKENS = input_tokens + cache_creation_input_tokens + cache_read_input_tokens
    // 注意：不包括 output_tokens，因为输出不占用上下文窗口
    const currentTokens =
      totals.input_tokens +
      totals.cache_creation_tokens +
      totals.cache_read_tokens;

    // 计算百分比
    const percentage = contextWindowSize > 0
      ? Math.min((currentTokens / contextWindowSize) * 100, 100)
      : 0;

    // 获取使用级别
    const level = getUsageLevel(percentage);

    // 格式化显示
    const formattedPercentage = `${percentage.toFixed(1)}%`;
    const formattedTokens = formatTokenCount(currentTokens, contextWindowSize);

    return {
      currentTokens,
      contextWindowSize,
      percentage,
      breakdown: {
        inputTokens: totals.input_tokens,
        outputTokens: totals.output_tokens,
        cacheCreationTokens: totals.cache_creation_tokens,
        cacheReadTokens: totals.cache_read_tokens,
      },
      level,
      hasData: true,
      formattedPercentage,
      formattedTokens,
    };
  }, [messages, model]);
}

/**
 * 格式化 token 数量显示
 * @param current - 当前使用量
 * @param total - 总量
 * @returns 格式化的字符串，如 "15.5K / 200K"
 */
function formatTokenCount(current: number, total: number): string {
  const formatK = (n: number): string => {
    if (n >= 1000000) {
      return `${(n / 1000000).toFixed(1)}M`;
    }
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1)}K`;
    }
    return n.toString();
  };

  return `${formatK(current)} / ${formatK(total)}`;
}

export default useContextWindowUsage;
