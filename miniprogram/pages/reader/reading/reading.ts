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

// 最大支持文件大小 200KB
const MAX_FILE_SIZE = 200 * 1024;

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

    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
  },

  fs: null as WechatMiniprogram.FileSystemManager | null,
  fullContent: '', // 完整内容缓存

  onLoad(options: Record<string, string>) {
    const bookId = options.id || '';
    this.setData({ bookId });

    this.fs = wx.getFileSystemManager();

    const systemInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight || 20 });

    this.loadSettings();
    this.loadBook(bookId);
    this.loadBookmarks(bookId);
  },

  onUnload() {
    this.saveProgress();
  },

  onHide() {
    this.saveProgress();
  },

  loadSettings() {
    const settings = wx.getStorageSync('readingSettings');
    if (settings) {
      this.setData({ settings });
    }
  },

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

    this.setData({ bookInfo: book, loadingText: '正在加载文件...' });

    // 获取文件信息
    try {
      const stat = this.fs!.statSync(book.filePath);
      const fileSize = stat.size;
      this.setData({ fileSize });

      console.log(`文件大小: ${(fileSize / 1024).toFixed(2)} KB`);

      // 检查文件大小
      if (fileSize > MAX_FILE_SIZE) {
        wx.showModal({
          title: '文件过大',
          content: `暂时不支持大文件阅读，请选择小于 ${Math.floor(MAX_FILE_SIZE / 1024)} KB 的文件`,
          showCancel: false,
          confirmText: '我知道了',
          success: () => {
            setTimeout(() => wx.navigateBack(), 500);
          },
        });
        this.setData({ isLoading: false });
        return;
      }

      // 加载文件
      this.loadFullFile(book);
    } catch (err) {
      console.error('获取文件信息失败:', err);
      wx.showToast({ title: '文件读取失败', icon: 'error' });
      this.setData({ isLoading: false });
    }
  },

  // 加载完整文件（小文件）
  loadFullFile(book: Book) {
    this.fs!.readFile({
      filePath: book.filePath,
      encoding: 'utf-8',
      success: (res) => {
        const content = res.data as string;
        this.fullContent = content;

        const chapters = this.parseChapters(content);
        this.setData({ chapters, fileSize: content.length });

        this.restorePosition(book.lastReadPosition || 0);
        this.setData({ isLoading: false });
      },
      fail: (err) => {
        console.error('读取文件失败:', err);
        wx.showToast({ title: '文件读取失败', icon: 'error' });
        this.setData({ isLoading: false });
      },
    });
  },

  // 解析章节
  parseChapters(content: string): Chapter[] {
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

        matches.push({ index: match.index, title: title.slice(0, 50) });
      }
    }

    matches = matches
      .filter((item, index, self) => index === self.findIndex(t => t.index === item.index))
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
        chapters.unshift({ index: -1, title: '前言', startPosition: 0, endPosition: matches[0].index });
        chapters.forEach((ch, idx) => { ch.index = idx; });
      }
    }

    return chapters;
  },

  // 恢复阅读位置
  restorePosition(position: number) {
    const { chapters } = this.data;

    let chapterIndex = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (position >= chapters[i].startPosition && position < chapters[i].endPosition) {
        chapterIndex = i;
        break;
      }
    }

    this.displayChapter(chapterIndex);
  },

  // 显示章节（小文件）
  displayChapter(chapterIndex: number) {
    const { chapters, fileSize } = this.data;
    const chapter = chapters[chapterIndex];

    if (!chapter) return;

    const content = this.fullContent.slice(chapter.startPosition, chapter.endPosition);
    const progress = (chapter.startPosition / fileSize) * 100;

    this.setData({
      currentContent: content,
      currentChapter: chapter,
      currentChapterIndex: chapterIndex,
      currentPosition: chapter.startPosition,
      progress: Math.min(progress, 100),
      currentPage: chapterIndex + 1,
      totalPages: chapters.length,
    });

    this.checkBookmarkStatus(chapter.startPosition);
  },

  // 保存进度
  saveProgress() {
    const { bookId, currentPosition, progress } = this.data;
    if (!bookId) return;

    const books = wx.getStorageSync('bookshelf') || [];
    const index = books.findIndex((b: Book) => b.id === bookId);

    if (index !== -1) {
      books[index].lastReadPosition = currentPosition;
      books[index].lastReadTime = Date.now();
      books[index].progress = Math.floor(progress);
      if (progress >= 95) books[index].category = 'finished';
      wx.setStorageSync('bookshelf', books);
    }
  },

  // 切换菜单
  toggleMenu() {
    const { showMenu, showCatalogPanel, showSettingsPanel } = this.data;
    if (showCatalogPanel || showSettingsPanel) {
      this.setData({ showCatalogPanel: false, showSettingsPanel: false });
      return;
    }
    this.setData({ showMenu: !showMenu });
  },

  goBack() {
    wx.navigateBack();
  },

  // 跳转章节
  jumpToChapter(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    this.setData({ showCatalogPanel: false });
    this.displayChapter(index);
  },

  // 进度变化
  onProgressChange(e: WechatMiniprogram.SliderChange) {
    const progress = e.detail.value;
    const { fileSize, chapters } = this.data;
    const position = Math.floor((progress / 100) * fileSize);

    let chapterIndex = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (position >= chapters[i].startPosition && position < chapters[i].endPosition) {
        chapterIndex = i;
        break;
      }
    }

    this.displayChapter(chapterIndex);
  },

  // ========== 书签功能 ==========

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

      this.setData({ bookmarks: [...bookmarks, newBookmark], isBookmarked: true });
      this.saveBookmarks();
      wx.showToast({ title: '已添加书签', icon: 'success' });
    }
  },

  loadBookmarks(bookId: string) {
    const allBookmarks = wx.getStorageSync('bookmarks') || {};
    this.setData({ bookmarks: allBookmarks[bookId] || [] });
  },

  saveBookmarks() {
    const { bookId, bookmarks } = this.data;
    const allBookmarks = wx.getStorageSync('bookmarks') || {};
    allBookmarks[bookId] = bookmarks;
    wx.setStorageSync('bookmarks', allBookmarks);
  },

  checkBookmarkStatus(position: number) {
    const isBookmarked = this.data.bookmarks.some(b => Math.abs(b.position - position) < 100);
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
    this.setData({ catalogTab: e.currentTarget.dataset.tab });
  },

  jumpToBookmark(e: WechatMiniprogram.TouchEvent) {
    const bookmark = this.data.bookmarks[e.currentTarget.dataset.index];
    if (bookmark) {
      this.setData({ showCatalogPanel: false });
      this.jumpToChapter({ currentTarget: { dataset: { index: bookmark.chapterIndex } } } as WechatMiniprogram.TouchEvent);
    }
  },

  // ========== 设置功能 ==========

  toggleNightMode() {
    const { settings } = this.data;
    const isNightMode = !settings.isNightMode;
    const theme = isNightMode ? 'dark' : 'white';

    this.setData({
      settings: {
        ...settings,
        isNightMode,
        bgTheme: theme,
        backgroundColor: BG_THEMES[theme].bg,
        textColor: BG_THEMES[theme].text,
      },
    });
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
    const { settings } = this.data;
    settings.lineHeight = parseFloat(e.currentTarget.dataset.value);
    this.setData({ settings });
    this.saveSettings();
  },

  setBgTheme(e: WechatMiniprogram.TouchEvent) {
    const theme = e.currentTarget.dataset.theme as keyof typeof BG_THEMES;
    const { settings } = this.data;

    this.setData({
      settings: {
        ...settings,
        bgTheme: theme,
        backgroundColor: BG_THEMES[theme].bg,
        textColor: BG_THEMES[theme].text,
        isNightMode: theme === 'dark',
      },
    });
    this.saveSettings();
  },

  setPageMode(e: WechatMiniprogram.TouchEvent) {
    const { settings } = this.data;
    settings.pageMode = e.currentTarget.dataset.mode;
    this.setData({ settings });
    this.saveSettings();
  },

  preventBubble() {},

  // ========== 手势翻页 ==========

  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY,
      touchStartTime: Date.now(),
    });
  },

  onTouchMove() {},

  onTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const { touchStartX, touchStartY, touchStartTime, settings, currentChapterIndex, chapters } = this.data;
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
        this.displayChapter(newIndex);
      }
    }
  },
});
