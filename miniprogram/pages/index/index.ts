// index.ts
// 获取应用实例
const app = getApp<IAppOption>()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Component({
    data: {
        motto: 'Hello World',
        userInfo: {
            avatarUrl: defaultAvatarUrl,
            nickName: '',
        },
        hasUserInfo: false,
        canIUseGetUserProfile: wx.canIUse('getUserProfile'),
        canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    },
    methods: {
        // 事件处理函数
        toCases() {
            wx.navigateTo({
                url: '../cases/cases',
            })
        },
        // 获取Token函数
        getToken(): void {
            wx.getUserProfile({
                desc: '获取您的个人信息', // 说明获取个人信息的原因
                success: (res) => {
                    const userInfo = res.userInfo; // 获取用户个人信息
                    console.log('用户信息:', userInfo);

                    // 在这里生成Token，可以根据业务需求生成
                    const token = this.generateToken(userInfo); // 生成Token
                    console.log('生成的Token:', token);

                    // 存储token
                    wx.setStorageSync('userToken', token);

                    // 显示提示框，告诉用户Token已获取
                    wx.showToast({
                        title: 'Token已获取',
                        icon: 'success',
                        duration: 2000,
                    });
                },
                fail: (err) => {
                    console.error('获取用户信息失败:', err);
                    wx.showToast({
                        title: '获取信息失败',
                        icon: 'none',
                        duration: 2000,
                    });
                },
            });
        },

        getTokenn() {
            wx.login({
                success (res) {
                  if (res.code) {
                    console.log('获取code成功！' + res.code)
                    //发起网络请求
                    wx.request({
                      url: 'https://example.com/onLogin',
                      data: {
                        code: res.code
                      }
                    })
                  } else {
                    wx.showToast({
                        title: '获取信息失败',
                        icon: 'none',
                        duration: 2000,
                    });
                  }
                }
              })
        },

        // 生成Token的简单逻辑
        generateToken(userInfo: WechatMiniprogram.UserInfo): string {
            // 这里简单使用用户名加时间戳生成token，实际中可以用更安全的生成方式
            return `${userInfo.nickName}-${Date.now()}`;
        },
        showTodo(): void {
            wx.showModal({
                title: '提示',
                content: '功能开发中',
                showCancel: false,  // 是否显示取消按钮
                confirmText: '确定',  // 确定按钮的文本
                confirmColor: '#3CC51F',  // 确定按钮的颜色
                success: (res: WechatMiniprogram.ShowModalSuccessCallbackResult) => {
                    if (res.confirm) {
                        console.log('用户点击确定');
                    }
                },
            });
        },
    },
})
