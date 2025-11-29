// pages/notes/lists/lists.ts

interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: number;
  updatedAt: number;
  isPinned: boolean;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  isSystem: boolean;
  createdAt: number;
}

Page({
  data: {
    // 导航栏相关
    contentTop: 0,

    // 文件夹
    folders: [] as Folder[],
    currentFolder: null as Folder | null,
    showFolderList: true,

    // 备忘录
    allNotes: [] as Note[],
    displayNotes: [] as Note[],
    pinnedNotes: [] as Note[],
    unpinnedNotes: [] as Note[],

    // 搜索
    searchKeyword: '',
    isSearching: false,
    searchResults: [] as Note[],

    // 编辑模式
    isEditMode: false,
    selectedNotes: [] as string[],

    // 新建文件夹
    showNewFolder: false,
    newFolderName: '',
    newFolderColor: '#FFD60A',
    colorOptions: ['#FFD60A', '#FF9F0A', '#FF453A', '#BF5AF2', '#5E5CE6', '#007AFF', '#32D74B', '#64D2FF'],

    // 统计
    totalNotesCount: 0,
  },

  onLoad() {
    this.initNavBar();
    this.initDefaultFolders();
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 初始化导航栏高度
  initNavBar() {
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 整个内容区域从胶囊按钮底部开始
    const contentTop = menuButtonInfo.bottom + 8; // 胶囊按钮底部 + 间距

    this.setData({
      contentTop,
    });
  },

  // 初始化默认文件夹
  initDefaultFolders() {
    const existingFolders = wx.getStorageSync('notesFolders') || [];
    if (existingFolders.length === 0) {
      const defaultFolders: Folder[] = [
        { id: 'all', name: '所有备忘录', color: '#FFD60A', icon: '📝', isSystem: true, createdAt: Date.now() },
        { id: 'default', name: '备忘录', color: '#FFD60A', icon: '📁', isSystem: true, createdAt: Date.now() },
      ];
      wx.setStorageSync('notesFolders', defaultFolders);
    }
  },

  // 加载数据
  loadData() {
    const folders = wx.getStorageSync('notesFolders') || [];
    const allNotes: Note[] = wx.getStorageSync('notesData') || [];

    // 计算每个文件夹的备忘录数量
    const foldersWithCount = folders.map((folder: Folder) => {
      let count = 0;
      if (folder.id === 'all') {
        count = allNotes.length;
      } else {
        count = allNotes.filter((note: Note) => note.folderId === folder.id).length;
      }
      return { ...folder, count };
    });

    this.setData({
      folders: foldersWithCount,
      allNotes,
      totalNotesCount: allNotes.length,
    });

    // 如果当前在文件夹内，刷新显示
    if (this.data.currentFolder) {
      this.filterNotes(this.data.currentFolder.id);
    }
  },

  // 进入文件夹
  enterFolder(e: WechatMiniprogram.TouchEvent) {
    const folderId = e.currentTarget.dataset.id;
    const folder = this.data.folders.find(f => f.id === folderId);

    if (folder) {
      this.setData({
        currentFolder: folder,
        showFolderList: false,
        isEditMode: false,
        selectedNotes: [],
      });
      this.filterNotes(folderId);
    }
  },

  // 过滤备忘录
  filterNotes(folderId: string) {
    const { allNotes } = this.data;
    let filteredNotes: Note[];

    if (folderId === 'all') {
      filteredNotes = allNotes;
    } else {
      filteredNotes = allNotes.filter(note => note.folderId === folderId);
    }

    // 按更新时间排序
    filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);

    // 分离置顶和普通备忘录
    const pinnedNotes = filteredNotes.filter(note => note.isPinned);
    const unpinnedNotes = filteredNotes.filter(note => !note.isPinned);

    this.setData({
      displayNotes: filteredNotes,
      pinnedNotes,
      unpinnedNotes,
    });
  },

  // 返回文件夹列表
  backToFolders() {
    this.setData({
      showFolderList: true,
      currentFolder: null,
      isEditMode: false,
      selectedNotes: [],
      searchKeyword: '',
      isSearching: false,
    });
    this.loadData();
  },

  // 搜索输入
  onSearchInput(e: WechatMiniprogram.Input) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });

    if (keyword.trim()) {
      this.setData({ isSearching: true });
      this.searchNotes(keyword);
    } else {
      this.setData({ isSearching: false, searchResults: [] });
    }
  },

  // 搜索备忘录
  searchNotes(keyword: string) {
    const { allNotes } = this.data;
    const lowerKeyword = keyword.toLowerCase();

    const results = allNotes.filter(note =>
      note.title.toLowerCase().includes(lowerKeyword) ||
      note.content.toLowerCase().includes(lowerKeyword)
    );

    this.setData({ searchResults: results });
  },

  // 清除搜索
  clearSearch() {
    this.setData({
      searchKeyword: '',
      isSearching: false,
      searchResults: [],
    });
  },

  // 新建备忘录
  createNote() {
    const { currentFolder } = this.data;
    const folderId = currentFolder ? (currentFolder.id === 'all' ? 'default' : currentFolder.id) : 'default';

    wx.navigateTo({
      url: `/pages/notes/editor/editor?folderId=${folderId}`,
    });
  },

  // 打开备忘录
  openNote(e: WechatMiniprogram.TouchEvent) {
    if (this.data.isEditMode) {
      this.toggleNoteSelection(e);
      return;
    }

    const noteId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/notes/editor/editor?id=${noteId}`,
    });
  },

  // 切换编辑模式
  toggleEditMode() {
    this.setData({
      isEditMode: !this.data.isEditMode,
      selectedNotes: [],
    });
  },

  // 切换备忘录选择
  toggleNoteSelection(e: WechatMiniprogram.TouchEvent) {
    const noteId = e.currentTarget.dataset.id;
    const { selectedNotes } = this.data;

    const index = selectedNotes.indexOf(noteId);
    if (index > -1) {
      selectedNotes.splice(index, 1);
    } else {
      selectedNotes.push(noteId);
    }

    this.setData({ selectedNotes });
  },

  // 全选/取消全选
  toggleSelectAll() {
    const { displayNotes, selectedNotes } = this.data;

    if (selectedNotes.length === displayNotes.length) {
      this.setData({ selectedNotes: [] });
    } else {
      this.setData({ selectedNotes: displayNotes.map(note => note.id) });
    }
  },

  // 删除选中备忘录
  deleteSelectedNotes() {
    const { selectedNotes, allNotes } = this.data;

    if (selectedNotes.length === 0) {
      wx.showToast({ title: '请先选择备忘录', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '删除备忘录',
      content: `确定要删除 ${selectedNotes.length} 个备忘录吗？`,
      confirmColor: '#FF453A',
      success: (res) => {
        if (res.confirm) {
          const updatedNotes = allNotes.filter(note => !selectedNotes.includes(note.id));
          wx.setStorageSync('notesData', updatedNotes);

          this.setData({
            isEditMode: false,
            selectedNotes: [],
          });
          this.loadData();
          if (this.data.currentFolder) {
            this.filterNotes(this.data.currentFolder.id);
          }

          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  // 移动选中备忘录
  moveSelectedNotes() {
    const { selectedNotes, folders } = this.data;

    if (selectedNotes.length === 0) {
      wx.showToast({ title: '请先选择备忘录', icon: 'none' });
      return;
    }

    const folderNames = folders.filter(f => f.id !== 'all').map(f => f.name);
    wx.showActionSheet({
      itemList: folderNames,
      success: (res) => {
        const targetFolder = folders.filter(f => f.id !== 'all')[res.tapIndex];
        if (targetFolder) {
          const { allNotes } = this.data;
          selectedNotes.forEach(noteId => {
            const note = allNotes.find(n => n.id === noteId);
            if (note) {
              note.folderId = targetFolder.id;
              note.updatedAt = Date.now();
            }
          });

          wx.setStorageSync('notesData', allNotes);
          this.setData({
            isEditMode: false,
            selectedNotes: [],
          });
          this.loadData();
          if (this.data.currentFolder) {
            this.filterNotes(this.data.currentFolder.id);
          }

          wx.showToast({ title: '已移动', icon: 'success' });
        }
      },
    });
  },

  // 长按备忘录
  onNoteLongPress(e: WechatMiniprogram.TouchEvent) {
    const noteId = e.currentTarget.dataset.id;
    const note = this.data.allNotes.find(n => n.id === noteId);

    if (!note) return;

    const actions = note.isPinned ? ['取消置顶', '移动', '删除'] : ['置顶', '移动', '删除'];

    wx.showActionSheet({
      itemList: actions,
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.togglePin(noteId);
            break;
          case 1:
            this.setData({ selectedNotes: [noteId] });
            this.moveSelectedNotes();
            break;
          case 2:
            this.deleteSingleNote(noteId);
            break;
        }
      },
    });
  },

  // 切换置顶
  togglePin(noteId: string) {
    const { allNotes } = this.data;
    const note = allNotes.find(n => n.id === noteId);

    if (note) {
      note.isPinned = !note.isPinned;
      note.updatedAt = Date.now();
      wx.setStorageSync('notesData', allNotes);
      this.loadData();
      if (this.data.currentFolder) {
        this.filterNotes(this.data.currentFolder.id);
      }
    }
  },

  // 删除单个备忘录
  deleteSingleNote(noteId: string) {
    wx.showModal({
      title: '删除备忘录',
      content: '确定要删除这个备忘录吗？',
      confirmColor: '#FF453A',
      success: (res) => {
        if (res.confirm) {
          const { allNotes } = this.data;
          const updatedNotes = allNotes.filter(note => note.id !== noteId);
          wx.setStorageSync('notesData', updatedNotes);
          this.loadData();
          if (this.data.currentFolder) {
            this.filterNotes(this.data.currentFolder.id);
          }
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  // 显示新建文件夹弹窗
  showNewFolderModal() {
    this.setData({
      showNewFolder: true,
      newFolderName: '',
      newFolderColor: '#FFD60A',
    });
  },

  // 隐藏新建文件夹弹窗
  hideNewFolderModal() {
    this.setData({ showNewFolder: false });
  },

  // 新建文件夹名称输入
  onNewFolderNameInput(e: WechatMiniprogram.Input) {
    this.setData({ newFolderName: e.detail.value });
  },

  // 选择文件夹颜色
  selectFolderColor(e: WechatMiniprogram.TouchEvent) {
    const color = e.currentTarget.dataset.color;
    this.setData({ newFolderColor: color });
  },

  // 创建新文件夹
  createNewFolder() {
    const { newFolderName, newFolderColor, folders } = this.data;

    if (!newFolderName.trim()) {
      wx.showToast({ title: '请输入文件夹名称', icon: 'none' });
      return;
    }

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      color: newFolderColor,
      icon: '📁',
      isSystem: false,
      createdAt: Date.now(),
    };

    const updatedFolders = folders.concat([newFolder]);
    wx.setStorageSync('notesFolders', updatedFolders);

    this.setData({ showNewFolder: false });
    this.loadData();

    wx.showToast({ title: '已创建', icon: 'success' });
  },

  // 长按文件夹
  onFolderLongPress(e: WechatMiniprogram.TouchEvent) {
    const folderId = e.currentTarget.dataset.id;
    const folder = this.data.folders.find(f => f.id === folderId);

    if (!folder || folder.isSystem) return;

    wx.showActionSheet({
      itemList: ['重命名', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.renameFolder(folder);
        } else if (res.tapIndex === 1) {
          this.deleteFolder(folder);
        }
      },
    });
  },

  // 重命名文件夹
  renameFolder(folder: Folder) {
    wx.showModal({
      title: '重命名文件夹',
      editable: true,
      placeholderText: folder.name,
      success: (res) => {
        if (res.confirm && res.content) {
          const { folders } = this.data;
          const index = folders.findIndex(f => f.id === folder.id);
          if (index !== -1) {
            folders[index].name = res.content;
            wx.setStorageSync('notesFolders', folders);
            this.loadData();
          }
        }
      },
    });
  },

  // 删除文件夹
  deleteFolder(folder: Folder) {
    const { allNotes } = this.data;
    const notesInFolder = allNotes.filter(note => note.folderId === folder.id);

    wx.showModal({
      title: '删除文件夹',
      content: notesInFolder.length > 0
        ? `"${folder.name}"中有 ${notesInFolder.length} 个备忘录，删除文件夹后备忘录将移动到默认文件夹。`
        : `确定要删除"${folder.name}"吗？`,
      confirmColor: '#FF453A',
      success: (res) => {
        if (res.confirm) {
          // 移动备忘录到默认文件夹
          notesInFolder.forEach(note => {
            note.folderId = 'default';
          });
          wx.setStorageSync('notesData', allNotes);

          // 删除文件夹
          const { folders } = this.data;
          const updatedFolders = folders.filter(f => f.id !== folder.id);
          wx.setStorageSync('notesFolders', updatedFolders);

          this.loadData();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      },
    });
  },

  // 返回主页
  goBack() {
    wx.navigateBack();
  },

  // 格式化时间
  formatTime(timestamp: number): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - timestamp;

    // 今天
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    // 昨天
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    }

    // 本周
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    }

    // 更早
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  // 阻止冒泡
  preventBubble() {
    // 空函数
  },
});
