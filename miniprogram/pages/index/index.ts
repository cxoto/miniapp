// index.ts - iOS Style Home
import { OnlineMockApi } from '../../utils/onlineMockApi'

const app = getApp<IAppOption>()

interface UserProfile {
  avatarUrl: string
  nickName: string
  code?: string        // 微信登录凭证
  phoneNumber?: string // 手机号（需企业认证）
}

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
    // 用户信息
    userProfile: null as UserProfile | null,
    showProfilePopup: false,
    tempAvatarUrl: '',
    tempNickName: '',
    tempPhoneNumber: '',
  },

  lifetimes: {
    attached() {
      this.updateGreeting();
      this.updateDate();
      this.loadStats();
      this.loadUserProfile();
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
        const bookshelfData = await OnlineMockApi.getBookshelf(0)
        const books = bookshelfData.data || []
        const readingStats = {
          booksCount: books.length,
          currentBook: books.length > 0 ? books[0].name : '',
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
          this.onReaderTap();
          break;
        case 'todo':
          wx.switchTab({
            url: '/pages/todo/lists/lists',
          });
          break;
        case 'notes':
          wx.navigateTo({
            url: '/pages/notes/lists/lists',
          });
          break;
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

    // 加载本地存储的用户信息
    loadUserProfile() {
      const userProfile = wx.getStorageSync('userProfile') as UserProfile | null;
      if (userProfile) {
        this.setData({ userProfile });
      }
    },

    // 点击阅读按钮检查是否需要授权
    onReaderTap() {
      const userProfile = this.data.userProfile;
      if (!userProfile) {
        // 未授权，先调用 wx.login 获取 code
        wx.login({
          success: (res) => {
            console.log('wx.login code:', res.code);
            // 显示授权弹窗
            this.setData({
              showProfilePopup: true,
              tempAvatarUrl: '',
              tempNickName: '',
              tempPhoneNumber: '',
            });
          },
          fail: (err) => {
            console.error('wx.login 失败:', err);
            wx.showToast({ title: '登录失败', icon: 'none' });
          }
        });
      } else {
        // 已授权，直接跳转
        wx.switchTab({
          url: '/pages/online/bookshelf/bookshelf',
        });
      }
    },

    // 选择头像回调
    onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
      const { avatarUrl } = e.detail;
      this.setData({ tempAvatarUrl: avatarUrl });
    },

    // 输入昵称回调
    onNicknameInput(e: WechatMiniprogram.CustomEvent) {
      const nickName = e.detail.value;
      this.setData({ tempNickName: nickName });
    },

    // 获取手机号回调
    onGetPhoneNumber(e: WechatMiniprogram.CustomEvent) {
      if (e.detail.code) {
        // 获取成功，这里拿到的是加密的 code
        // 正常情况下需要发送到后端解密获取真实手机号
        // 由于没有后端，这里只存储 code 作为标识
        console.log('手机号授权 code:', e.detail.code);
        this.setData({ tempPhoneNumber: '已授权' });
        wx.showToast({ title: '手机号授权成功', icon: 'success' });
      } else {
        console.log('用户拒绝授权手机号');
        // 用户拒绝也允许继续，手机号非必填
      }
    },

    // 确认授权
    confirmProfile() {
      const { tempAvatarUrl, tempNickName, tempPhoneNumber } = this.data;

      if (!tempAvatarUrl) {
        wx.showToast({ title: '请选择头像', icon: 'none' });
        return;
      }

      if (!tempNickName.trim()) {
        wx.showToast({ title: '请输入昵称', icon: 'none' });
        return;
      }

      // 调用 wx.login 获取最新 code
      wx.login({
        success: (loginRes) => {
          const userProfile: UserProfile = {
            avatarUrl: tempAvatarUrl,
            nickName: tempNickName.trim(),
            code: loginRes.code,
            phoneNumber: tempPhoneNumber || undefined,
          };

          // 保存到本地存储
          wx.setStorageSync('userProfile', userProfile);

          this.setData({
            userProfile,
            showProfilePopup: false,
          });

          // 跳转到阅读页面
          wx.switchTab({
            url: '/pages/online/bookshelf/bookshelf',
          });
        },
        fail: () => {
          wx.showToast({ title: '登录失败', icon: 'none' });
        }
      });
    },

    // 关闭授权弹窗
    closeProfilePopup() {
      this.setData({ showProfilePopup: false });
    },

    // 阻止事件冒泡
    preventBubble() {
      // 空方法，用于阻止事件冒泡
    },
  },
});
