// pages/reader/reading/reading.ts
// 大文件分片加载版本

interface Book {
  id: string;
  title: string;
  author?: string;
  filePath: string;
  fileType: 'txt' | 'epub';
  progress: number;
  lastReadTime: number;
  lastReadPosition: number;
  category: 'reading' | 'finished' | 'all';
  totalChapters?: number;
  currentChapter?: number;
  fileSize?: number;
}

interface Chapter {
  index: number;
  title: string;
  startPosition: number;
  endPosition: number;
}

interface Bookmark {
  id: string;
  bookId: string;
  position: number;
  content: string;
  chapterTitle: string;
  chapterIndex: number;
  time: number;
  timeStr: string;
}

interface ReadingSettings {
  fontSize: number;
  lineHeight: number;
  backgroundColor: string;
  textColor: string;
  bgTheme: 'white' | 'sepia' | 'green' | 'dark';
  isNightMode: boolean;
  pageMode: 'slide' | 'scroll';
}

const BG_THEMES: Record<string, { bg: string; text: string }> = {
  white: { bg: '#ffffff', text: '#333333' },
  sepia: { bg: '#f5e6c8', text: '#5c4b37' },
  green: { bg: '#c7edcc', text: '#3d5c3f' },
  dark: { bg: '#1a1a1a', text: '#999999' },
};

// 每次加载的字符数（约50KB，安全范围内）
const CHUNK_SIZE = 50000;
// 章节扫描时每次读取的大小
const SCAN_CHUNK_SIZE = 100000;

Page({
  data: {
    bookId: '',
    bookInfo: {} as Book,
    fileSize: 0,
    currentContent: '',
    chapters: [] as Chapter[],
    currentChapterIndex: 0,
    currentChapter: { title: '', index: 0 } as Chapter,
    currentPage: 1,
    totalPages: 1,
    progress: 0,
    currentPosition: 0,

    showMenu: false,
    showCatalogPanel: false,
    showSettingsPanel: false,
    catalogTab: 'chapters',

    bookmarks: [] as Bookmark[],
    isBookmarked: false,

    isLoading: true,
    loadingText: '加载中...',
    statusBarHeight: 20,

    settings: {
      fontSize: 32,
      lineHeight: 1.8,
      backgroundColor: '#ffffff',
      textColor: '#333333',
      bgTheme: 'white',
      isNightMode: false,
      pageMode: 'scroll',
    } as ReadingSettings,

    // 触摸相关
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
  },

  // 文件系统管理器
  fs: null as WechatMiniprogram.FileSystemManager | null,

  onLoad(options: Record<string, string>) {
    const bookId = options.id || '';
    this.setData({ bookId });

    this.fs = wx.getFileSystemManager();

    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });

    // 加载设置
    this.loadSettings();

    // 加载书籍
    this.loadBook(bookId);

    // 加载书签
    this.loadBookmarks(bookId);
  },

  onUnload() {
    this.saveProgress();
  },

  onHide() {
    this.saveProgress();
  },

  // 加载设置
  loadSettings() {
    const settings = wx.getStorageSync('readingSettings');
    if (settings) {
      this.setData({ settings });
    }
  },

  // 保存设置
  saveSettings() {
    wx.setStorageSync('readingSettings', this.data.settings);
  },

  // 加载书籍
  loadBook(bookId: string) {
    const books = wx.getStorageSync('bookshelf') || [];
    const book = books.find((b: Book) => b.id === bookId);

    if (!book) {
      wx.showToast({ title: '书籍不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({ bookInfo: book, loadingText: '正在分析文件...' });

    // 获取文件大小
    try {
      const stat = this.fs!.statSync(book.filePath);
      const fileSize = stat.size;
      this.setData({ fileSize });

      console.log(`文件大小: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

      // 根据文件大小决定加载策略
      if (fileSize < 500 * 1024) {
        // 小于500KB，直接全部加载
        this.loadSmallFile(book);
      } else {
        // 大文件，分片加载
        this.loadLargeFile(book, fileSize);
      }
    } catch (err) {
      console.error('获取文件信息失败:', err);
      wx.showToast({ title: '文件读取失败', icon: 'error' });
      this.setData({ isLoading: false });
    }
  },

  // 加载小文件（原有逻辑）
  loadSmallFile(book: Book) {
    this.fs!.readFile({
      filePath: book.filePath,
      encoding: 'utf-8',
      success: (res) => {
        const content = res.data as string;
        const chapters = this.parseChaptersFromContent(content);

        // 存储完整内容用于小文件
        this.fullContent = content;

        this.setData({ chapters });
        this.restoreReadingPosition(book.lastReadPosition || 0);
        this.setData({ isLoading: false });
      },
      fail: (err) => {
        console.error('读取文件失败:', err);
        wx.showToast({ title: '文件读取失败', icon: 'error' });
        this.setData({ isLoading: false });
      },
    });
  },

  // 完整内容（仅小文件使用）
  fullContent: '',

  // 加载大文件
  async loadLargeFile(book: Book, fileSize: number) {
    this.setData({ loadingText: '正在分析章节...' });

    try {
      // 第一步：扫描文件建立章节索引
      const chapters = await this.scanChapters(book.filePath, fileSize);
      this.setData({ chapters });

      // 第二步：恢复阅读位置
      const lastPosition = book.lastReadPosition || 0;
      await this.loadContentAtPosition(book.filePath, lastPosition, chapters);

      this.setData({ isLoading: false });
    } catch (err) {
      console.error('加载大文件失败:', err);
      wx.showToast({ title: '文件加载失败', icon: 'error' });
      this.setData({ isLoading: false });
    }
  },

  // 扫描章节（分片扫描）
  scanChapters(filePath: string, fileSize: number): Promise<Chapter[]> {
    return new Promise((resolve) => {
      const chapters: Chapter[] = [];
      const chapterPatterns = [
        /^第[一二三四五六七八九十百千万零\d]+[章节回集卷部篇]/,
        /^Chapter\s*\d+/i,
        /^卷[一二三四五六七八九十\d]+/,
      ];

      let position = 0;
      let chapterIndex = 0;
      let lastChapterEnd = 0;

      const scanNextChunk = () => {
        if (position >= fileSize) {
          // 扫描完成，处理最后一个章节
          if (chapters.length > 0) {
            chapters[chapters.length - 1].endPosition = fileSize;
          } else {
            // 没有找到章节，创建默认章节
            chapters.push({
              index: 0,
              title: this.data.bookInfo.title || '正文',
              startPosition: 0,
              endPosition: fileSize,
            });
          }
          resolve(chapters);
          return;
        }

        const readSize = Math.min(SCAN_CHUNK_SIZE, fileSize - position);

        this.fs!.read({
          filePath: filePath,
          position: position,
          length: readSize,
          encoding: 'utf-8',
          success: (res) => {
            const chunk = res.data as string;
            const lines = chunk.split('\n');

            let offset = 0;
            for (const line of lines) {
              const trimmedLine = line.trim();

              for (const pattern of chapterPatterns) {
                if (pattern.test(trimmedLine)) {
                  // 找到新章节
                  const chapterStart = position + offset;

                  // 更新上一章节的结束位置
                  if (chapters.length > 0) {
                    chapters[chapters.length - 1].endPosition = chapterStart;
                  }

                  chapters.push({
                    index: chapterIndex++,
                    title: trimmedLine.slice(0, 50),
                    startPosition: chapterStart,
                    endPosition: fileSize, // 临时值
                  });

                  lastChapterEnd = chapterStart;
                  break;
                }
              }

              offset += line.length + 1; // +1 for newline
            }

            // 更新进度
            const progress = Math.floor((position / fileSize) * 100);
            this.setData({ loadingText: `分析章节中 ${progress}%` });

            position += readSize;

            // 避免在chunk边界处重复扫描，回退一点
            if (position < fileSize) {
              position -= 200;
            }

            // 继续扫描下一块
            setTimeout(scanNextChunk, 0);
          },
          fail: (err) => {
            console.error('扫描文件失败:', err);
            // 创建默认章节
            chapters.push({
              index: 0,
              title: this.data.bookInfo.title || '正文',
              startPosition: 0,
              endPosition: fileSize,
            });
            resolve(chapters);
          },
        });
      };

      // 如果文件开头有内容但没有章节标题，添加"前言"
      this.fs!.read({
        filePath: filePath,
        position: 0,
        length: Math.min(1000, fileSize),
        encoding: 'utf-8',
        success: (res) => {
          const firstChunk = res.data as string;
          const firstLine = firstChunk.split('\n')[0].trim();

          let hasChapterAtStart = false;
          for (const pattern of chapterPatterns) {
            if (pattern.test(firstLine)) {
              hasChapterAtStart = true;
              break;
            }
          }

          if (!hasChapterAtStart && firstChunk.trim().length > 0) {
            chapters.push({
              index: chapterIndex++,
              title: '前言',
              startPosition: 0,
              endPosition: fileSize,
            });
          }

          scanNextChunk();
        },
        fail: () => {
          scanNextChunk();
        },
      });
    });
  },

  // 在指定位置加载内容
  async loadContentAtPosition(filePath: string, position: number, chapters: Chapter[]) {
    // 找到对应的章节
    let chapterIndex = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (position >= chapters[i].startPosition && position < chapters[i].endPosition) {
        chapterIndex = i;
        break;
      }
    }

    await this.loadChapter(filePath, chapterIndex, chapters);
  },

  // 加载指定章节
  loadChapter(filePath: string, chapterIndex: number, chapters?: Chapter[]): Promise<void> {
    const chapterList = chapters || this.data.chapters;
    const chapter = chapterList[chapterIndex];

    if (!chapter) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const startPos = chapter.startPosition;
      const endPos = chapter.endPosition;
      const length = Math.min(endPos - startPos, CHUNK_SIZE * 4); // 最多加载200KB

      this.fs!.read({
        filePath: filePath,
        position: startPos,
        length: length,
        encoding: 'utf-8',
        success: (res) => {
          let content = res.data as string;

          // 如果内容被截断，在最后一个完整段落处截断
          if (length < endPos - startPos) {
            const lastNewline = content.lastIndexOf('\n\n');
            if (lastNewline > content.length * 0.8) {
              content = content.slice(0, lastNewline) + '\n\n[...]';
            }
          }

          const progress = (startPos / this.data.fileSize) * 100;

          this.setData({
            currentContent: content,
            currentChapter: chapter,
            currentChapterIndex: chapterIndex,
            currentPosition: startPos,
            progress: Math.min(progress, 100),
            currentPage: chapterIndex + 1,
            totalPages: chapterList.length,
          });

          this.checkBookmarkStatus(startPos);
          resolve();
        },
        fail: (err) => {
          console.error('加载章节失败:', err);
          wx.showToast({ title: '加载失败', icon: 'error' });
          resolve();
        },
      });
    });
  },

  // 从内容解析章节（小文件用）
  parseChaptersFromContent(content: string): Chapter[] {
    const chapters: Chapter[] = [];
    const chapterPatterns = [
      /^第[一二三四五六七八九十百千万零\d]+[章节回集卷部篇]/gm,
      /^Chapter\s*\d+/gim,
      /^卷[一二三四五六七八九十\d]+/gm,
    ];

    let matches: { index: number; title: string }[] = [];

    for (const pattern of chapterPatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const lineStart = match.index;
        let lineEnd = content.indexOf('\n', lineStart);
        if (lineEnd === -1) lineEnd = content.length;
        const title = content.slice(lineStart, lineEnd).trim();

        matches.push({
          index: match.index,
          title: title.slice(0, 50),
        });
      }
    }

    matches = matches
      .filter((item, index, self) =>
        index === self.findIndex(t => t.index === item.index)
      )
      .sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      chapters.push({
        index: 0,
        title: this.data.bookInfo.title || '正文',
        startPosition: 0,
        endPosition: content.length,
      });
    } else {
      matches.forEach((match, idx) => {
        chapters.push({
          index: idx,
          title: match.title,
          startPosition: match.index,
          endPosition: idx < matches.length - 1 ? matches[idx + 1].index : content.length,
        });
      });

      if (matches[0].index > 100) {
        chapters.unshift({
          index: -1,
          title: '前言',
          startPosition: 0,
          endPosition: matches[0].index,
        });
        chapters.forEach((ch, idx) => { ch.index = idx; });
      }
    }

    return chapters;
  },

  // 恢复阅读位置（小文件用）
  restoreReadingPosition(position: number) {
    const { chapters } = this.data;

    let chapterIndex = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (position >= chapters[i].startPosition && position < chapters[i].endPosition) {
        chapterIndex = i;
        break;
      }
    }

    this.displayContent(chapterIndex, position);
  },

  // 显示内容（小文件用）
  displayContent(chapterIndex: number, position?: number) {
    const { chapters } = this.data;
    const chapter = chapters[chapterIndex];

    if (!chapter) return;

    const chapterContent = this.fullContent.slice(chapter.startPosition, chapter.endPosition);
    const currentPos = position || chapter.startPosition;
    const progress = (currentPos / this.fullContent.length) * 100;

    this.setData({
      currentContent: chapterContent,
      currentChapter: chapter,
      currentChapterIndex: chapterIndex,
      currentPosition: currentPos,
      progress: Math.min(progress, 100),
      currentPage: chapterIndex + 1,
      totalPages: chapters.length,
    });

    this.checkBookmarkStatus(currentPos);
  },

  // 保存阅读进度
  saveProgress() {
    const { bookId, currentPosition, progress } = this.data;
    if (!bookId) return;

    const books = wx.getStorageSync('bookshelf') || [];
    const index = books.findIndex((b: Book) => b.id === bookId);

    if (index !== -1) {
      books[index].lastReadPosition = currentPosition;
      books[index].lastReadTime = Date.now();
      books[index].progress = Math.floor(progress);

      if (progress >= 95) {
        books[index].category = 'finished';
      }

      wx.setStorageSync('bookshelf', books);
    }
  },

  // 切换菜单显示
  toggleMenu() {
    const { showMenu, showCatalogPanel, showSettingsPanel } = this.data;

    if (showCatalogPanel || showSettingsPanel) {
      this.setData({ showCatalogPanel: false, showSettingsPanel: false });
      return;
    }

    this.setData({ showMenu: !showMenu });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 跳转到章节
  jumpToChapter(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const { bookInfo, fileSize } = this.data;

    this.setData({ showCatalogPanel: false, isLoading: true, loadingText: '加载中...' });

    if (fileSize < 500 * 1024) {
      // 小文件
      this.displayContent(index);
      this.setData({ isLoading: false });
    } else {
      // 大文件
      this.loadChapter(bookInfo.filePath, index).then(() => {
        this.setData({ isLoading: false });
      });
    }
  },

  // 进度变化
  onProgressChange(e: WechatMiniprogram.SliderChange) {
    const progress = e.detail.value;
    const { fileSize, chapters, bookInfo } = this.data;
    const position = Math.floor((progress / 100) * fileSize);

    // 找到对应章节
    let chapterIndex = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (position >= chapters[i].startPosition && position < chapters[i].endPosition) {
        chapterIndex = i;
        break;
      }
    }

    this.setData({ isLoading: true, loadingText: '加载中...' });

    if (fileSize < 500 * 1024) {
      this.displayContent(chapterIndex, position);
      this.setData({ isLoading: false });
    } else {
      this.loadChapter(bookInfo.filePath, chapterIndex).then(() => {
        this.setData({ isLoading: false });
      });
    }
  },

  // ========== 以下是不变的功能 ==========

  // 切换书签
  toggleBookmark() {
    const { bookId, currentPosition, currentChapter, bookmarks, isBookmarked, currentContent } = this.data;

    if (isBookmarked) {
      const newBookmarks = bookmarks.filter(b => Math.abs(b.position - currentPosition) > 100);
      this.setData({ bookmarks: newBookmarks, isBookmarked: false });
      this.saveBookmarks();
      wx.showToast({ title: '已取消书签', icon: 'none' });
    } else {
      const content = currentContent.slice(0, 50).trim();
      const now = new Date();
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        bookId,
        position: currentPosition,
        content: content + '...',
        chapterTitle: currentChapter.title,
        chapterIndex: currentChapter.index,
        time: now.getTime(),
        timeStr: `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`,
      };

      const newBookmarks = [...bookmarks, newBookmark];
      this.setData({ bookmarks: newBookmarks, isBookmarked: true });
      this.saveBookmarks();
      wx.showToast({ title: '已添加书签', icon: 'success' });
    }
  },

  loadBookmarks(bookId: string) {
    const allBookmarks = wx.getStorageSync('bookmarks') || {};
    const bookmarks = allBookmarks[bookId] || [];
    this.setData({ bookmarks });
  },

  saveBookmarks() {
    const { bookId, bookmarks } = this.data;
    const allBookmarks = wx.getStorageSync('bookmarks') || {};
    allBookmarks[bookId] = bookmarks;
    wx.setStorageSync('bookmarks', allBookmarks);
  },

  checkBookmarkStatus(position: number) {
    const { bookmarks } = this.data;
    const isBookmarked = bookmarks.some(b => Math.abs(b.position - position) < 100);
    this.setData({ isBookmarked });
  },

  showCatalog() {
    this.setData({ showCatalogPanel: true, showMenu: false, catalogTab: 'chapters' });
  },

  closeCatalog() {
    this.setData({ showCatalogPanel: false });
  },

  showBookmarks() {
    this.setData({ showCatalogPanel: true, showMenu: false, catalogTab: 'bookmarks' });
  },

  switchCatalogTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ catalogTab: tab });
  },

  jumpToBookmark(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const bookmark = this.data.bookmarks[index];
    if (bookmark) {
      this.setData({ showCatalogPanel: false });
      this.jumpToChapter({ currentTarget: { dataset: { index: bookmark.chapterIndex } } } as WechatMiniprogram.TouchEvent);
    }
  },

  toggleNightMode() {
    const { settings } = this.data;
    const isNightMode = !settings.isNightMode;

    const newSettings = {
      ...settings,
      isNightMode,
      bgTheme: isNightMode ? 'dark' : 'white',
      backgroundColor: isNightMode ? BG_THEMES.dark.bg : BG_THEMES.white.bg,
      textColor: isNightMode ? BG_THEMES.dark.text : BG_THEMES.white.text,
    };

    this.setData({ settings: newSettings });
    this.saveSettings();
  },

  showSettings() {
    this.setData({ showSettingsPanel: true, showMenu: false });
  },

  closeSettings() {
    this.setData({ showSettingsPanel: false });
  },

  decreaseFontSize() {
    const { settings } = this.data;
    if (settings.fontSize > 24) {
      settings.fontSize -= 2;
      this.setData({ settings });
      this.saveSettings();
    }
  },

  increaseFontSize() {
    const { settings } = this.data;
    if (settings.fontSize < 48) {
      settings.fontSize += 2;
      this.setData({ settings });
      this.saveSettings();
    }
  },

  setLineHeight(e: WechatMiniprogram.TouchEvent) {
    const value = parseFloat(e.currentTarget.dataset.value);
    const { settings } = this.data;
    settings.lineHeight = value;
    this.setData({ settings });
    this.saveSettings();
  },

  setBgTheme(e: WechatMiniprogram.TouchEvent) {
    const theme = e.currentTarget.dataset.theme as keyof typeof BG_THEMES;
    const { settings } = this.data;

    settings.bgTheme = theme;
    settings.backgroundColor = BG_THEMES[theme].bg;
    settings.textColor = BG_THEMES[theme].text;
    settings.isNightMode = theme === 'dark';

    this.setData({ settings });
    this.saveSettings();
  },

  setPageMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode;
    const { settings } = this.data;
    settings.pageMode = mode;
    this.setData({ settings });
    this.saveSettings();
  },

  preventBubble() {},

  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY,
      touchStartTime: Date.now(),
    });
  },

  onTouchMove(_e: WechatMiniprogram.TouchEvent) {},

  onTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const { touchStartX, touchStartY, touchStartTime, settings, currentChapterIndex, chapters, bookInfo, fileSize } = this.data;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;

    if (settings.pageMode === 'slide' && deltaTime < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      let newIndex = currentChapterIndex;

      if (deltaX > 0 && currentChapterIndex > 0) {
        newIndex = currentChapterIndex - 1;
      } else if (deltaX < 0 && currentChapterIndex < chapters.length - 1) {
        newIndex = currentChapterIndex + 1;
      }

      if (newIndex !== currentChapterIndex) {
        this.setData({ isLoading: true, loadingText: '加载中...' });

        if (fileSize < 500 * 1024) {
          this.displayContent(newIndex);
          this.setData({ isLoading: false });
        } else {
          this.loadChapter(bookInfo.filePath, newIndex).then(() => {
            this.setData({ isLoading: false });
          });
        }
      }
    }
  },
});
