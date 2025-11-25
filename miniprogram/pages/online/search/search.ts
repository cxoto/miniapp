import { OnlineMockApi } from '../../../utils/onlineMockApi'

interface SearchBook {
  bookId: string
  bookName: string
  author: string
  coverUrl: string
  description: string
  wordCount: number
  source: string
  isInBookshelf: boolean
}

Component({
  data: {
    keyword: '',
    searchResults: [] as SearchBook[],
    searching: false,
    searched: false,
    total: 0,
    page: 1,
    pageSize: 10
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
        const result = await OnlineMockApi.searchBooks(keyword, 1, this.data.pageSize)
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
      const bookId = e.currentTarget.dataset.bookid
      const book = this.data.searchResults.find(b => b.bookId === bookId)

      if (!book) {
        return
      }

      if (book.isInBookshelf) {
        wx.showToast({
          title: '已在书架中',
          icon: 'none'
        })
        return
      }

      try {
        wx.showLoading({
          title: '添加中...',
          mask: true
        })

        const result = await OnlineMockApi.addToBookshelf(
          'user_001',
          bookId,
          `https://example.com/books/${bookId}.txt`,
          '未分组'
        )

        wx.hideLoading()

        if (result.success) {
          wx.showToast({
            title: '添加成功',
            icon: 'success'
          })

          // 更新列表中的状态
          const updatedResults = this.data.searchResults.map(b => {
            if (b.bookId === bookId) {
              return Object.assign({}, b, { isInBookshelf: true })
            }
            return b
          })

          this.setData({
            searchResults: updatedResults
          })
        } else {
          wx.showToast({
            title: result.message,
            icon: 'none'
          })
        }
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
     * 查看书籍详情（暂时跳转到阅读页面）
     */
    viewBook(e: any) {
      const bookId = e.currentTarget.dataset.bookid
      const book = this.data.searchResults.find(b => b.bookId === bookId)

      if (book && book.isInBookshelf) {
        wx.navigateTo({
          url: `/pages/online/reader/reader?bookId=${bookId}&bookUrl=${encodeURIComponent(`https://example.com/books/${bookId}.txt`)}&chapterIndex=0`
        })
      } else {
        wx.showToast({
          title: '请先添加到书架',
          icon: 'none'
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
