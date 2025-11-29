import { OnlineMockApi } from '../../../utils/onlineMockApi'
import { ChapterCacheManager } from '../../../utils/contentProcessor'

// 真实 API 返回的书籍数据结构
interface BookItem {
  bookUrl: string
  tocUrl: string
  origin: string
  originName: string
  name: string
  author: string
  kind: string
  coverUrl: string
  intro: string
  type: number
  group: number
  latestChapterTitle: string
  latestChapterTime: number
  lastCheckTime: number
  lastCheckCount: number
  totalChapterNum: number
  durChapterTitle: string
  durChapterIndex: number
  durChapterPos: number
  durChapterTime: number
  wordCount: string
  canUpdate: boolean
  order: number
  originOrder: number
  useReplaceRule: boolean
  isInShelf: boolean
}

// 真实 API 返回的书籍分组数据结构
interface BookGroup {
  groupId: number
  groupName: string
  order: number
  show: boolean
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
    currentGroupId: -1,  // 默认显示全部（groupId: -1）
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
          OnlineMockApi.getBookshelf(0),
          OnlineMockApi.getBookGroups()
        ])

        const books = bookshelfData.data || []
        // 为封面图片拼接完整域名前缀
        const booksWithFullCover = books.map(book => ({
          ...book,
          coverUrl: book.coverUrl.startsWith('/') ? `https://book.xoto.cc${book.coverUrl}` : book.coverUrl
        }))    
        .sort((a, b) => (b.durChapterTime || 0) - (a.durChapterTime || 0))


        // 过滤出需要显示的分组，并按 order 排序
        const groups = (groupsData.data || [])
          .filter((g: BookGroup) => g.show)
          .sort((a: BookGroup, b: BookGroup) => a.order - b.order)

        this.setData({
          userInfo: userInfo,
          bookList: booksWithFullCover,
          filteredBookList: booksWithFullCover,
          bookGroups: groups,
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
      const groupId = parseInt(e.currentTarget.dataset.groupid)
      this.setData({
        currentGroupId: groupId
      })

      // 筛选书籍 (根据 API 返回的 group 字段)
      // groupId -1 表示全部
      if (groupId === -1) {
        this.setData({
          filteredBookList: this.data.bookList
        })
      } else {
        const filtered = this.data.bookList.filter(book => {
          return book.group === groupId
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
      const bookUrl = e.currentTarget.dataset.bookurl
      const book = this.data.bookList.find(b => b.bookUrl === bookUrl)

      if (book) {
        wx.navigateTo({
          url: `/pages/online/reader/reader?bookUrl=${encodeURIComponent(book.bookUrl)}&chapterIndex=${book.durChapterIndex}`
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
     * 长按书籍显示删除确认
     */
    onLongPressBook(e: any) {
      const bookUrl = e.currentTarget.dataset.bookurl
      const book = this.data.bookList.find(b => b.bookUrl === bookUrl)

      if (!book) {
        return
      }

      wx.showActionSheet({
        itemList: ['删除书籍'],
        itemColor: '#ff4d4f',
        success: (res) => {
          if (res.tapIndex === 0) {
            this.confirmDeleteBook(book)
          }
        }
      })
    },

    /**
     * 确认删除书籍
     */
    confirmDeleteBook(book: BookItem) {
      wx.showModal({
        title: '删除书籍',
        content: `确定要删除《${book.name}》吗？`,
        confirmColor: '#ff4d4f',
        success: async (res) => {
          if (res.confirm) {
            await this.deleteBook(book)
          }
        }
      })
    },

    /**
     * 删除书籍
     */
    async deleteBook(book: BookItem) {
      try {
        wx.showLoading({
          title: '删除中...',
          mask: true
        })

        await OnlineMockApi.deleteBook({
          bookUrl: book.bookUrl,
          author: book.author,
          coverUrl: book.coverUrl,
          tocUrl: book.tocUrl,
          canUpdate: book.canUpdate,
          durChapterIndex: book.durChapterIndex,
          durChapterPos: book.durChapterPos,
          durChapterTime: book.durChapterTime,
          kind: book.kind,
          intro: book.intro,
          lastCheckTime: book.lastCheckTime,
          latestChapterTitle: book.latestChapterTitle,
          name: book.name,
          origin: book.origin,
          originName: book.originName,
          totalChapterNum: book.totalChapterNum,
          type: book.type,
          group: book.group,
          wordCount: book.wordCount
        })

        wx.hideLoading()
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })

        // 从本地列表中移除
        const updatedBookList = this.data.bookList.filter(b => b.bookUrl !== book.bookUrl)
        const updatedFilteredList = this.data.filteredBookList.filter(b => b.bookUrl !== book.bookUrl)

        // 清除本地缓存（章节缓存和阅读进度）
        ChapterCacheManager.clearBookCache(book.bookUrl)

        this.setData({
          bookList: updatedBookList,
          filteredBookList: updatedFilteredList
        })
      } catch (error) {
        console.error('删除失败:', error)
        wx.hideLoading()
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        })
      }
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
