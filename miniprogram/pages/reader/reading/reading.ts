// pages/reader/reading/reading.ts

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

Page({
  data: {
    bookId: '',
    bookInfo: {} as Book,
    fullContent: '',
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

  onLoad(options: Record<string, string>) {
    const bookId = options.id || '';
    this.setData({ bookId });

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
    // 保存阅读进度
    this.saveProgress();
  },

  onHide() {
    // 保存阅读进度
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
      wx.showToast({
        title: '书籍不存在',
        icon: 'error',
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ bookInfo: book });

    // 读取文件内容
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: book.filePath,
      encoding: 'utf-8',
      success: (res) => {
        const content = res.data as string;
        this.setData({ fullContent: content });

        // 解析章节
        this.parseChapters(content);

        // 恢复上次阅读位置
        this.restoreReadingPosition(book.lastReadPosition || 0);

        this.setData({ isLoading: false });
      },
      fail: (err) => {
        console.error('读取文件失败:', err);
        wx.showToast({
          title: '文件读取失败',
          icon: 'error',
        });
        this.setData({ isLoading: false });
      },
    });
  },

  // 解析章节
  parseChapters(content: string) {
    const chapters: Chapter[] = [];

    // 常见的章节标题正则
    const chapterPatterns = [
      /^第[一二三四五六七八九十百千万零\d]+[章节回集卷部篇]/gm,
      /^Chapter\s*\d+/gim,
      /^卷[一二三四五六七八九十\d]+/gm,
      /^\d+[.、]\s*.+$/gm,
    ];

    let matches: { index: number; title: string }[] = [];

    for (const pattern of chapterPatterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        // 获取该行完整内容作为标题
        const lineStart = match.index;
        let lineEnd = content.indexOf('\n', lineStart);
        if (lineEnd === -1) lineEnd = content.length;
        const title = content.slice(lineStart, lineEnd).trim();

        matches.push({
          index: match.index,
          title: title.slice(0, 50), // 限制标题长度
        });
      }
    }

    // 去重并排序
    matches = matches
      .filter((item, index, self) =>
        index === self.findIndex(t => t.index === item.index)
      )
      .sort((a, b) => a.index - b.index);

    // 如果没有找到章节，创建一个默认章节
    if (matches.length === 0) {
      chapters.push({
        index: 0,
        title: this.data.bookInfo.title || '正文',
        startPosition: 0,
        endPosition: content.length,
      });
    } else {
      // 创建章节对象
      matches.forEach((match, idx) => {
        chapters.push({
          index: idx,
          title: match.title,
          startPosition: match.index,
          endPosition: idx < matches.length - 1 ? matches[idx + 1].index : content.length,
        });
      });

      // 如果第一章不是从开头开始，添加一个前言章节
      if (matches[0].index > 100) {
        chapters.unshift({
          index: -1,
          title: '前言',
          startPosition: 0,
          endPosition: matches[0].index,
        });
        // 重新编号
        chapters.forEach((ch, idx) => {
          ch.index = idx;
        });
      }
    }

    this.setData({ chapters });
  },

  // 恢复阅读位置
  restoreReadingPosition(position: number) {
    const { chapters, fullContent } = this.data;

    // 找到对应章节
    let chapterIndex = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (position >= chapters[i].startPosition &&
          position < chapters[i].endPosition) {
        chapterIndex = i;
        break;
      }
    }

    this.setData({
      currentChapterIndex: chapterIndex,
      currentChapter: chapters[chapterIndex] || { title: '', index: 0 },
      currentPosition: position,
    });

    // 显示当前内容
    this.displayContent(chapterIndex, position);
  },

  // 显示内容
  displayContent(chapterIndex: number, position?: number) {
    const { chapters, fullContent } = this.data;
    const chapter = chapters[chapterIndex];

    if (!chapter) return;

    // 获取章节内容
    const chapterContent = fullContent.slice(chapter.startPosition, chapter.endPosition);

    // 计算进度
    const currentPos = position || chapter.startPosition;
    const progress = (currentPos / fullContent.length) * 100;

    this.setData({
      currentContent: chapterContent,
      currentChapter: chapter,
      currentChapterIndex: chapterIndex,
      currentPosition: currentPos,
      progress: Math.min(progress, 100),
      currentPage: chapterIndex + 1,
      totalPages: chapters.length,
    });

    // 检查当前位置是否有书签
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

      // 如果进度达到95%以上，标记为已读完
      if (progress >= 95) {
        books[index].category = 'finished';
      }

      wx.setStorageSync('bookshelf', books);
    }
  },

  // 切换菜单显示
  toggleMenu() {
    const { showMenu, showCatalogPanel, showSettingsPanel } = this.data;

    // 如果有其他面板打开，先关闭
    if (showCatalogPanel || showSettingsPanel) {
      this.setData({
        showCatalogPanel: false,
        showSettingsPanel: false,
      });
      return;
    }

    this.setData({ showMenu: !showMenu });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 切换书签
  toggleBookmark() {
    const { bookId, currentPosition, currentChapter, fullContent, bookmarks, isBookmarked } = this.data;

    if (isBookmarked) {
      // 删除书签
      const newBookmarks = bookmarks.filter(b => Math.abs(b.position - currentPosition) > 100);
      this.setData({ bookmarks: newBookmarks, isBookmarked: false });
      this.saveBookmarks();
      wx.showToast({ title: '已取消书签', icon: 'none' });
    } else {
      // 添加书签
      const content = fullContent.slice(currentPosition, currentPosition + 50).trim();
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

  // 加载书签
  loadBookmarks(bookId: string) {
    const allBookmarks = wx.getStorageSync('bookmarks') || {};
    const bookmarks = allBookmarks[bookId] || [];
    this.setData({ bookmarks });
  },

  // 保存书签
  saveBookmarks() {
    const { bookId, bookmarks } = this.data;
    const allBookmarks = wx.getStorageSync('bookmarks') || {};
    allBookmarks[bookId] = bookmarks;
    wx.setStorageSync('bookmarks', allBookmarks);
  },

  // 检查书签状态
  checkBookmarkStatus(position: number) {
    const { bookmarks } = this.data;
    const isBookmarked = bookmarks.some(b => Math.abs(b.position - position) < 100);
    this.setData({ isBookmarked });
  },

  // 显示目录
  showCatalog() {
    this.setData({
      showCatalogPanel: true,
      showMenu: false,
      catalogTab: 'chapters',
    });
  },

  // 关闭目录
  closeCatalog() {
    this.setData({ showCatalogPanel: false });
  },

  // 显示书签列表
  showBookmarks() {
    this.setData({
      showCatalogPanel: true,
      showMenu: false,
      catalogTab: 'bookmarks',
    });
  },

  // 切换目录标签
  switchCatalogTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ catalogTab: tab });
  },

  // 跳转到章节
  jumpToChapter(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    this.displayContent(index);
    this.setData({ showCatalogPanel: false });
  },

  // 跳转到书签
  jumpToBookmark(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const bookmark = this.data.bookmarks[index];
    if (bookmark) {
      this.restoreReadingPosition(bookmark.position);
      this.setData({ showCatalogPanel: false });
    }
  },

  // 进度变化
  onProgressChange(e: WechatMiniprogram.SliderChange) {
    const progress = e.detail.value;
    const { fullContent } = this.data;
    const position = Math.floor((progress / 100) * fullContent.length);
    this.restoreReadingPosition(position);
  },

  // 切换夜间模式
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

  // 显示设置
  showSettings() {
    this.setData({
      showSettingsPanel: true,
      showMenu: false,
    });
  },

  // 关闭设置
  closeSettings() {
    this.setData({ showSettingsPanel: false });
  },

  // 减小字体
  decreaseFontSize() {
    const { settings } = this.data;
    if (settings.fontSize > 24) {
      settings.fontSize -= 2;
      this.setData({ settings });
      this.saveSettings();
    }
  },

  // 增大字体
  increaseFontSize() {
    const { settings } = this.data;
    if (settings.fontSize < 48) {
      settings.fontSize += 2;
      this.setData({ settings });
      this.saveSettings();
    }
  },

  // 设置行高
  setLineHeight(e: WechatMiniprogram.TouchEvent) {
    const value = parseFloat(e.currentTarget.dataset.value);
    const { settings } = this.data;
    settings.lineHeight = value;
    this.setData({ settings });
    this.saveSettings();
  },

  // 设置背景主题
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

  // 设置翻页模式
  setPageMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode;
    const { settings } = this.data;
    settings.pageMode = mode;
    this.setData({ settings });
    this.saveSettings();
  },

  // 阻止冒泡
  preventBubble() {
    // 空函数
  },

  // 触摸开始
  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY,
      touchStartTime: Date.now(),
    });
  },

  // 触摸移动
  onTouchMove(_e: WechatMiniprogram.TouchEvent) {
    // 可用于实现滑动翻页效果
  },

  // 触摸结束
  onTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const { touchStartX, touchStartY, touchStartTime, settings, currentChapterIndex, chapters } = this.data;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;

    // 滑动翻页模式
    if (settings.pageMode === 'slide' && deltaTime < 300 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0 && currentChapterIndex > 0) {
        // 向右滑动 - 上一章
        this.displayContent(currentChapterIndex - 1);
      } else if (deltaX < 0 && currentChapterIndex < chapters.length - 1) {
        // 向左滑动 - 下一章
        this.displayContent(currentChapterIndex + 1);
      }
    }
  },
});
