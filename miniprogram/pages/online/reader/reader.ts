import { OnlineMockApi } from '../../../utils/onlineMockApi'

interface ChapterContent {
  chapterIndex: number
  chapterTitle: string
  content: string
  previousChapter: number | null
  nextChapter: number | null
  wordCount: number
}

interface Chapter {
  chapterIndex: number
  chapterTitle: string
  wordCount: number
  pageCount: number
}

Component({
  data: {
    bookId: '',
    bookUrl: '',
    currentChapterIndex: 0,
    chapterContent: null as ChapterContent | null,
    chapterList: [] as Chapter[],
    totalChapters: 0,
    loading: true,
    showCatalog: false,
    fontSize: 16,
    bgColor: '#fff',
    textColor: '#333'
  },

  lifetimes: {
    attached() {
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1] as any
      const options = currentPage.options

      if (options.bookId && options.bookUrl) {
        this.setData({
          bookId: options.bookId,
          bookUrl: decodeURIComponent(options.bookUrl),
          currentChapterIndex: parseInt(options.chapterIndex || '0')
        })

        this.loadChapterContent()
        this.loadChapterList()
      }
    }
  },

  methods: {
    /**
     * 加载章节内容
     */
    async loadChapterContent() {
      try {
        this.setData({ loading: true })

        const content = await OnlineMockApi.getBookContent(
          this.data.bookUrl,
          this.data.currentChapterIndex
        )

        this.setData({
          chapterContent: content,
          loading: false
        })

        // 设置标题
        wx.setNavigationBarTitle({
          title: content.chapterTitle
        })
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
     * 加载章节列表
     */
    async loadChapterList() {
      try {
        const result = await OnlineMockApi.getChapterList(this.data.bookUrl)
        this.setData({
          chapterList: result.chapters,
          totalChapters: result.totalChapters
        })
      } catch (error) {
        console.error('加载章节列表失败:', error)
      }
    },

    /**
     * 上一章
     */
    prevChapter() {
      if (this.data.chapterContent?.previousChapter !== null) {
        this.setData({
          currentChapterIndex: this.data.chapterContent.previousChapter!
        })
        this.loadChapterContent()
        // 滚动到顶部
        wx.pageScrollTo({
          scrollTop: 0,
          duration: 0
        })
      } else {
        wx.showToast({
          title: '已是第一章',
          icon: 'none'
        })
      }
    },

    /**
     * 下一章
     */
    nextChapter() {
      if (this.data.chapterContent?.nextChapter !== null) {
        this.setData({
          currentChapterIndex: this.data.chapterContent.nextChapter!
        })
        this.loadChapterContent()
        // 滚动到顶部
        wx.pageScrollTo({
          scrollTop: 0,
          duration: 0
        })
      } else {
        wx.showToast({
          title: '已是最后一章',
          icon: 'none'
        })
      }
    },

    /**
     * 显示/隐藏目录
     */
    toggleCatalog() {
      this.setData({
        showCatalog: !this.data.showCatalog
      })
    },

    /**
     * 选择章节
     */
    selectChapter(e: any) {
      const chapterIndex = e.currentTarget.dataset.index
      this.setData({
        currentChapterIndex: chapterIndex,
        showCatalog: false
      })
      this.loadChapterContent()
      // 滚动到顶部
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 0
      })
    },

    /**
     * 增大字体
     */
    increaseFontSize() {
      if (this.data.fontSize < 24) {
        this.setData({
          fontSize: this.data.fontSize + 2
        })
      }
    },

    /**
     * 减小字体
     */
    decreaseFontSize() {
      if (this.data.fontSize > 12) {
        this.setData({
          fontSize: this.data.fontSize - 2
        })
      }
    },

    /**
     * 切换背景色
     */
    changeBgColor(e: any) {
      const color = e.currentTarget.dataset.color
      const textColor = e.currentTarget.dataset.textcolor

      this.setData({
        bgColor: color,
        textColor: textColor
      })
    },

    /**
     * 关闭目录
     */
    closeCatalog() {
      this.setData({
        showCatalog: false
      })
    }
  }
})
