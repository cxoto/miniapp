import { OnlineMockApi } from '../../../utils/onlineMockApi'

interface BookItem {
  bookId: string
  bookName: string
  author: string
  coverUrl: string
  description: string
  currentChapter: number
  latestChapter: number
  remainingChapters: number
  lastReadTime: string
  bookUrl: string
  durChapterIndex: number
  bookGroup: string
  progress: number
  wordCount: number
}

interface BookGroup {
  groupId: string
  groupName: string
  bookCount: number
  createTime: string
  sortOrder: number
}

interface UserInfo {
  userId: string
  username: string
  avatar: string
  vipLevel: number
  bookshelfCount: number
  readingTime: number
}

Component({
  data: {
    userInfo: null as UserInfo | null,
    bookList: [] as BookItem[],
    filteredBookList: [] as BookItem[],
    bookGroups: [] as BookGroup[],
    currentGroupId: 'all',
    loading: true,
    readingHours: 0
  },

  lifetimes: {
    attached() {
      this.loadData()
    }
  },

  methods: {
    /**
     * 加载数据
     */
    async loadData() {
      try {
        wx.showLoading({
          title: '加载中...',
          mask: true
        })

        // 并行加载用户信息、书架和分组
        const [userInfo, bookshelfData, groupsData] = await Promise.all([
          OnlineMockApi.getUserInfo(),
          OnlineMockApi.getBookshelf('user_001'),
          OnlineMockApi.getBookGroups('user_001')
        ])

        const allGroups = [{ groupId: 'all', groupName: '全部', bookCount: bookshelfData.books.length, createTime: '', sortOrder: 0 }].concat(groupsData.groups)

        this.setData({
          userInfo: userInfo,
          bookList: bookshelfData.books,
          filteredBookList: bookshelfData.books,
          bookGroups: allGroups,
          loading: false,
          readingHours: Math.floor(userInfo.readingTime / 60)
        })

        wx.hideLoading()
      } catch (error) {
        console.error('加载数据失败:', error)
        wx.hideLoading()
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
        this.setData({
          loading: false
        })
      }
    },

    /**
     * 切换分组
     */
    onGroupChange(e: any) {
      const groupId = e.currentTarget.dataset.groupid
      this.setData({
        currentGroupId: groupId
      })

      // 筛选书籍
      if (groupId === 'all') {
        this.setData({
          filteredBookList: this.data.bookList
        })
      } else {
        const filtered = this.data.bookList.filter(book => {
          const group = this.data.bookGroups.find(g => g.groupName === book.bookGroup)
          return group?.groupId === groupId
        })
        this.setData({
          filteredBookList: filtered
        })
      }
    },

    /**
     * 打开书籍阅读页面
     */
    openBook(e: any) {
      const bookId = e.currentTarget.dataset.bookid
      const book = this.data.bookList.find(b => b.bookId === bookId)

      if (book) {
        wx.navigateTo({
          url: `/pages/online/reader/reader?bookId=${bookId}&bookUrl=${encodeURIComponent(book.bookUrl)}&chapterIndex=${book.durChapterIndex}`
        })
      }
    },

    /**
     * 跳转到搜索页面
     */
    goToSearch() {
      wx.navigateTo({
        url: '/pages/online/search/search'
      })
    },

    /**
     * 下拉刷新
     */
    async onPullDownRefresh() {
      await this.loadData()
      wx.stopPullDownRefresh()
    }
  }
})
