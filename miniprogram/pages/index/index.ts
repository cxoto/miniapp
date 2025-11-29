// index.ts - iOS Style Home
import { OnlineMockApi } from '../../utils/onlineMockApi'

const app = getApp<IAppOption>()

Component({
  data: {
    greeting: '下午好',
    dateStr: '',
    readingStats: {
      booksCount: 0,
      currentBook: '',
    },
    todoStats: {
      todayCount: 0,
      importantCount: 0,
    },
  },

  lifetimes: {
    attached() {
      this.updateGreeting();
      this.updateDate();
      this.loadStats();
    },
  },

  pageLifetimes: {
    show() {
      this.loadStats();
    },
  },

  methods: {
    // 更新问候语
    updateGreeting() {
      const hour = new Date().getHours();
      let greeting = '你好';

      if (hour >= 5 && hour < 12) {
        greeting = '早上好';
      } else if (hour >= 12 && hour < 14) {
        greeting = '中午好';
      } else if (hour >= 14 && hour < 18) {
        greeting = '下午好';
      } else if (hour >= 18 && hour < 22) {
        greeting = '晚上好';
      } else {
        greeting = '夜深了';
      }

      this.setData({ greeting });
    },

    // 更新日期
    updateDate() {
      const now = new Date();
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;
      this.setData({ dateStr });
    },

    // 加载统计数据
    async loadStats() {
      // 在线阅读统计
      try {
        const bookshelfData = await OnlineMockApi.getBookshelf('user_001')
        const readingStats = {
          booksCount: bookshelfData.books.length,
          currentBook: bookshelfData.books.length > 0 ? bookshelfData.books[0].bookName : '',
        }
        this.setData({ readingStats })
      } catch (error) {
        console.error('加载阅读统计失败:', error)
        this.setData({
          readingStats: {
            booksCount: 0,
            currentBook: '',
          }
        })
      }

      // 任务统计
      const tasks = wx.getStorageSync('todoTasks') || [];
      const todayTasks = tasks.filter((t: { myDay: boolean; completed: boolean }) => t.myDay && !t.completed);
      const importantTasks = tasks.filter((t: { important: boolean; completed: boolean }) => t.important && !t.completed);

      const todoStats = {
        todayCount: todayTasks.length,
        importantCount: importantTasks.length,
      };

      this.setData({ todoStats });
    },

    // 打开 App
    openApp(e: WechatMiniprogram.TouchEvent) {
      const appName = e.currentTarget.dataset.app;

      switch (appName) {
        case 'reader':
          wx.switchTab({
            url: '/pages/online/bookshelf/bookshelf',
          });
          break;
        case 'todo':
          wx.switchTab({
            url: '/pages/todo/lists/lists',
          });
          break;
        case 'notes':
        case 'express':
        case 'settings':
        case 'more':
          wx.showToast({
            title: '功能开发中',
            icon: 'none',
          });
          break;
        default:
          break;
      }
    },

    // 搜索点击
    onSearchTap() {
      wx.showToast({
        title: '搜索功能开发中',
        icon: 'none',
      });
    },
  },
});
