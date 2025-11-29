// pages/todo/detail/detail.ts

interface Task {
  id: string;
  title: string;
  completed: boolean;
  important: boolean;
  myDay: boolean;
  dueDate?: number;
  dueDateStr?: string;
  isOverdue?: boolean;
  listId: string;
  note?: string;
  subtasks?: Subtask[];
  createdAt: number;
  completedAt?: number;
  reminder?: number;
  reminderStr?: string;
  repeat?: string;
  repeatStr?: string;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface TodoList {
  id: string;
  name: string;
  color: string;
}

Page({
  data: {
    taskId: '',
    task: {} as Task,
    currentList: {} as TodoList,
    allLists: [] as TodoList[],

    // 子任务
    showSubtaskInput: false,

    // 日期选择器
    showDatePicker: false,
    datePickerTitle: '',
    datePickerType: '', // 'due' or 'reminder'
    pickerDate: '',
    todayStr: '',
    tomorrowStr: '',
    nextWeekStr: '',

    // 列表选择器
    showListSelector: false,

    // 重复选择器
    showRepeatSelector: false,

    // 日期显示
    createdDateStr: '',
    completedDateStr: '',
  },

  onLoad(options: Record<string, string>) {
    const taskId = options.id || '';
    this.setData({ taskId });

    this.initDates();
    this.loadLists();
    this.loadTask(taskId);
  },

  onShow() {
    if (this.data.taskId) {
      this.loadTask(this.data.taskId);
    }
  },

  // 初始化日期
  initDates() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    this.setData({
      pickerDate: this.formatDate(now),
      todayStr: `${weekDays[now.getDay()]}`,
      tomorrowStr: `${weekDays[tomorrow.getDay()]}`,
      nextWeekStr: `${nextWeek.getMonth() + 1}月${nextWeek.getDate()}日`,
    });
  },

  // 格式化日期
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期时间显示
  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  // 加载列表
  loadLists() {
    const customLists = wx.getStorageSync('todoLists') || [];
    const defaultList: TodoList[] = [{ id: 'inbox', name: '任务', color: '#0078d4' }];
    const allLists: TodoList[] = defaultList.concat(customLists);
    this.setData({ allLists });
  },

  // 加载任务
  loadTask(taskId: string) {
    const allTasks = wx.getStorageSync('todoTasks') || [];
    const task = allTasks.find((t: Task) => t.id === taskId);

    if (!task) {
      wx.showToast({ title: '任务不存在', icon: 'error' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    // 处理日期显示
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      task.dueDateStr = `${dueDate.getMonth() + 1}月${dueDate.getDate()}日`;

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const dueDateStart = new Date(task.dueDate);
      dueDateStart.setHours(0, 0, 0, 0);
      task.isOverdue = dueDateStart.getTime() < now.getTime() && !task.completed;
    }

    if (task.reminder) {
      task.reminderStr = this.formatDateTime(task.reminder);
    }

    if (task.repeat) {
      const repeatMap: Record<string, string> = {
        daily: '每天',
        weekday: '工作日',
        weekly: '每周',
        monthly: '每月',
        yearly: '每年',
      };
      task.repeatStr = repeatMap[task.repeat] || '';
    }

    // 获取当前列表信息
    const { allLists } = this.data;
    const currentList = allLists.find(l => l.id === task.listId) || { id: 'inbox', name: '任务', color: '#0078d4' };

    // 格式化创建和完成时间
    const createdDateStr = task.createdAt ? this.formatDateTime(task.createdAt) : '';
    const completedDateStr = task.completedAt ? this.formatDateTime(task.completedAt) : '';

    this.setData({
      task,
      currentList,
      createdDateStr,
      completedDateStr,
    });
  },

  // 保存任务
  saveTask() {
    const { task } = this.data;
    const allTasks = wx.getStorageSync('todoTasks') || [];
    const index = allTasks.findIndex((t: Task) => t.id === task.id);

    if (index !== -1) {
      allTasks[index] = task;
      wx.setStorageSync('todoTasks', allTasks);
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  },

  // 删除任务
  deleteTask() {
    wx.showModal({
      title: '删除任务',
      content: '确定要删除这个任务吗？',
      success: (res) => {
        if (res.confirm) {
          const { taskId } = this.data;
          const allTasks = wx.getStorageSync('todoTasks') || [];
          const updatedTasks = allTasks.filter((t: Task) => t.id !== taskId);
          wx.setStorageSync('todoTasks', updatedTasks);

          wx.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1000);
        }
      },
    });
  },

  // 切换完成状态
  toggleComplete() {
    const { task } = this.data;
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : undefined;

    const completedDateStr = task.completedAt ? this.formatDateTime(task.completedAt) : '';
    this.setData({ task, completedDateStr });
    this.saveTask();
  },

  // 切换重要状态
  toggleImportant() {
    const { task } = this.data;
    task.important = !task.important;
    this.setData({ task });
    this.saveTask();
  },

  // 标题输入
  onTitleInput(e: WechatMiniprogram.Input) {
    const { task } = this.data;
    task.title = e.detail.value;
    this.setData({ task });
  },

  // 子任务相关
  showAddSubtask() {
    this.setData({ showSubtaskInput: true });
  },

  hideAddSubtask() {
    this.setData({ showSubtaskInput: false });
  },

  addSubtask(e: WechatMiniprogram.InputConfirm) {
    const title = e.detail.value.trim();
    if (!title) {
      this.setData({ showSubtaskInput: false });
      return;
    }

    const { task } = this.data;
    if (!task.subtasks) {
      task.subtasks = [];
    }

    task.subtasks.push({
      id: Date.now().toString(),
      title,
      completed: false,
    });

    this.setData({ task, showSubtaskInput: false });
    this.saveTask();
  },

  toggleSubtask(e: WechatMiniprogram.TouchEvent) {
    const subtaskId = e.currentTarget.dataset.id;
    const { task } = this.data;

    if (task.subtasks) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      if (subtask) {
        subtask.completed = !subtask.completed;
        this.setData({ task });
        this.saveTask();
      }
    }
  },

  onSubtaskInput(e: WechatMiniprogram.Input) {
    const subtaskId = e.currentTarget.dataset.id;
    const { task } = this.data;

    if (task.subtasks) {
      const subtask = task.subtasks.find(s => s.id === subtaskId);
      if (subtask) {
        subtask.title = e.detail.value;
        this.setData({ task });
      }
    }
  },

  deleteSubtask(e: WechatMiniprogram.TouchEvent) {
    const subtaskId = e.currentTarget.dataset.id;
    const { task } = this.data;

    if (task.subtasks) {
      task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
      this.setData({ task });
      this.saveTask();
    }
  },

  // 我的一天
  toggleMyDay() {
    const { task } = this.data;
    task.myDay = !task.myDay;
    this.setData({ task });
    this.saveTask();
  },

  removeMyDay() {
    const { task } = this.data;
    task.myDay = false;
    this.setData({ task });
    this.saveTask();
  },

  // 截止日期
  showDueDatePicker() {
    this.setData({
      showDatePicker: true,
      datePickerTitle: '添加截止日期',
      datePickerType: 'due',
    });
  },

  hideDatePicker() {
    this.setData({ showDatePicker: false });
  },

  setDate(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    const now = new Date();
    let date: Date;

    switch (type) {
      case 'today':
        date = now;
        break;
      case 'tomorrow':
        date = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'nextweek':
        date = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        date = now;
    }

    this.applyDate(date.getTime());
  },

  onDatePickerChange(e: WechatMiniprogram.PickerChange) {
    const dateStr = e.detail.value as string;
    const date = new Date(dateStr).getTime();
    this.applyDate(date);
  },

  applyDate(timestamp: number) {
    const { task, datePickerType } = this.data;

    if (datePickerType === 'due') {
      task.dueDate = timestamp;
      const dueDate = new Date(timestamp);
      task.dueDateStr = `${dueDate.getMonth() + 1}月${dueDate.getDate()}日`;

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const dueDateStart = new Date(timestamp);
      dueDateStart.setHours(0, 0, 0, 0);
      task.isOverdue = dueDateStart.getTime() < now.getTime() && !task.completed;
    } else if (datePickerType === 'reminder') {
      task.reminder = timestamp;
      task.reminderStr = this.formatDateTime(timestamp);
    }

    this.setData({ task, showDatePicker: false });
    this.saveTask();
  },

  removeDueDate() {
    const { task } = this.data;
    task.dueDate = undefined;
    task.dueDateStr = undefined;
    task.isOverdue = false;
    this.setData({ task });
    this.saveTask();
  },

  // 提醒
  showReminderPicker() {
    this.setData({
      showDatePicker: true,
      datePickerTitle: '提醒我',
      datePickerType: 'reminder',
    });
  },

  removeReminder() {
    const { task } = this.data;
    task.reminder = undefined;
    task.reminderStr = undefined;
    this.setData({ task });
    this.saveTask();
  },

  // 重复
  showRepeatPicker() {
    this.setData({ showRepeatSelector: true });
  },

  hideRepeatPicker() {
    this.setData({ showRepeatSelector: false });
  },

  setRepeat(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    const { task } = this.data;

    const repeatMap: Record<string, string> = {
      daily: '每天',
      weekday: '工作日',
      weekly: '每周',
      monthly: '每月',
      yearly: '每年',
    };

    task.repeat = type;
    task.repeatStr = repeatMap[type];

    this.setData({ task, showRepeatSelector: false });
    this.saveTask();
  },

  removeRepeat() {
    const { task } = this.data;
    task.repeat = undefined;
    task.repeatStr = undefined;
    this.setData({ task });
    this.saveTask();
  },

  // 列表选择
  showListPicker() {
    this.setData({ showListSelector: true });
  },

  hideListPicker() {
    this.setData({ showListSelector: false });
  },

  selectList(e: WechatMiniprogram.TouchEvent) {
    const listId = e.currentTarget.dataset.id;
    const { task, allLists } = this.data;

    task.listId = listId;
    const currentList = allLists.find(l => l.id === listId) || { id: 'inbox', name: '任务', color: '#0078d4' };

    this.setData({ task, currentList, showListSelector: false });
    this.saveTask();
  },

  // 备注
  onNoteInput(e: WechatMiniprogram.Input) {
    const { task } = this.data;
    task.note = e.detail.value;
    this.setData({ task });
  },

  // 阻止冒泡
  preventBubble() {
    // 空函数
  },
});
