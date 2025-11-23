// pages/todo/lists/lists.ts

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
  completedSubtasks?: number;
  createdAt: number;
  completedAt?: number;
  reminder?: number;
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
  count?: number;
  createdAt: number;
}

const SMART_LIST_COLORS: Record<string, string> = {
  myday: '#d83b01',
  important: '#d83b01',
  planned: '#0078d4',
  all: '#0078d4',
};

Page({
  data: {
    // 用户信息
    userName: '我的任务',
    userInitial: 'T',

    // 侧边栏
    showSidebar: false,

    // 列表
    currentListId: 'myday',
    currentListName: '我的一天',
    currentListColor: '#d83b01',
    isSmartList: true,
    customLists: [] as TodoList[],
    smartLists: {
      myday: 0,
      important: 0,
      planned: 0,
      all: 0,
    },

    // 任务
    allTasks: [] as Task[],
    incompleteTasks: [] as Task[],
    completedTasks: [] as Task[],
    showCompleted: false,

    // 新任务
    newTaskTitle: '',
    newTaskMyDay: false,
    newTaskDueDate: null as number | null,
    addInputFocus: false,

    // 新列表弹窗
    showNewList: false,
    newListName: '',
    newListColor: '#0078d4',
    newListInputFocus: false,
    colorOptions: ['#0078d4', '#d83b01', '#107c10', '#8764b8', '#038387', '#767676', '#e3008c', '#986f0b'],

    // 日期选择器
    showDatePickerModal: false,
    pickerDate: '',

    // 日期
    todayDate: '',

    // 空状态
    emptyIcon: '☀',
    emptyText: '今天，专注于重要的事',
  },

  onLoad() {
    this.initDate();
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 初始化日期
  initDate() {
    const now = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const todayDate = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    this.setData({
      todayDate,
      pickerDate: `${year}-${month}-${day}`,
    });
  },

  // 加载数据
  loadData() {
    // 加载自定义列表
    const customLists = wx.getStorageSync('todoLists') || [];

    // 加载所有任务
    const allTasks = wx.getStorageSync('todoTasks') || [];

    // 处理任务的日期显示和过期状态
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const todayStart = now.getTime();

    const processedTasks = allTasks.map((task: Task) => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const dueDateStart = new Date(task.dueDate);
        dueDateStart.setHours(0, 0, 0, 0);

        task.dueDateStr = `${dueDate.getMonth() + 1}月${dueDate.getDate()}日`;
        task.isOverdue = dueDateStart.getTime() < todayStart && !task.completed;
      }
      if (task.subtasks) {
        task.completedSubtasks = task.subtasks.filter(s => s.completed).length;
      }
      return task;
    });

    // 计算智能列表数量
    const smartLists = {
      myday: processedTasks.filter((t: Task) => t.myDay && !t.completed).length,
      important: processedTasks.filter((t: Task) => t.important && !t.completed).length,
      planned: processedTasks.filter((t: Task) => t.dueDate && !t.completed).length,
      all: processedTasks.filter((t: Task) => !t.completed).length,
    };

    // 更新自定义列表的任务数量
    customLists.forEach((list: TodoList) => {
      list.count = processedTasks.filter((t: Task) => t.listId === list.id && !t.completed).length;
    });

    this.setData({
      customLists,
      allTasks: processedTasks,
      smartLists,
    });

    // 刷新当前列表
    this.filterTasks();
  },

  // 过滤任务
  filterTasks() {
    const { currentListId, allTasks } = this.data;
    let filteredTasks: Task[] = [];

    switch (currentListId) {
      case 'myday':
        filteredTasks = allTasks.filter(t => t.myDay);
        break;
      case 'important':
        filteredTasks = allTasks.filter(t => t.important);
        break;
      case 'planned':
        filteredTasks = allTasks.filter(t => t.dueDate);
        break;
      case 'all':
        filteredTasks = allTasks;
        break;
      default:
        filteredTasks = allTasks.filter(t => t.listId === currentListId);
    }

    // 分离完成和未完成
    const incompleteTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    // 设置空状态
    let emptyIcon = '☀';
    let emptyText = '今天，专注于重要的事';

    switch (currentListId) {
      case 'myday':
        emptyIcon = '☀';
        emptyText = '今天，专注于重要的事';
        break;
      case 'important':
        emptyIcon = '★';
        emptyText = '尝试为任务加注星标以使其显示在此处';
        break;
      case 'planned':
        emptyIcon = '📅';
        emptyText = '具有截止日期的任务会显示在此处';
        break;
      default:
        emptyIcon = '✓';
        emptyText = '添加任务以开始';
    }

    this.setData({
      incompleteTasks,
      completedTasks,
      emptyIcon,
      emptyText,
    });
  },

  // 切换侧边栏
  toggleSidebar() {
    this.setData({ showSidebar: !this.data.showSidebar });
  },

  // 切换列表
  switchList(e: WechatMiniprogram.TouchEvent) {
    const listId = e.currentTarget.dataset.id;
    const { customLists } = this.data;

    let listName = '';
    let listColor = '#0078d4';
    let isSmartList = true;

    switch (listId) {
      case 'myday':
        listName = '我的一天';
        listColor = '#d83b01';
        break;
      case 'important':
        listName = '重要';
        listColor = '#d83b01';
        break;
      case 'planned':
        listName = '计划内';
        listColor = '#0078d4';
        break;
      case 'all':
        listName = '全部';
        listColor = '#0078d4';
        break;
      default:
        isSmartList = false;
        const customList = customLists.find(l => l.id === listId);
        if (customList) {
          listName = customList.name;
          listColor = customList.color;
        }
    }

    this.setData({
      currentListId: listId,
      currentListName: listName,
      currentListColor: listColor,
      isSmartList,
      showSidebar: false,
      newTaskMyDay: listId === 'myday',
    });

    this.filterTasks();
  },

  // 新任务输入
  onNewTaskInput(e: WechatMiniprogram.Input) {
    this.setData({ newTaskTitle: e.detail.value });
  },

  // 聚焦添加输入框
  focusAddInput() {
    this.setData({ addInputFocus: true });
  },

  // 切换新任务"我的一天"
  toggleNewTaskMyDay() {
    this.setData({ newTaskMyDay: !this.data.newTaskMyDay });
  },

  // 显示日期选择器
  showDatePicker() {
    this.setData({ showDatePickerModal: true });
  },

  // 隐藏日期选择器
  hideDatePicker() {
    this.setData({ showDatePickerModal: false });
  },

  // 设置截止日期
  setDueDate(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    const now = new Date();
    let dueDate: Date;

    switch (type) {
      case 'today':
        dueDate = now;
        break;
      case 'tomorrow':
        dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'nextweek':
        dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        dueDate = now;
    }

    this.setData({
      newTaskDueDate: dueDate.getTime(),
      showDatePickerModal: false,
    });

    // 如果有输入的任务，直接添加
    if (this.data.newTaskTitle.trim()) {
      this.addTask();
    }
  },

  // 日期选择器变化
  onDateChange(e: WechatMiniprogram.PickerChange) {
    const dateStr = e.detail.value as string;
    const dueDate = new Date(dateStr).getTime();

    this.setData({
      newTaskDueDate: dueDate,
      showDatePickerModal: false,
    });
  },

  // 添加任务
  addTask() {
    const { newTaskTitle, currentListId, newTaskMyDay, newTaskDueDate, allTasks } = this.data;

    if (!newTaskTitle.trim()) {
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      important: currentListId === 'important',
      myDay: newTaskMyDay || currentListId === 'myday',
      listId: ['myday', 'important', 'planned', 'all'].includes(currentListId) ? 'inbox' : currentListId,
      createdAt: Date.now(),
    };

    if (newTaskDueDate) {
      newTask.dueDate = newTaskDueDate;
    }

    const updatedTasks = [newTask, ...allTasks];
    wx.setStorageSync('todoTasks', updatedTasks);

    this.setData({
      newTaskTitle: '',
      newTaskDueDate: null,
      addInputFocus: false,
    });

    this.loadData();
  },

  // 切换任务完成状态
  toggleTaskComplete(e: WechatMiniprogram.TouchEvent) {
    const taskId = e.currentTarget.dataset.id;
    const { allTasks } = this.data;

    const index = allTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      allTasks[index].completed = !allTasks[index].completed;
      allTasks[index].completedAt = allTasks[index].completed ? Date.now() : undefined;

      wx.setStorageSync('todoTasks', allTasks);
      this.loadData();
    }
  },

  // 切换任务重要状态
  toggleTaskImportant(e: WechatMiniprogram.TouchEvent) {
    const taskId = e.currentTarget.dataset.id;
    const { allTasks } = this.data;

    const index = allTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      allTasks[index].important = !allTasks[index].important;

      wx.setStorageSync('todoTasks', allTasks);
      this.loadData();
    }
  },

  // 打开任务详情
  openTaskDetail(e: WechatMiniprogram.TouchEvent) {
    const taskId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/todo/detail/detail?id=${taskId}`,
    });
  },

  // 切换已完成区域显示
  toggleCompletedSection() {
    this.setData({ showCompleted: !this.data.showCompleted });
  },

  // 显示新建列表弹窗
  showNewListModal() {
    this.setData({
      showNewList: true,
      newListInputFocus: true,
      showSidebar: false,
    });
  },

  // 隐藏新建列表弹窗
  hideNewListModal() {
    this.setData({
      showNewList: false,
      newListName: '',
      newListColor: '#0078d4',
    });
  },

  // 新列表名称输入
  onNewListNameInput(e: WechatMiniprogram.Input) {
    this.setData({ newListName: e.detail.value });
  },

  // 选择列表颜色
  selectListColor(e: WechatMiniprogram.TouchEvent) {
    const color = e.currentTarget.dataset.color;
    this.setData({ newListColor: color });
  },

  // 创建新列表
  createNewList() {
    const { newListName, newListColor, customLists } = this.data;

    if (!newListName.trim()) {
      wx.showToast({ title: '请输入列表名称', icon: 'none' });
      return;
    }

    const newList: TodoList = {
      id: Date.now().toString(),
      name: newListName.trim(),
      color: newListColor,
      createdAt: Date.now(),
    };

    const updatedLists = [...customLists, newList];
    wx.setStorageSync('todoLists', updatedLists);

    this.setData({
      showNewList: false,
      newListName: '',
      newListColor: '#0078d4',
    });

    this.loadData();

    // 切换到新列表
    this.setData({
      currentListId: newList.id,
      currentListName: newList.name,
      currentListColor: newList.color,
      isSmartList: false,
    });
    this.filterTasks();
  },

  // 显示列表选项（长按）
  showListOptions(e: WechatMiniprogram.TouchEvent) {
    const list = e.currentTarget.dataset.list as TodoList;

    wx.showActionSheet({
      itemList: ['重命名', '删除列表'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.renameList(list);
        } else if (res.tapIndex === 1) {
          this.deleteList(list);
        }
      },
    });
  },

  // 重命名列表
  renameList(list: TodoList) {
    wx.showModal({
      title: '重命名列表',
      editable: true,
      placeholderText: list.name,
      success: (res) => {
        if (res.confirm && res.content) {
          const { customLists } = this.data;
          const index = customLists.findIndex(l => l.id === list.id);
          if (index !== -1) {
            customLists[index].name = res.content;
            wx.setStorageSync('todoLists', customLists);
            this.loadData();

            if (this.data.currentListId === list.id) {
              this.setData({ currentListName: res.content });
            }
          }
        }
      },
    });
  },

  // 删除列表
  deleteList(list: TodoList) {
    wx.showModal({
      title: '删除列表',
      content: `确定要删除"${list.name}"吗？列表中的任务也会被删除。`,
      success: (res) => {
        if (res.confirm) {
          const { customLists, allTasks } = this.data;

          // 删除列表
          const updatedLists = customLists.filter(l => l.id !== list.id);
          wx.setStorageSync('todoLists', updatedLists);

          // 删除列表中的任务
          const updatedTasks = allTasks.filter(t => t.listId !== list.id);
          wx.setStorageSync('todoTasks', updatedTasks);

          // 如果当前在被删除的列表，切换到"我的一天"
          if (this.data.currentListId === list.id) {
            this.setData({
              currentListId: 'myday',
              currentListName: '我的一天',
              currentListColor: '#d83b01',
              isSmartList: true,
            });
          }

          this.loadData();
        }
      },
    });
  },

  // 切换排序
  toggleSort() {
    wx.showActionSheet({
      itemList: ['按创建时间', '按字母顺序', '按截止日期', '按重要性'],
      success: (res) => {
        const { incompleteTasks } = this.data;
        let sortedTasks: Task[];

        switch (res.tapIndex) {
          case 0:
            sortedTasks = [...incompleteTasks].sort((a, b) => b.createdAt - a.createdAt);
            break;
          case 1:
            sortedTasks = [...incompleteTasks].sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 2:
            sortedTasks = [...incompleteTasks].sort((a, b) => {
              if (!a.dueDate) return 1;
              if (!b.dueDate) return -1;
              return a.dueDate - b.dueDate;
            });
            break;
          case 3:
            sortedTasks = [...incompleteTasks].sort((a, b) => {
              if (a.important === b.important) return 0;
              return a.important ? -1 : 1;
            });
            break;
          default:
            sortedTasks = incompleteTasks;
        }

        this.setData({ incompleteTasks: sortedTasks });
      },
    });
  },

  // 显示列表设置
  showListSettings() {
    const { currentListId, customLists } = this.data;
    const list = customLists.find(l => l.id === currentListId);
    if (list) {
      this.showListOptions({ currentTarget: { dataset: { list } } } as WechatMiniprogram.TouchEvent);
    }
  },

  // 阻止冒泡
  preventBubble() {
    // 空函数
  },
});
