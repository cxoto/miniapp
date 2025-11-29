// pages/notes/editor/editor.ts
import { formatTime } from '../../../utils/util'

interface Note {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: number;
  updatedAt: number;
  updatedAtFormated: string;
  isPinned: boolean;
}

interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
  isSystem: boolean;
}

Page({
  data: {
    // 导航栏相关
    contentTop: 0,

    noteId: '',
    note: {} as Note,
    isNewNote: true,
    hasChanges: false,

    // 文件夹
    folders: [] as Folder[],
    currentFolder: null as Folder | null,
    showFolderPicker: false,

    // 编辑器
    title: '',
    content: '',
    titleFocus: false,
    contentFocus: false,

    // 工具栏
    showToolbar: true,
    showFormatMenu: false,

    // 分享菜单
    showShareMenu: false,

    // 更多菜单
    showMoreMenu: false,

    // 日期显示
    dateStr: '',
    charCount: 0,
  },

  onLoad(options: Record<string, string>) {
    this.initNavBar();
    this.loadFolders();

    if (options.id) {
      // 编辑现有备忘录
      this.setData({ noteId: options.id, isNewNote: false });
      this.loadNote(options.id);
    } else {
      // 新建备忘录
      const folderId = options.folderId || 'default';
      this.createNewNote(folderId);
    }
  },

  onUnload() {
    this.saveNote();
  },

  // 初始化导航栏高度
  initNavBar() {
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    // 整个内容区域从胶囊按钮底部开始
    const contentTop = menuButtonInfo.bottom + 8;

    this.setData({
      contentTop,
    });
  },

  // 加载文件夹列表
  loadFolders() {
    const folders = wx.getStorageSync('notesFolders') || [];
    this.setData({ folders: folders.filter((f: Folder) => f.id !== 'all') });
  },

  // 加载备忘录
  loadNote(noteId: string) {
    const allNotes: Note[] = wx.getStorageSync('notesData') || [];
    const note = allNotes.find(n => n.id === noteId);

    if (!note) {
      wx.showToast({ title: '备忘录不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const { folders } = this.data;
    const currentFolder = folders.find(f => f.id === note.folderId) || null;

    this.setData({
      note,
      title: note.title,
      content: note.content,
      currentFolder,
      dateStr: this.formatDate(note.updatedAt),
      charCount: note.content.length,
    });
  },

  // 新建备忘录
  createNewNote(folderId: string) {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      folderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      updatedAtFormated: formatTime(new Date),
      isPinned: false,
    };

    const { folders } = this.data;
    const currentFolder = folders.find(f => f.id === folderId) || null;

    this.setData({
      noteId: newNote.id,
      note: newNote,
      title: '',
      content: '',
      currentFolder,
      dateStr: this.formatDate(newNote.updatedAt),
      titleFocus: true,
      charCount: 0,
    });
  },

  // 保存备忘录
  saveNote() {
    const { note, title, content, isNewNote } = this.data;

    // 如果是新建且没有内容，不保存
    if (isNewNote && !title.trim() && !content.trim()) {
      return;
    }

    // 如果没有变化，不保存
    if (!this.data.hasChanges && !isNewNote) {
      return;
    }

    const allNotes: Note[] = wx.getStorageSync('notesData') || [];

    note.title = title.trim() || this.extractTitle(content);
    note.content = content;
    note.updatedAt = Date.now();

    const existingIndex = allNotes.findIndex(n => n.id === note.id);
    if (existingIndex !== -1) {
      allNotes[existingIndex] = note;
    } else {
      allNotes.unshift(note);
    }

    wx.setStorageSync('notesData', allNotes);
    this.setData({
      note,
      isNewNote: false,
      hasChanges: false,
      dateStr: this.formatDate(note.updatedAt),
    });
  },

  // 从内容提取标题
  extractTitle(content: string): string {
    const firstLine = content.split('\n')[0].trim();
    if (firstLine) {
      return firstLine.slice(0, 50);
    }
    return '新建备忘录';
  },

  // 标题输入
  onTitleInput(e: WechatMiniprogram.Input) {
    const title = e.detail.value;
    this.setData({
      title,
      hasChanges: true,
    });
  },

  // 标题输入完成，切换到内容
  onTitleConfirm() {
    this.setData({
      titleFocus: false,
      contentFocus: true,
    });
  },

  // 内容输入
  onContentInput(e: WechatMiniprogram.Input) {
    const content = e.detail.value;
    this.setData({
      content,
      hasChanges: true,
      charCount: content.length,
    });
  },

  // 返回
  goBack() {
    this.saveNote();
    wx.navigateBack();
  },

  // 删除备忘录
  deleteNote() {
    const { noteId, isNewNote } = this.data;

    if (isNewNote) {
      wx.navigateBack();
      return;
    }

    wx.showModal({
      title: '删除备忘录',
      content: '确定要删除这个备忘录吗？',
      confirmColor: '#FF453A',
      success: (res) => {
        if (res.confirm) {
          const allNotes: Note[] = wx.getStorageSync('notesData') || [];
          const updatedNotes = allNotes.filter(n => n.id !== noteId);
          wx.setStorageSync('notesData', updatedNotes);

          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 800);
        }
      },
    });
  },

  // 切换置顶
  togglePin() {
    const { note } = this.data;
    note.isPinned = !note.isPinned;
    this.setData({ note, hasChanges: true });
    this.saveNote();

    wx.showToast({
      title: note.isPinned ? '已置顶' : '已取消置顶',
      icon: 'success',
    });
  },

  // 显示文件夹选择器
  showFolderSelector() {
    this.setData({ showFolderPicker: true });
  },

  // 隐藏文件夹选择器
  hideFolderSelector() {
    this.setData({ showFolderPicker: false });
  },

  // 选择文件夹
  selectFolder(e: WechatMiniprogram.TouchEvent) {
    const folderId = e.currentTarget.dataset.id;
    const { note, folders } = this.data;

    note.folderId = folderId;
    const currentFolder = folders.find(f => f.id === folderId) || null;

    this.setData({
      note,
      currentFolder,
      showFolderPicker: false,
      hasChanges: true,
    });

    this.saveNote();
    wx.showToast({ title: '已移动', icon: 'success' });
  },

  // 显示分享菜单
  showShare() {
    this.setData({ showShareMenu: true });
  },

  // 隐藏分享菜单
  hideShare() {
    this.setData({ showShareMenu: false });
  },

  // 复制内容
  copyContent() {
    const { title, content } = this.data;
    const text = title ? `${title}\n\n${content}` : content;

    wx.setClipboardData({
      data: text,
      success: () => {
        this.setData({ showShareMenu: false });
        wx.showToast({ title: '已复制', icon: 'success' });
      },
    });
  },

  // 显示更多菜单
  showMore() {
    this.setData({ showMoreMenu: true });
  },

  // 隐藏更多菜单
  hideMore() {
    this.setData({ showMoreMenu: false });
  },


  // 切换格式菜单
  toggleFormatMenu() {
    this.setData({ showFormatMenu: !this.data.showFormatMenu });
  },

  // 格式化日期
  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (date.toDateString() === now.toDateString()) {
      return `今天 ${hours}:${minutes}`;
    }

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    if (date.toDateString() === yesterday.toDateString()) {
      return `昨天 ${hours}:${minutes}`;
    }

    if (year === now.getFullYear()) {
      return `${month}月${day}日 ${hours}:${minutes}`;
    }

    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  },

  // 获取字数统计
  getWordCount(): string {
    const { content } = this.data;
    const chars = content.length;
    return `${chars} 个字符`;
  },

  // 阻止冒泡
  preventBubble() {
    // 空函数
  },
});
