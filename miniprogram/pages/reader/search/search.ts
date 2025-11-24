// pages/reader/search/search.ts
import { searchBooks, getBookDetail } from '../../../utils/mockApi';

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

interface RemoteBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  category: string;
  totalChapters: number;
  fileSize: number;
  publishTime: string;
  rating: number;
}

Page({
  data: {
    keyword: '',
    searchResults: [] as RemoteBook[],
    isSearching: false,
    showNoResult: false,
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
  },

  // 输入搜索关键词
  onKeywordInput(e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value });
  },

  // 搜索按钮点击
  onSearchTap() {
    const { keyword } = this.data;
    if (!keyword.trim()) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    this.setData({ page: 1, searchResults: [] }, () => {
      this.performSearch();
    });
  },

  // 执行搜索
  async performSearch() {
    const { keyword, page, pageSize } = this.data;

    this.setData({ isSearching: true, showNoResult: false });

    try {
      const result = await searchBooks(keyword, page, pageSize);

      const searchResults = page === 1 ? result.books : [...this.data.searchResults, ...result.books];
      const hasMore = searchResults.length < result.total;

      this.setData({
        searchResults,
        total: result.total,
        hasMore,
        isSearching: false,
        showNoResult: result.books.length === 0 && page === 1,
      });
    } catch (error) {
      console.error('搜索失败:', error);
      wx.showToast({ title: '搜索失败，请重试', icon: 'error' });
      this.setData({ isSearching: false });
    }
  },

  // 加载更多
  onLoadMore() {
    const { hasMore, isSearching } = this.data;
    if (!hasMore || isSearching) return;

    this.setData({ page: this.data.page + 1 }, () => {
      this.performSearch();
    });
  },

  // 查看书籍详情
  async onBookTap(e: WechatMiniprogram.TouchEvent) {
    const bookId = e.currentTarget.dataset.id;

    wx.showLoading({ title: '加载中...' });

    try {
      const bookDetail = await getBookDetail(bookId);

      wx.hideLoading();

      // 显示书籍详情弹窗
      wx.showModal({
        title: bookDetail.title,
        content: `作者: ${bookDetail.author}\n分类: ${bookDetail.category}\n章节数: ${bookDetail.totalChapters}\n\n${bookDetail.description}`,
        confirmText: '加入书架',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.addToBookshelf(bookDetail);
          }
        },
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: '获取详情失败', icon: 'error' });
    }
  },

  // 添加到书架
  async addToBookshelf(remoteBook: RemoteBook) {
    wx.showLoading({ title: '添加中...' });

    try {
      // 模拟下载文件到本地
      // 实际应用中需要调用下载API
      await this.downloadBook(remoteBook.id);

      // 生成本地书籍对象
      const localBook: Book = {
        id: remoteBook.id,
        title: remoteBook.title,
        author: remoteBook.author,
        filePath: `${wx.env.USER_DATA_PATH}/${remoteBook.id}.txt`, // 模拟本地路径
        fileType: 'txt',
        progress: 0,
        lastReadTime: Date.now(),
        lastReadPosition: 0,
        category: 'reading',
        totalChapters: remoteBook.totalChapters,
        currentChapter: 0,
        fileSize: remoteBook.fileSize,
      };

      // 保存到本地书架
      const bookshelf = wx.getStorageSync('bookshelf') || [];

      // 检查是否已存在
      const existIndex = bookshelf.findIndex((b: Book) => b.id === localBook.id);
      if (existIndex !== -1) {
        wx.hideLoading();
        wx.showToast({ title: '书籍已在书架中', icon: 'none' });
        return;
      }

      bookshelf.unshift(localBook);
      wx.setStorageSync('bookshelf', bookshelf);

      wx.hideLoading();
      wx.showToast({ title: '已添加到书架', icon: 'success' });

      // 延迟返回书架
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      console.error('添加失败:', error);
      wx.showToast({ title: '添加失败，请重试', icon: 'error' });
    }
  },

  // 模拟下载书籍
  downloadBook(bookId: string): Promise<void> {
    return new Promise((resolve) => {
      // 模拟下载延迟
      setTimeout(() => {
        console.log(`书籍 ${bookId} 下载完成`);
        resolve();
      }, 1000);
    });
  },

  // 清空搜索
  onClearSearch() {
    this.setData({
      keyword: '',
      searchResults: [],
      showNoResult: false,
      page: 1,
      total: 0,
      hasMore: true,
    });
  },
});
