/**
 * 阅读内容处理工具类
 * 处理和优化阅读内容的格式化规则
 */

// 替换规则接口
export interface ReplaceRule {
  id: string
  pattern: string      // 要替换的内容
  replacement: string  // 替换为的内容
  isRegex: boolean     // 是否为正则表达式
  enabled: boolean     // 是否启用
  createTime: number   // 创建时间
}

// 内容处理配置
interface ProcessConfig {
  // 缩进处理
  normalizeIndent: boolean      // 是否标准化缩进
  indentSpaces: number          // 段落缩进空格数（默认2个全角空格）

  // 换行处理
  normalizeLineBreaks: boolean  // 是否标准化换行
  maxConsecutiveBreaks: number  // 最大连续换行数

  // 空白处理
  trimLines: boolean            // 是否去除行首尾空白
  removeExtraSpaces: boolean    // 是否移除多余空格
}

// 默认配置
const defaultConfig: ProcessConfig = {
  normalizeIndent: true,
  indentSpaces: 2,
  normalizeLineBreaks: true,
  maxConsecutiveBreaks: 1,
  trimLines: true,
  removeExtraSpaces: true
}

/**
 * 内容处理器类
 */
export class ContentProcessor {
  private config: ProcessConfig
  private replaceRules: ReplaceRule[] = []

  constructor(config?: Partial<ProcessConfig>) {
    this.config = { ...defaultConfig, ...config }
    this.loadReplaceRules()
  }

  /**
   * 加载替换规则
   */
  private loadReplaceRules() {
    try {
      const rules = wx.getStorageSync('replaceRules') as ReplaceRule[]
      if (rules && Array.isArray(rules)) {
        this.replaceRules = rules
      }
    } catch (e) {
      console.error('加载替换规则失败:', e)
      this.replaceRules = []
    }
  }

  /**
   * 处理内容
   */
  process(content: string): string {
    if (!content) return ''

    let result = content

    // 1. 应用用户自定义替换规则
    result = this.applyReplaceRules(result)

    // 2. 标准化换行
    if (this.config.normalizeLineBreaks) {
      result = this.normalizeLineBreaks(result)
    }

    // 3. 标准化缩进
    if (this.config.normalizeIndent) {
      result = this.normalizeIndent(result)
    }

    // 4. 去除多余空格
    if (this.config.removeExtraSpaces) {
      result = this.removeExtraSpaces(result)
    }

    return result
  }

  /**
   * 应用用户自定义替换规则
   */
  private applyReplaceRules(content: string): string {
    let result = content

    for (const rule of this.replaceRules) {
      if (!rule.enabled) continue

      try {
        if (rule.isRegex) {
          const regex = new RegExp(rule.pattern, 'g')
          result = result.replace(regex, rule.replacement)
        } else {
          // 转义特殊字符进行字面量替换
          const escaped = rule.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const regex = new RegExp(escaped, 'g')
          result = result.replace(regex, rule.replacement)
        }
      } catch (e) {
        console.error('替换规则应用失败:', rule, e)
      }
    }

    return result
  }

  /**
   * 标准化换行
   * - 将多个连续换行合并为指定数量
   * - 统一换行符为 \n
   */
  private normalizeLineBreaks(content: string): string {
    // 统一换行符
    let result = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // 合并多个连续换行
    const maxBreaks = this.config.maxConsecutiveBreaks
    const breakPattern = new RegExp(`\\n{${maxBreaks + 1},}`, 'g')
    const replacement = '\n'.repeat(maxBreaks)
    result = result.replace(breakPattern, replacement)

    return result
  }

  /**
   * 标准化缩进
   * - 如果是多个 tab 或空格开头，标准化为统一缩进
   * - 保留段落结构
   */
  private normalizeIndent(content: string): string {
    const lines = content.split('\n')
    const indentStr = '\u3000'.repeat(this.config.indentSpaces) // 使用全角空格

    const processedLines = lines.map(line => {
      // 去除行首空白
      const trimmedLine = this.config.trimLines ? line.trimStart() : line

      // 如果是空行，保持空行
      if (trimmedLine.length === 0) {
        return ''
      }

      // 检查原始行是否有缩进（tab 或多个空格）
      const hasIndent = /^[\t\s\u3000]+/.test(line)

      // 如果原来有缩进，添加标准缩进
      if (hasIndent) {
        return indentStr + trimmedLine
      }

      // 没有缩进的行（可能是段落开始），也添加缩进
      return indentStr + trimmedLine
    })

    return processedLines.join('\n')
  }

  /**
   * 移除多余空格
   * - 将多个连续空格合并为一个
   * - 不处理行首缩进
   */
  private removeExtraSpaces(content: string): string {
    const lines = content.split('\n')

    const processedLines = lines.map(line => {
      // 保留行首空白
      const leadingMatch = line.match(/^[\s\u3000]*/)
      const leading = leadingMatch ? leadingMatch[0] : ''
      const rest = line.substring(leading.length)

      // 处理行内多余空格
      const processed = rest.replace(/[ \t]{2,}/g, ' ')

      return leading + processed
    })

    return processedLines.join('\n')
  }

  /**
   * 刷新替换规则
   */
  refreshRules() {
    this.loadReplaceRules()
  }

  /**
   * 获取当前替换规则
   */
  getReplaceRules(): ReplaceRule[] {
    return [...this.replaceRules]
  }
}

/**
 * 章节缓存管理器
 */
export class ChapterCacheManager {
  private static CACHE_KEY_PREFIX = 'chapterCache_'
  private static MAX_CACHE_SIZE = 50 // 最大缓存章节数

  /**
   * 获取缓存的章节内容
   */
  static getCache(bookUrl: string, chapterIndex: number): string | null {
    try {
      const key = this.getCacheKey(bookUrl, chapterIndex)
      const cached = wx.getStorageSync(key)
      if (cached) {
        console.log(`章节缓存命中: ${chapterIndex}`)
        return cached
      }
      return null
    } catch (e) {
      console.error('读取章节缓存失败:', e)
      return null
    }
  }

  /**
   * 设置章节缓存
   */
  static setCache(bookUrl: string, chapterIndex: number, content: string) {
    try {
      const key = this.getCacheKey(bookUrl, chapterIndex)
      wx.setStorageSync(key, content)

      // 更新缓存索引
      this.updateCacheIndex(bookUrl, chapterIndex)
    } catch (e) {
      console.error('设置章节缓存失败:', e)
    }
  }

  /**
   * 清除书籍的所有缓存
   */
  static clearBookCache(bookUrl: string) {
    try {
      const indexKey = `${this.CACHE_KEY_PREFIX}index_${this.hashUrl(bookUrl)}`
      const indexes = wx.getStorageSync(indexKey) as number[] || []

      // 删除所有缓存的章节
      for (const index of indexes) {
        const key = this.getCacheKey(bookUrl, index)
        wx.removeStorageSync(key)
      }

      // 删除索引
      wx.removeStorageSync(indexKey)

      // 删除阅读进度
      const progressKey = `readingProgress_${bookUrl}`
      wx.removeStorageSync(progressKey)

      console.log(`已清除书籍缓存: ${bookUrl}`)
    } catch (e) {
      console.error('清除书籍缓存失败:', e)
    }
  }

  /**
   * 预加载后续章节
   */
  static async preloadChapters(
    bookUrl: string,
    currentIndex: number,
    totalChapters: number,
    fetchFunction: (index: number) => Promise<string>,
    count: number = 3
  ) {
    const preloadIndexes: number[] = []

    // 计算需要预加载的章节索引
    for (let i = 1; i <= count; i++) {
      const nextIndex = currentIndex + i
      if (nextIndex < totalChapters) {
        // 检查是否已缓存
        if (!this.getCache(bookUrl, nextIndex)) {
          preloadIndexes.push(nextIndex)
        }
      }
    }

    // 异步预加载
    for (const index of preloadIndexes) {
      try {
        console.log(`预加载章节: ${index}`)
        const content = await fetchFunction(index)
        this.setCache(bookUrl, index, content)
      } catch (e) {
        console.error(`预加载章节 ${index} 失败:`, e)
      }
    }
  }

  /**
   * 获取缓存键
   */
  private static getCacheKey(bookUrl: string, chapterIndex: number): string {
    return `${this.CACHE_KEY_PREFIX}${this.hashUrl(bookUrl)}_${chapterIndex}`
  }

  /**
   * 简单的 URL 哈希
   */
  private static hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 更新缓存索引
   */
  private static updateCacheIndex(bookUrl: string, chapterIndex: number) {
    try {
      const indexKey = `${this.CACHE_KEY_PREFIX}index_${this.hashUrl(bookUrl)}`
      let indexes = wx.getStorageSync(indexKey) as number[] || []

      // 添加新索引
      if (!indexes.includes(chapterIndex)) {
        indexes.push(chapterIndex)
      }

      // 如果超过最大缓存数，删除最旧的
      if (indexes.length > this.MAX_CACHE_SIZE) {
        const toRemove = indexes.shift()
        if (toRemove !== undefined) {
          const key = this.getCacheKey(bookUrl, toRemove)
          wx.removeStorageSync(key)
        }
      }

      wx.setStorageSync(indexKey, indexes)
    } catch (e) {
      console.error('更新缓存索引失败:', e)
    }
  }
}

// 导出单例内容处理器
export const contentProcessor = new ContentProcessor()
