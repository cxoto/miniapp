// pages/reader/bookshelf/bookshelf.ts

interface Book {
  id: string;
  title: string;
  author?: string;
  coverUrl?: string;
  coverColor?: string;
  filePath: string;
  fileType: 'txt' | 'epub';
  progress: number;
  lastReadTime: number;
  lastReadPosition: number;
  category: 'reading' | 'finished' | 'all';
  selected?: boolean;
  totalChapters?: number;
  currentChapter?: number;
  addTime: number;
}

Page({
  data: {
    bookList: [] as Book[],
    currentCategory: 'all',
    isEditMode: false,
    showAddModal: false,
    selectedCount: 0,
    isAllSelected: false,
  },

  onLoad() {
    this.loadBooks();
  },

  onShow() {
    this.loadBooks();
  },

  // 加载书籍列表
  loadBooks() {
    const books = wx.getStorageSync('bookshelf') || [];
    const currentCategory = this.data.currentCategory;

    let filteredBooks = books;
    if (currentCategory !== 'all') {
      filteredBooks = books.filter((book: Book) => book.category === currentCategory);
    }

    // 按最后阅读时间排序
    filteredBooks.sort((a: Book, b: Book) => b.lastReadTime - a.lastReadTime);

    this.setData({
      bookList: filteredBooks.map((book: Book) => Object.assign({}, book, { selected: false })),
      selectedCount: 0,
      isAllSelected: false,
    });
  },

  // 切换分类
  switchCategory(e: WechatMiniprogram.TouchEvent) {
    const category = e.currentTarget.dataset.category;
    this.setData({ currentCategory: category });
    this.loadBooks();
  },

  // 切换编辑模式
  toggleEditMode() {
    const isEditMode = !this.data.isEditMode;
    if (!isEditMode) {
      // 退出编辑模式时清除选择状态
      const bookList = this.data.bookList.map(book => Object.assign({}, book, { selected: false }));
      this.setData({ bookList, selectedCount: 0, isAllSelected: false });
    }
    this.setData({ isEditMode });
  },

  // 打开书籍
  openBook(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id;
    const book = this.data.bookList.find(b => b.id === id);
    if (book) {
      wx.navigateTo({
        url: `/pages/reader/reading/reading?id=${id}`,
      });
    }
  },

  // 添加书籍
  addBook() {
    this.setData({ showAddModal: true });
  },

  // 关闭添加弹窗
  closeAddModal() {
    this.setData({ showAddModal: false });
  },

  // 阻止事件冒泡
  preventBubble() {
    // 空函数，仅用于阻止冒泡
  },

  // 从文件导入
  importFromFile() {
    this.setData({ showAddModal: false });

    wx.chooseMessageFile({
      count: 10,
      type: 'file',
      extension: ['txt', 'epub'],
      success: (res) => {
        const files = res.tempFiles;
        files.forEach(file => {
          this.processImportedFile(file);
        });
      },
      fail: (err) => {
        console.error('选择文件失败:', err);
      },
    });
  },

  // 从聊天记录导入
  importFromChat() {
    this.importFromFile(); // 使用相同的API
  },

  // 处理导入的文件
  processImportedFile(file: WechatMiniprogram.ChooseFile) {
    const fileName = file.name;
    const filePath = file.path;
    const fileType = fileName.toLowerCase().endsWith('.epub') ? 'epub' : 'txt';

    // 生成书籍封面颜色
    const colors = ['#4A90D9', '#7B68EE', '#3CB371', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // 提取书名（去掉扩展名）
    const title = fileName.replace(/\.(txt|epub)$/i, '');

    const newBook: Book = {
      id: Date.now().toString(),
      title: title,
      filePath: filePath,
      fileType: fileType,
      coverColor: randomColor,
      progress: 0,
      lastReadTime: Date.now(),
      lastReadPosition: 0,
      category: 'reading',
      addTime: Date.now(),
    };

    // 保存到本地存储
    const books = wx.getStorageSync('bookshelf') || [];
    books.unshift(newBook);
    wx.setStorageSync('bookshelf', books);

    // 复制文件到本地
    const localPath = `${wx.env.USER_DATA_PATH}/books/${newBook.id}.${fileType}`;

    // 确保目录存在
    const fs = wx.getFileSystemManager();
    try {
      fs.accessSync(`${wx.env.USER_DATA_PATH}/books`);
    } catch {
      fs.mkdirSync(`${wx.env.USER_DATA_PATH}/books`, true);
    }

    fs.copyFile({
      srcPath: filePath,
      destPath: localPath,
      success: () => {
        // 更新文件路径
        newBook.filePath = localPath;
        const updatedBooks = wx.getStorageSync('bookshelf') || [];
        const index = updatedBooks.findIndex((b: Book) => b.id === newBook.id);
        if (index !== -1) {
          updatedBooks[index].filePath = localPath;
          wx.setStorageSync('bookshelf', updatedBooks);
        }

        wx.showToast({
          title: '导入成功',
          icon: 'success',
        });
        this.loadBooks();
      },
      fail: (err) => {
        console.error('复制文件失败:', err);
        wx.showToast({
          title: '导入失败',
          icon: 'error',
        });
      },
    });
  },

  // 切换选择书籍
  toggleSelectBook(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const bookList = this.data.bookList;
    bookList[index].selected = !bookList[index].selected;

    const selectedCount = bookList.filter(book => book.selected).length;
    const isAllSelected = selectedCount === bookList.length && bookList.length > 0;

    this.setData({ bookList, selectedCount, isAllSelected });
  },

  // 全选/取消全选
  selectAll() {
    const isAllSelected = !this.data.isAllSelected;
    const bookList = this.data.bookList.map(book => Object.assign({}, book, { selected: isAllSelected }));
    const selectedCount = isAllSelected ? bookList.length : 0;

    this.setData({ bookList, selectedCount, isAllSelected });
  },

  // 删除选中的书籍
  deleteSelected() {
    const selectedBooks = this.data.bookList.filter(book => book.selected);
    if (selectedBooks.length === 0) {
      wx.showToast({
        title: '请选择书籍',
        icon: 'none',
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedBooks.length} 本书籍吗？`,
      success: (res) => {
        if (res.confirm) {
          const books = wx.getStorageSync('bookshelf') || [];
          const selectedIds = selectedBooks.map(book => book.id);
          const remainingBooks = books.filter((book: Book) => !selectedIds.includes(book.id));

          // 删除本地文件
          const fs = wx.getFileSystemManager();
          selectedBooks.forEach(book => {
            try {
              fs.unlinkSync(book.filePath);
            } catch (err) {
              console.error('删除文件失败:', err);
            }
          });

          wx.setStorageSync('bookshelf', remainingBooks);
          this.setData({ isEditMode: false });
          this.loadBooks();

          wx.showToast({
            title: '删除成功',
            icon: 'success',
          });
        }
      },
    });
  },
});
