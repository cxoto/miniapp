import { OnlineMockApi } from '../../../utils/onlineMockApi'

// 真实 API 返回的搜索结果数据结构
interface SearchBook {
  bookUrl: string
  origin: string
  originName: string
  type: number
  name: string
  author: string
  kind: string
  coverUrl: string
  intro: string
  wordCount: string
  latestChapterTitle: string
  tocUrl: string
  time: number
  originOrder: number
  infoHtml: string
  tocHtml: string
}

Component({
  data: {
    keyword: '',
    searchResults: [] as SearchBook[],
    searching: false,
    searched: false,
    total: 0,
    page: 1
  },

  methods: {
    /**
     * 输入关键词
     */
    onInput(e: any) {
      this.setData({
        keyword: e.detail.value
      })
    },

    /**
     * 执行搜索
     */
    async onSearch() {
      const keyword = this.data.keyword.trim()
      if (!keyword) {
        wx.showToast({
          title: '请输入关键词',
          icon: 'none'
        })
        return
      }

      this.setData({
        searching: true,
        page: 1
      })

      try {
        const result = await OnlineMockApi.searchBooks(keyword, 1)
        this.setData({
          searchResults: result.books,
          total: result.total,
          searching: false,
          searched: true
        })
      } catch (error) {
        console.error('搜索失败:', error)
        wx.showToast({
          title: '搜索失败',
          icon: 'none'
        })
        this.setData({
          searching: false
        })
      }
    },

    /**
     * 添加到书架
     */
    async addToBookshelf(e: any) {
      const bookUrl = e.currentTarget.dataset.bookurl
      const book = this.data.searchResults.find(b => b.bookUrl === bookUrl)

      if (!book) {
        return
      }

      try {
        wx.showLoading({
          title: '添加中...',
          mask: true
        })

        await OnlineMockApi.saveBook({
          bookUrl: book.bookUrl,
          origin: book.origin,
          originName: book.originName,
          type: book.type,
          name: book.name,
          author: book.author,
          kind: book.kind,
          coverUrl: book.coverUrl,
          intro: book.intro,
          wordCount: book.wordCount,
          latestChapterTitle: book.latestChapterTitle,
          tocUrl: book.tocUrl,
          time: book.time,
          originOrder: book.originOrder,
          infoHtml: book.infoHtml,
          tocHtml: book.tocHtml
        })

        wx.hideLoading()
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('添加失败:', error)
        wx.hideLoading()
        wx.showToast({
          title: '添加失败',
          icon: 'none'
        })
      }
    },

    /**
     * 查看书籍详情（跳转到阅读页面）
     */
    viewBook(e: any) {
      const bookUrl = e.currentTarget.dataset.bookurl

      if (bookUrl) {
        wx.navigateTo({
          url: `/pages/online/reader/reader?bookUrl=${encodeURIComponent(bookUrl)}&chapterIndex=0`
        })
      }
    },

    /**
     * 清空搜索
     */
    onClear() {
      this.setData({
        keyword: '',
        searchResults: [],
        searched: false,
        total: 0
      })
    }
  }
})
