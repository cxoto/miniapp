import { OnlineMockApi } from '../../../utils/onlineMockApi'
import { contentProcessor, ChapterCacheManager } from '../../../utils/contentProcessor'

// 章节内容数据结构（适配真实 API）
interface ChapterContent {
  chapterIndex: number
  chapterTitle: string
  content: string
}

// 真实 API 返回的章节数据结构
interface Chapter {
  url: string
  title: string
  isVolume: boolean
  baseUrl: string
  bookUrl: string
  index: number
  tag: string
}

// 阅读设置
interface ReaderSettings {
  fontSize: number
  bgColor: string
  textColor: string
  isNightMode: boolean
  pageDirection: 'horizontal' | 'vertical'
}

// 阅读进度
interface ReadingProgress {
  bookUrl: string
  chapterIndex: number
  currentPage: number
  totalPages: number
  lastReadTime: number
}

Component({
  data: {
    bookId: '',
    bookUrl: '',
    currentChapterIndex: 0,
    chapterContent: null as ChapterContent | null,
    chapterList: [] as Chapter[],
    displayChapterList: [] as Chapter[],
    totalChapters: 0,
    loading: true,
    showCatalog: false,
    showControlPanel: false,
    showSettingsPanel: false,
    fontSize: 16,
    bgColor: '#fff',
    textColor: '#333',
    isNightMode: false,
    catalogSortAsc: true,
    pageDirection: 'horizontal' as 'horizontal' | 'vertical',

    // 分页相关
    currentPage: 0,
    totalPages: 1,
    pageContents: [] as string[],

    // 翻页动画
    pageAnimating: false,
    pageAnimationClass: '',

    // 屏幕尺寸
    screenWidth: 0,
    screenHeight: 0,

    // 基于行的分页
    linesPerPage: 0,        // 每页可显示的完整行数
    lineHeight: 0,          // 行高（px）
    contentAreaHeight: 0,   // 内容区域高度（px）
    pageOffsetY: 0,         // 当前页的 Y 偏移量

    // 点击状态
    lastTapTime: 0,

    // 触摸状态
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,

    // 保存的页码（用于恢复进度）
    savedCurrentPage: 0,

    // 文字选择相关
    showTextSelection: false,
    selectedText: '',
    selectionMenuX: 0,
    selectionMenuY: 0,

    // 替换规则弹窗
    showReplaceDialog: false,
    replacePattern: '',
    replaceReplacement: ''
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync()
      this.setData({
        screenWidth: systemInfo.windowWidth,
        screenHeight: systemInfo.windowHeight
      })

      this.loadReaderSettings()

      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as any
      const options = currentPage.options

      if (options && options.bookUrl) {
        const bookUrl = decodeURIComponent(options.bookUrl)
        const chapterIndex = parseInt(options.chapterIndex || '0')

        this.setData({
          bookUrl: bookUrl
        })

        // 先加载进度，再加载内容
        this.loadReadingProgress(bookUrl, chapterIndex)
      }
    }
  },

  pageLifetimes: {
    show() {
      // 应用夜间模式到导航栏
      this.applyNavigationBarStyle()

      if (!this.data.bookUrl) {
        const pages = getCurrentPages()
        const currentPage = pages[pages.length - 1] as any
        const options = currentPage.options

        if (options && options.bookUrl) {
          const bookUrl = decodeURIComponent(options.bookUrl)
          const chapterIndex = parseInt(options.chapterIndex || '0')

          this.setData({
            bookUrl: bookUrl
          })

          this.loadReadingProgress(bookUrl, chapterIndex)
        }
      }
    },
    hide() {
      this.saveReadingProgress()
    }
  },

  methods: {
    /**
     * 应用导航栏样式（支持夜间模式）
     */
    applyNavigationBarStyle() {
      if (this.data.isNightMode) {
        wx.setNavigationBarColor({
          frontColor: '#ffffff',
          backgroundColor: '#1a1a1a',
          animation: {
            duration: 300,
            timingFunc: 'easeIn'
          }
        })
      } else {
        wx.setNavigationBarColor({
          frontColor: '#000000',
          backgroundColor: '#ffffff',
          animation: {
            duration: 300,
            timingFunc: 'easeIn'
          }
        })
      }
    },

    loadReaderSettings() {
      try {
        const settings = wx.getStorageSync('readerSettings') as ReaderSettings
        if (settings) {
          this.setData({
            fontSize: settings.fontSize || 16,
            bgColor: settings.bgColor || '#fff',
            textColor: settings.textColor || '#333',
            isNightMode: settings.isNightMode || false,
            pageDirection: settings.pageDirection || 'horizontal'
          })
          // 应用导航栏样式
          this.applyNavigationBarStyle()
        }
      } catch (e) {
        console.error('加载设置失败:', e)
      }
    },

    saveReaderSettings() {
      const settings: ReaderSettings = {
        fontSize: this.data.fontSize,
        bgColor: this.data.bgColor,
        textColor: this.data.textColor,
        isNightMode: this.data.isNightMode,
        pageDirection: this.data.pageDirection
      }
      wx.setStorageSync('readerSettings', settings)
    },

    /**
     * 加载阅读进度
     */
    loadReadingProgress(bookUrl: string, defaultChapterIndex: number) {
      try {
        const progressKey = `readingProgress_${bookUrl}`
        const progress = wx.getStorageSync(progressKey) as ReadingProgress

        if (progress && progress.chapterIndex !== undefined) {
          console.log('恢复阅读进度:', progress)
          this.setData({
            currentChapterIndex: progress.chapterIndex,
            savedCurrentPage: progress.currentPage || 0
          })
        } else {
          this.setData({
            currentChapterIndex: defaultChapterIndex,
            savedCurrentPage: 0
          })
        }

        // 加载内容
        this.loadChapterContent()
        this.loadChapterList()
      } catch (e) {
        console.error('加载进度失败:', e)
        this.setData({
          currentChapterIndex: defaultChapterIndex,
          savedCurrentPage: 0
        })
        this.loadChapterContent()
        this.loadChapterList()
      }
    },

    saveReadingProgress() {
      if (!this.data.bookUrl) return

      const progress: ReadingProgress = {
        bookUrl: this.data.bookUrl,
        chapterIndex: this.data.currentChapterIndex,
        currentPage: this.data.currentPage,
        totalPages: this.data.totalPages,
        lastReadTime: Date.now()
      }
      const progressKey = `readingProgress_${this.data.bookUrl}`
      wx.setStorageSync(progressKey, progress)
      console.log('保存阅读进度:', progress)
    },

    /**
     * 获取章节内容（带缓存）
     */
    async fetchChapterContent(chapterIndex: number): Promise<string> {
      // 先检查缓存
      const cached = ChapterCacheManager.getCache(this.data.bookUrl, chapterIndex)
      if (cached) {
        return cached
      }

      // 从服务器获取
      const result = await OnlineMockApi.getBookContent(
        this.data.bookUrl,
        chapterIndex
      )

      // 处理内容格式
      const processedContent = contentProcessor.process(result.data)

      // 缓存内容
      ChapterCacheManager.setCache(this.data.bookUrl, chapterIndex, processedContent)

      return processedContent
    },

    async loadChapterContent() {
      try {
        this.setData({ loading: true })

        // 获取内容（带缓存）
        const content = await this.fetchChapterContent(this.data.currentChapterIndex)

        const currentChapter = this.data.chapterList.find(
          (ch: Chapter) => ch.index === this.data.currentChapterIndex
        )
        const chapterTitle = currentChapter?.title || `第${this.data.currentChapterIndex + 1}章`

        const chapterContent: ChapterContent = {
          chapterIndex: this.data.currentChapterIndex,
          chapterTitle: chapterTitle,
          content: content
        }

        // 先计算分页
        this.calculatePages(content)

        this.setData({
          chapterContent: chapterContent,
          loading: false
        })

        wx.setNavigationBarTitle({
          title: chapterTitle
        })

        // 等待渲染完成后测量实际高度并重新计算分页
        setTimeout(() => {
          this.measureAndRecalculatePages()
        }, 100)

        // 预加载后续章节
        this.preloadNextChapters()
      } catch (error) {
        console.error('加载章节内容失败:', error)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    },

    /**
     * 预加载后续章节
     */
    preloadNextChapters() {
      const { bookUrl, currentChapterIndex, totalChapters } = this.data

      ChapterCacheManager.preloadChapters(
        bookUrl,
        currentChapterIndex,
        totalChapters,
        async (index: number) => {
          const result = await OnlineMockApi.getBookContent(bookUrl, index)
          return contentProcessor.process(result.data)
        },
        3 // 预加载3章
      )
    },

    /**
     * 计算分页参数
     * 基于实际行高和可视区域高度，确保每页显示完整行数
     */
    calculatePages(content: string) {
      // 行高 = 字体大小 * line-height(2)
      const lineHeight = this.data.fontSize * 2
      // 内容区域高度（扣除上下 padding 各 15px）
      const contentPadding = 30 // 上下各 15px
      const contentAreaHeight = this.data.screenHeight - contentPadding
      // 每页可显示的完整行数（向下取整，确保不显示半行）
      const linesPerPage = Math.floor(contentAreaHeight / lineHeight)
      // 实际每页高度（完整行数 * 行高）
      const pageHeight = linesPerPage * lineHeight

      // 先将内容存储，稍后通过测量容器计算实际行数
      // 这里使用简单的估算方法：按字符宽度估算总行数
      const charsPerLine = Math.floor((this.data.screenWidth - 80) / this.data.fontSize)

      // 计算总行数（考虑换行符）
      const lines = content.split('\n')
      let totalLines = 0
      for (const line of lines) {
        if (line.length === 0) {
          totalLines += 1 // 空行
        } else {
          totalLines += Math.ceil(line.length / charsPerLine)
        }
      }

      // 计算总页数
      const totalPages = Math.max(1, Math.ceil(totalLines / linesPerPage))

      this.setData({
        pageContents: [content], // 存储完整内容
        totalPages: totalPages,
        linesPerPage: linesPerPage,
        lineHeight: lineHeight,
        contentAreaHeight: pageHeight,
        pageOffsetY: 0
      })
    },

    /**
     * 测量实际内容高度并重新计算分页
     */
    measureAndRecalculatePages() {
      const query = this.createSelectorQuery()
      query.select('.chapter-text-measure').boundingClientRect((rect: any) => {
        if (rect && rect.height > 0) {
          const lineHeight = this.data.fontSize * 2
          const contentPadding = 30
          const contentAreaHeight = this.data.screenHeight - contentPadding
          const linesPerPage = Math.floor(contentAreaHeight / lineHeight)
          const pageHeight = linesPerPage * lineHeight

          // 根据实际高度计算总页数
          const totalLines = Math.ceil(rect.height / lineHeight)
          const totalPages = Math.max(1, Math.ceil(totalLines / linesPerPage))

          this.setData({
            totalPages: totalPages,
            linesPerPage: linesPerPage,
            lineHeight: lineHeight,
            contentAreaHeight: pageHeight
          })

          // 恢复页码（确保不超出范围）
          const savedPage = this.data.savedCurrentPage
          const validPage = Math.min(savedPage, totalPages - 1)
          this.updatePageOffset(validPage >= 0 ? validPage : 0)
        }
      }).exec()
    },

    /**
     * 更新页面偏移量
     */
    updatePageOffset(page: number) {
      const offsetY = page * this.data.linesPerPage * this.data.lineHeight
      this.setData({
        currentPage: page,
        pageOffsetY: offsetY
      })
    },

    async loadChapterList() {
      try {
        const result = await OnlineMockApi.getChapterList(this.data.bookUrl)
        const chapters = result.data || []
        this.setData({
          chapterList: chapters,
          displayChapterList: chapters,
          totalChapters: chapters.length
        })
      } catch (error) {
        console.error('加载章节列表失败:', error)
      }
    },

    handleContentTap(e: any) {
      const now = Date.now()
      if (now - this.data.lastTapTime < 100) {
        return
      }
      this.setData({ lastTapTime: now })

      const { screenWidth, screenHeight } = this.data
      const touch = e.detail
      const x = touch.x
      const y = touch.y

      const leftBound = screenWidth * 0.33
      const rightBound = screenWidth * 0.67
      const topBound = screenHeight * 0.33
      const bottomBound = screenHeight * 0.67

      const isInCenterX = x >= leftBound && x <= rightBound
      const isInCenterY = y >= topBound && y <= bottomBound

      // 中央区域：显示控制面板
      if (isInCenterX && isInCenterY) {
        this.toggleControlPanel()
        return
      }

      // 如果控制面板显示，点击其他区域关闭面板
      if (this.data.showControlPanel || this.data.showSettingsPanel) {
        this.setData({
          showControlPanel: false,
          showSettingsPanel: false
        })
        return
      }

      // 翻页动画进行中，不处理
      if (this.data.pageAnimating) return

      // 左右翻页模式：左侧上一页，右侧下一页
      if (this.data.pageDirection === 'horizontal') {
        if (x < leftBound) {
          this.prevPageWithAnimation('slide-right')
        } else if (x > rightBound) {
          this.nextPageWithAnimation('slide-left')
        }
      } else {
        // 上下翻页模式
        if (y < topBound) {
          this.prevPageWithAnimation('slide-down')
        } else if (y > bottomBound) {
          this.nextPageWithAnimation('slide-up')
        }
      }
    },

    handleTouchStart(e: any) {
      const touch = e.touches[0]
      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY,
        touchStartTime: Date.now()
      })
    },

    handleTouchEnd(e: any) {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - this.data.touchStartX
      const deltaY = touch.clientY - this.data.touchStartY
      const deltaTime = Date.now() - this.data.touchStartTime

      const minDistance = 50
      const maxTime = 300

      if (deltaTime > maxTime) return
      if (this.data.showControlPanel || this.data.showSettingsPanel || this.data.showCatalog) return
      if (this.data.pageAnimating) return

      // 左右翻页：支持滑动
      if (this.data.pageDirection === 'horizontal') {
        if (Math.abs(deltaX) > minDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX > 0) {
            this.prevPageWithAnimation('slide-right')
          } else {
            this.nextPageWithAnimation('slide-left')
          }
        }
      } else {
        // 上下翻页：支持滑动
        if (Math.abs(deltaY) > minDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
          if (deltaY > 0) {
            this.prevPageWithAnimation('slide-down')
          } else {
            this.nextPageWithAnimation('slide-up')
          }
        }
      }
    },

    /**
     * 上一页（带动画）
     */
    prevPageWithAnimation(animationClass: string) {
      if (this.data.currentPage > 0) {
        this.setData({
          pageAnimating: true,
          pageAnimationClass: animationClass
        })

        setTimeout(() => {
          const newPage = this.data.currentPage - 1
          this.updatePageOffset(newPage)
          this.setData({
            pageAnimating: false,
            pageAnimationClass: ''
          })
          this.saveReadingProgress()
        }, 250)
      } else {
        this.prevChapter()
      }
    },

    /**
     * 下一页（带动画）
     */
    nextPageWithAnimation(animationClass: string) {
      if (this.data.currentPage < this.data.totalPages - 1) {
        this.setData({
          pageAnimating: true,
          pageAnimationClass: animationClass
        })

        setTimeout(() => {
          const newPage = this.data.currentPage + 1
          this.updatePageOffset(newPage)
          this.setData({
            pageAnimating: false,
            pageAnimationClass: ''
          })
          this.saveReadingProgress()
        }, 250)
      } else {
        this.nextChapter()
      }
    },

    prevChapter() {
      if (this.data.currentChapterIndex > 0) {
        this.setData({
          currentChapterIndex: this.data.currentChapterIndex - 1,
          savedCurrentPage: 0,
          showControlPanel: false,
          showSettingsPanel: false
        })
        this.loadChapterContent()
        this.saveReadingProgress()
      } else {
        wx.showToast({
          title: '已是第一章',
          icon: 'none'
        })
      }
    },

    nextChapter() {
      if (this.data.currentChapterIndex < this.data.totalChapters - 1) {
        this.setData({
          currentChapterIndex: this.data.currentChapterIndex + 1,
          savedCurrentPage: 0,
          showControlPanel: false,
          showSettingsPanel: false
        })
        this.loadChapterContent()
        this.saveReadingProgress()
      } else {
        wx.showToast({
          title: '已是最后一章',
          icon: 'none'
        })
      }
    },

    toggleCatalog() {
      this.setData({
        showCatalog: !this.data.showCatalog,
        showControlPanel: false,
        showSettingsPanel: false
      })
    },

    toggleCatalogSort() {
      const newSortAsc = !this.data.catalogSortAsc
      const sortedList = [...this.data.chapterList]

      if (!newSortAsc) {
        sortedList.reverse()
      }

      this.setData({
        catalogSortAsc: newSortAsc,
        displayChapterList: sortedList
      })
    },

    selectChapter(e: any) {
      const chapterIndex = e.currentTarget.dataset.index
      this.setData({
        currentChapterIndex: chapterIndex,
        savedCurrentPage: 0,
        showCatalog: false,
        showControlPanel: false,
        showSettingsPanel: false
      })
      this.loadChapterContent()
      this.saveReadingProgress()
    },

    toggleControlPanel() {
      this.setData({
        showControlPanel: !this.data.showControlPanel,
        showSettingsPanel: false
      })
    },

    toggleSettingsPanel() {
      this.setData({
        showSettingsPanel: !this.data.showSettingsPanel,
        showControlPanel: false
      })
    },

    toggleNightMode() {
      const isNight = !this.data.isNightMode
      this.setData({
        isNightMode: isNight,
        bgColor: isNight ? '#1a1a1a' : '#fff',
        textColor: isNight ? '#c0c0c0' : '#333'
      })
      this.saveReaderSettings()
      // 应用导航栏样式
      this.applyNavigationBarStyle()
    },

    increaseFontSize() {
      if (this.data.fontSize < 24) {
        const newSize = this.data.fontSize + 2
        this.setData({ fontSize: newSize })
        this.saveReaderSettings()
        if (this.data.chapterContent) {
          this.calculatePages(this.data.chapterContent.content)
          // 延迟测量以获取准确高度
          setTimeout(() => {
            this.measureAndRecalculatePages()
          }, 100)
        }
      }
    },

    decreaseFontSize() {
      if (this.data.fontSize > 12) {
        const newSize = this.data.fontSize - 2
        this.setData({ fontSize: newSize })
        this.saveReaderSettings()
        if (this.data.chapterContent) {
          this.calculatePages(this.data.chapterContent.content)
          // 延迟测量以获取准确高度
          setTimeout(() => {
            this.measureAndRecalculatePages()
          }, 100)
        }
      }
    },

    changeBgColor(e: any) {
      const color = e.currentTarget.dataset.color
      const textColor = e.currentTarget.dataset.textcolor
      const isNight = color === '#1a1a1a'

      this.setData({
        bgColor: color,
        textColor: textColor,
        isNightMode: isNight
      })
      this.saveReaderSettings()
      // 应用导航栏样式
      this.applyNavigationBarStyle()
    },

    togglePageDirection() {
      const newDirection = this.data.pageDirection === 'horizontal' ? 'vertical' : 'horizontal'
      this.setData({ pageDirection: newDirection })
      this.saveReaderSettings()
    },

    closeCatalog() {
      this.setData({ showCatalog: false })
    },

    handleCatalogMaskTap() {
      this.closeCatalog()
    },

    /**
     * 长按文字，显示操作菜单
     */
    handleLongPress(e: any) {
      // 微信小程序中无法直接获取选中文本
      // 需要通过其他方式实现，这里提供一个简单的弹窗让用户输入要替换的内容
      this.setData({
        showReplaceDialog: true,
        replacePattern: '',
        replaceReplacement: ''
      })
    },

    /**
     * 输入要替换的内容
     */
    onPatternInput(e: any) {
      this.setData({
        replacePattern: e.detail.value
      })
    },

    /**
     * 输入替换后的内容
     */
    onReplacementInput(e: any) {
      this.setData({
        replaceReplacement: e.detail.value
      })
    },

    /**
     * 取消替换弹窗
     */
    cancelReplaceDialog() {
      this.setData({
        showReplaceDialog: false,
        replacePattern: '',
        replaceReplacement: ''
      })
    },

    /**
     * 确认添加替换规则
     */
    async confirmReplaceRule() {
      const { replacePattern, replaceReplacement } = this.data

      if (!replacePattern) {
        wx.showToast({
          title: '请输入要替换的内容',
          icon: 'none'
        })
        return
      }

      try {
        await OnlineMockApi.saveReplaceRule({
          pattern: replacePattern,
          replacement: replaceReplacement,
          isRegex: false,
          enabled: true
        })

        wx.showToast({
          title: '规则添加成功',
          icon: 'success'
        })

        // 刷新内容处理器的规则
        contentProcessor.refreshRules()

        // 关闭弹窗
        this.setData({
          showReplaceDialog: false,
          replacePattern: '',
          replaceReplacement: ''
        })

        // 重新加载当前章节以应用新规则
        // 清除当前章节缓存
        ChapterCacheManager.clearBookCache(this.data.bookUrl)
        this.loadChapterContent()
      } catch (e) {
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        })
      }
    },

    cacheChapters() {
      wx.showToast({
        title: '章节缓存功能开发中',
        icon: 'none'
      })
    },

    stopPropagation() {
      // 阻止点击事件冒泡
    }
  }
})
