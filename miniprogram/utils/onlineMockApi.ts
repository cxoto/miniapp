/**
 * 在线阅读 Mock API
 * 模拟后端接口返回数据，包含网络延迟
 */

// 模拟网络延迟
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock 数据存储
const mockData = {
  // 用户信息
  userInfo: {
    userId: "user_001",
    username: "阅读爱好者",
    avatar: "https://via.placeholder.com/100",
    vipLevel: 1,
    bookshelfCount: 8,
    readingTime: 12560
  },

  // 书架数据
  bookshelf: [
    {
      bookId: "book_001",
      bookName: "三体",
      author: "刘慈欣",
      coverUrl: "https://ts1.tc.mm.bing.net/th/id/R-C.0b55114bfc1ac579e613459805cbca26?rik=PBilDGUDWD0amw&riu=http%3a%2f%2fy0.ifengimg.com%2fhaina%2f2015_35%2f33c13cc63bf878b_w1000_h1466.jpg&ehk=pYXwbZ%2bsf9yqr%2fb8VvED0uuBDepnzFMYH6g01BoTXok%3d&risl=&pid=ImgRaw&r=0",
      description: "科幻小说经典之作，讲述了地球文明与三体文明之间的交流与冲突",
      currentChapter: 15,
      latestChapter: 150,
      remainingChapters: 135,
      lastReadTime: "2024-01-15 10:30:00",
      bookUrl: "https://wx.xoto.cc/books/santi.txt",
      durChapterIndex: 14,
      bookGroup: "科幻小说",
      progress: 10,
      wordCount: 250000
    },
    {
      bookId: "book_002",
      bookName: "明朝那些事儿",
      author: "当年明月",
      coverUrl: "https://www.baikev.com/uploads/202304/1681690500cBulmcsi.jpeg",
      description: "用现代语言讲述明朝历史，通俗易懂",
      currentChapter: 8,
      latestChapter: 100,
      remainingChapters: 92,
      lastReadTime: "2024-01-14 15:20:00",
      bookUrl: "https://wx.xoto.cc/books/mingchao.txt",
      durChapterIndex: 7,
      bookGroup: "历史文学",
      progress: 8,
      wordCount: 180000
    },
    {
      bookId: "book_003",
      bookName: "活着",
      author: "余华",
      coverUrl: "https://via.placeholder.com/150x200?text=活着",
      description: "一部感人至深的长篇小说",
      currentChapter: 5,
      latestChapter: 20,
      remainingChapters: 15,
      lastReadTime: "2024-01-13 09:10:00",
      bookUrl: "https://wx.xoto.cc/books/huozhe.txt",
      durChapterIndex: 4,
      bookGroup: "现代文学",
      progress: 25,
      wordCount: 80000
    },
    {
      bookId: "book_004",
      bookName: "流浪地球",
      author: "刘慈欣",
      coverUrl: "https://via.placeholder.com/150x200?text=流浪地球",
      description: "中短篇科幻小说集",
      currentChapter: 3,
      latestChapter: 30,
      remainingChapters: 27,
      lastReadTime: "2024-01-12 18:45:00",
      bookUrl: "https://wx.xoto.cc/books/liulangdiqiu.txt",
      durChapterIndex: 2,
      bookGroup: "科幻小说",
      progress: 10,
      wordCount: 120000
    },
    {
      bookId: "book_005",
      bookName: "人类简史",
      author: "尤瓦尔·赫拉利",
      coverUrl: "https://via.placeholder.com/150x200?text=人类简史",
      description: "从石器时代到21世纪的人类发展史",
      currentChapter: 12,
      latestChapter: 60,
      remainingChapters: 48,
      lastReadTime: "2024-01-11 20:30:00",
      bookUrl: "https://wx.xoto.cc/books/renlei.txt",
      durChapterIndex: 11,
      bookGroup: "人文社科",
      progress: 20,
      wordCount: 300000
    }
  ],

  // 文本目录规则
  tocRules: [
    {
      id: "rule_001",
      name: "标准章节规则",
      rule: "^第[零一二三四五六七八九十百千\\d]+章",
      serialNumber: 1,
      enable: true,
      description: "匹配'第X章'格式的章节"
    },
    {
      id: "rule_002",
      name: "数字规则",
      rule: "^\\d+(\\.\\d+)*",
      serialNumber: 2,
      enable: true,
      description: "匹配纯数字章节"
    },
    {
      id: "rule_003",
      name: "英文章节规则",
      rule: "^Chapter\\s+\\d+",
      serialNumber: 3,
      enable: true,
      description: "匹配'Chapter X'格式的章节"
    }
  ],

  // 书籍分组
  bookGroups: [
    {
      groupId: "group_001",
      groupName: "科幻小说",
      bookCount: 2,
      createTime: "2024-01-01",
      sortOrder: 1
    },
    {
      groupId: "group_002",
      groupName: "历史文学",
      bookCount: 1,
      createTime: "2024-01-02",
      sortOrder: 2
    },
    {
      groupId: "group_003",
      groupName: "现代文学",
      bookCount: 1,
      createTime: "2024-01-03",
      sortOrder: 3
    },
    {
      groupId: "group_004",
      groupName: "人文社科",
      bookCount: 1,
      createTime: "2024-01-04",
      sortOrder: 4
    },
    {
      groupId: "default",
      groupName: "未分组",
      bookCount: 0,
      createTime: "2024-01-01",
      sortOrder: 99
    }
  ],

  // 搜索结果库
  searchDatabase: [
    {
      bookId: "search_001",
      bookName: "三体全集",
      author: "刘慈欣",
      coverUrl: "https://via.placeholder.com/150x200?text=三体全集",
      description: "科幻小说经典，包含三体三部曲的完整内容",
      wordCount: 850000,
      source: "起点中文网",
      isInBookshelf: true
    },
    {
      bookId: "search_002",
      bookName: "球状闪电",
      author: "刘慈欣",
      coverUrl: "https://via.placeholder.com/150x200?text=球状闪电",
      description: "刘慈欣的另一部科幻力作",
      wordCount: 320000,
      source: "起点中文网",
      isInBookshelf: false
    },
    {
      bookId: "search_003",
      bookName: "明朝那些事儿全集",
      author: "当年明月",
      coverUrl: "https://via.placeholder.com/150x200?text=明朝那些事儿全集",
      description: "完整讲述明朝276年历史",
      wordCount: 1200000,
      source: "纵横中文网",
      isInBookshelf: false
    },
    {
      bookId: "search_004",
      bookName: "许三观卖血记",
      author: "余华",
      coverUrl: "https://via.placeholder.com/150x200?text=许三观卖血记",
      description: "余华的经典小说，讲述平凡人的不平凡故事",
      wordCount: 95000,
      source: "作家出版社",
      isInBookshelf: false
    },
    {
      bookId: "search_005",
      bookName: "未来简史",
      author: "尤瓦尔·赫拉利",
      coverUrl: "https://via.placeholder.com/150x200?text=未来简史",
      description: "人类简史姊妹篇，探讨人类的未来",
      wordCount: 280000,
      source: "中信出版社",
      isInBookshelf: false
    }
  ]
}

// 生成章节列表
function generateChapterList(totalChapters: number = 150) {
  const chapters = []
  for (let i = 0; i < totalChapters; i++) {
    chapters.push({
      chapterIndex: i,
      chapterTitle: `第${i + 1}章 ${['序幕', '开端', '发展', '高潮', '结局'][i % 5]}`,
      wordCount: Math.floor(Math.random() * 2000) + 2000,
      pageCount: Math.floor(Math.random() * 3) + 2
    })
  }
  return chapters
}

// 生成章节内容
function generateChapterContent(chapterIndex: number, chapterTitle: string) {
  const paragraphs = []
  const paragraphCount = Math.floor(Math.random() * 10) + 15

  for (let i = 0; i < paragraphCount; i++) {
    paragraphs.push(`    这是${chapterTitle}的第${i + 1}段内容。这段文字是为了演示章节内容显示效果而生成的模拟文本。在实际应用中，这里将显示从服务器获取的真实书籍内容。每一段都有适当的缩进和间距，以提供良好的阅读体验。`)
  }

  return paragraphs.join('\n\n')
}

// 缓存目录规则（全局只需调用一次）
let cachedTocRules: any[] | null = null

/**
 * Mock API 接口
 */
export const OnlineMockApi = {
  /**
   * 获取用户信息
   */
  async getUserInfo() {
    await delay(300)
    return mockData.userInfo
  },

  /**
   * 获取用户书架
   * @param refresh 是否刷新 (0: 不刷新, 1: 刷新)
   */
  async getBookshelf(refresh: number = 0) {
    // 注释掉原来的 mock 数据返回
    // return {
    //   books: mockData.bookshelf
    // }

    // 调用真实 API
    return new Promise<{ isSuccess: boolean; errorMsg: string; data: any[] }>((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/getBookshelf?refresh=${refresh}`,
        method: 'GET',
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: any[] }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '获取书架失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 获取文本目录规则（带缓存，全局只调用一次）
   */
  async getTxtTocRules() {
    // 如果已有缓存，直接返回
    if (cachedTocRules !== null) {
      return {
        rules: cachedTocRules
      }
    }

    // 注释掉原来的 mock 数据返回
    // await delay(200)
    // return {
    //   rules: mockData.tocRules
    // }

    // 调用真实 API
    return new Promise<{ rules: any[] }>((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/getTxtTocRules?v=${Date.now()}`,
        method: 'GET',
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: any[] }
          if (result.isSuccess) {
            // 缓存结果
            cachedTocRules = result.data || []
            resolve({
              rules: cachedTocRules
            })
          } else {
            reject(new Error(result.errorMsg || '获取目录规则失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 获取书籍分组
   */
  async getBookGroups() {
    // 注释掉原来的 mock 数据返回
    // await delay(300)
    // return {
    //   groups: mockData.bookGroups
    // }

    // 调用真实 API
    return new Promise<{ isSuccess: boolean; errorMsg: string; data: any[] }>((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/getBookGroups?v=${Date.now()}`,
        method: 'GET',
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: any[] }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '获取书籍分组失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 获取书签列表
   * @param bookId 书籍ID
   * @param userId 用户ID
   */
  async getBookmarks(bookId: string, userId: string) {
    await delay(400)
    return {
      bookmarks: [
        {
          bookmarkId: "bm_001",
          bookId: bookId,
          chapterIndex: 10,
          chapterTitle: "第十章 重要转折",
          position: 150,
          createTime: "2024-01-10 15:30:00",
          note: "重要情节标记"
        },
        {
          bookmarkId: "bm_002",
          bookId: bookId,
          chapterIndex: 25,
          chapterTitle: "第二十五章 精彩片段",
          position: 320,
          createTime: "2024-01-12 09:15:00",
          note: "这段写得很好"
        }
      ]
    }
  },

  /**
   * 获取章节列表
   * @param bookUrl 书籍URL
   */
  async getChapterList(bookUrl: string) {
    // 注释掉原来的 mock 数据返回
    // await delay(600)
    // const totalChapters = 150
    // return {
    //   chapters: generateChapterList(totalChapters),
    //   totalChapters: totalChapters,
    //   totalWords: 250000
    // }
    
    // 调用真实 API
    return new Promise<{ isSuccess: boolean; errorMsg: string; data: any[] }>((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/getChapterList?v=${Date.now()}`,
        method: 'POST',
        data: {
          url: bookUrl,
          refresh: 0
        },
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: any[] }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '获取章节列表失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 获取章节内容
   * @param bookUrl 书籍URL
   * @param chapterIndex 章节索引
   */
  async getBookContent(bookUrl: string, chapterIndex: number) {
    // 注释掉原来的 mock 数据返回
    // await delay(400)
    // const chapterTitle = `第${chapterIndex + 1}章`
    // return {
    //   chapterIndex: chapterIndex,
    //   chapterTitle: chapterTitle,
    //   content: generateChapterContent(chapterIndex, chapterTitle),
    //   previousChapter: chapterIndex > 0 ? chapterIndex - 1 : null,
    //   nextChapter: chapterIndex < 149 ? chapterIndex + 1 : null,
    //   wordCount: Math.floor(Math.random() * 2000) + 2000
    // }

    // 调用真实 API
    return new Promise<{ isSuccess: boolean; errorMsg: string; data: string }>((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/getBookContent?v=${Date.now()}`,
        method: 'POST',
        data: {
          url: bookUrl,
          index: chapterIndex
        },
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: string }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '获取章节内容失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 搜索书籍
   * @param keyword 关键词
   * @param page 页码
   */
  async searchBooks(keyword: string, page: number = 1) {
    // 注释掉原来的 mock 数据返回
    // await delay(800)
    // const results = mockData.searchDatabase.filter(book =>
    //   book.bookName.includes(keyword) ||
    //   book.author.includes(keyword) ||
    //   book.description.includes(keyword)
    // )
    // const start = (page - 1) * pageSize
    // const end = start + pageSize
    // return {
    //   books: results.slice(start, end),
    //   total: results.length,
    //   page: page,
    //   pageSize: pageSize
    // }

    // 调用真实 SSE API
    return new Promise<{ books: any[]; total: number }>((resolve, reject) => {
      const encodedKeyword = encodeURIComponent(keyword)
      const bookSourceGroup = encodeURIComponent('') // TODO, need support source group

      wx.request({
        url: `https://book.xoto.cc/reader3/searchBookMultiSSE?accessToken=&key=${encodedKeyword}&bookSourceUrl=&bookSourceGroup=${bookSourceGroup}&concurrentCount=4&lastIndex=-1&page=${page}`,
        method: 'GET',
        enableChunked: false,
        responseType: 'text',
        success: (res) => {
          try {
            const responseText = res.data as string
            const allBooks: any[] = []

            // 解析 SSE 响应，提取所有 data: 行
            const lines = responseText.split('\n')
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6) // 去掉 'data: ' 前缀
                try {
                  const parsed = JSON.parse(jsonStr)
                  if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
                    allBooks.push(...parsed.data)
                  }
                } catch {
                  // 忽略解析失败的行
                }
              }
            }

            resolve({
              books: allBooks,
              total: allBooks.length
            })
          } catch (error) {
            reject(new Error('解析搜索结果失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 添加书籍到书架
   * @param bookData 书籍数据（从搜索结果获取）
   */
  async saveBook(bookData: {
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
  }) {

    return new Promise<{ isSuccess: boolean; errorMsg: string; data: any }>((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/saveBook?v=${Date.now()}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          bookUrl: bookData.bookUrl,
          origin: bookData.origin,
          originName: bookData.originName,
          type: bookData.type,
          name: bookData.name,
          author: bookData.author,
          kind: bookData.kind,
          coverUrl: bookData.coverUrl,
          intro: bookData.intro,
          wordCount: bookData.wordCount,
          latestChapterTitle: bookData.latestChapterTitle,
          tocUrl: bookData.tocUrl,
          time: bookData.time,
          originOrder: bookData.originOrder,
          infoHtml: bookData.infoHtml,
          tocHtml: bookData.tocHtml,
          sourceCount: 1,
          groupId: [],
          group: 0
        },
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: any }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '添加书架失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 获取替换规则
   * 当前从本地存储读取，后续可替换为远程 API
   */
  async getReplaceRules(): Promise<{ isSuccess: boolean; data: any[] }> {
    try {
      const rules = wx.getStorageSync('replaceRules') || []
      return {
        isSuccess: true,
        data: rules
      }
    } catch (e) {
      console.error('获取替换规则失败:', e)
      return {
        isSuccess: true,
        data: []
      }
    }
  },

  /**
   * 保存替换规则
   * 当前保存到本地存储，后续可替换为远程 API
   */
  async saveReplaceRule(rule: {
    id?: string
    pattern: string
    replacement: string
    isRegex: boolean
    enabled: boolean
  }): Promise<{ isSuccess: boolean; errorMsg: string; data: any }> {
    try {
      let rules = wx.getStorageSync('replaceRules') || []

      if (rule.id) {
        // 更新现有规则
        const index = rules.findIndex((r: any) => r.id === rule.id)
        if (index >= 0) {
          rules[index] = { ...rules[index], ...rule }
        }
      } else {
        // 新增规则
        const newRule = {
          ...rule,
          id: `rule_${Date.now()}`,
          createTime: Date.now()
        }
        rules.push(newRule)
      }

      wx.setStorageSync('replaceRules', rules)

      return {
        isSuccess: true,
        errorMsg: '',
        data: rule.id ? rule : rules[rules.length - 1]
      }
    } catch (e) {
      return {
        isSuccess: false,
        errorMsg: '保存替换规则失败',
        data: null
      }
    }
  },

  /**
   * 删除替换规则
   */
  async deleteReplaceRule(ruleId: string): Promise<{ isSuccess: boolean; errorMsg: string }> {
    try {
      let rules = wx.getStorageSync('replaceRules') || []
      rules = rules.filter((r: any) => r.id !== ruleId)
      wx.setStorageSync('replaceRules', rules)

      return {
        isSuccess: true,
        errorMsg: ''
      }
    } catch (e) {
      return {
        isSuccess: false,
        errorMsg: '删除替换规则失败'
      }
    }
  },

  /**
   * 创建书籍分组
   * @param groupName 分组名称
   */
  async saveBookGroup(groupName: string): Promise<{ isSuccess: boolean; errorMsg: string; data: string }> {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/saveBookGroup?v=${Date.now()}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          groupName: groupName
        },
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: string }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '创建分组失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 修改书籍分组
   * @param bookUrl 书籍URL
   * @param groupId 分组ID
   */
  async saveBookGroupId(bookUrl: string, groupId: number): Promise<{ isSuccess: boolean; errorMsg: string; data: any }> {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/saveBookGroupId?v=${Date.now()}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          bookUrl: bookUrl,
          groupId: groupId
        },
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: any }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '修改分组失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  /**
   * 删除书籍
   * @param bookData 书籍数据
   */
  async deleteBook(bookData: {
    bookUrl: string
    author: string
    coverUrl: string
    tocUrl: string
    canUpdate: boolean
    durChapterIndex: number
    durChapterPos: number
    durChapterTime: number
    kind: string
    intro: string
    lastCheckTime: number
    latestChapterTitle: string
    name: string
    origin: string
    originName: string
    totalChapterNum: number
    type: number
    group: number
    wordCount: string
  }) {
    return new Promise<{ isSuccess: boolean; errorMsg: string; data: string }>((resolve, reject) => {
      wx.request({
        url: `https://book.xoto.cc/reader3/deleteBook?v=${Date.now()}`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: bookData,
        success: (res) => {
          const result = res.data as { isSuccess: boolean; errorMsg: string; data: string }
          if (result.isSuccess) {
            resolve(result)
          } else {
            reject(new Error(result.errorMsg || '删除书籍失败'))
          }
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  }
}
