// utils/mockApi.ts
// Mock API 服务，模拟后端接口

export interface RemoteBook {
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

export interface SearchBooksResponse {
  books: RemoteBook[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GetBookDetailResponse {
  book: RemoteBook;
}

// Mock 书籍数据
const mockBooks: RemoteBook[] = [
  {
    id: 'book-001',
    title: '三体',
    author: '刘慈欣',
    cover: '',
    description: '地球文明向宇宙发出第一声啼鸣，取得了文明等级的证书，但同时也暴露了地球的坐标...',
    category: '科幻',
    totalChapters: 47,
    fileSize: 512 * 1024,
    publishTime: '2008-01-01',
    rating: 9.3,
  },
  {
    id: 'book-002',
    title: '活着',
    author: '余华',
    cover: '',
    description: '讲述了一个人和他命运之间的友谊，这是最为感人的友谊...',
    category: '当代文学',
    totalChapters: 12,
    fileSize: 180 * 1024,
    publishTime: '1993-06-01',
    rating: 9.1,
  },
  {
    id: 'book-003',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    cover: '',
    description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事...',
    category: '外国文学',
    totalChapters: 20,
    fileSize: 360 * 1024,
    publishTime: '1967-05-30',
    rating: 9.2,
  },
  {
    id: 'book-004',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    cover: '',
    description: '从石器时代到21世纪，人类如何成为地球的主宰者...',
    category: '历史',
    totalChapters: 25,
    fileSize: 420 * 1024,
    publishTime: '2011-01-01',
    rating: 9.0,
  },
  {
    id: 'book-005',
    title: '白夜行',
    author: '东野圭吾',
    cover: '',
    description: '一对少年少女，在命运的捉弄下走上了截然不同的道路...',
    category: '推理',
    totalChapters: 32,
    fileSize: 480 * 1024,
    publishTime: '1999-08-01',
    rating: 9.1,
  },
  {
    id: 'book-006',
    title: '小王子',
    author: '安东尼·德·圣-埃克苏佩里',
    cover: '',
    description: '一个永恒的童话，给成年人看的童话，在温馨的故事中领悟爱与责任...',
    category: '童话',
    totalChapters: 27,
    fileSize: 120 * 1024,
    publishTime: '1943-04-06',
    rating: 9.0,
  },
  {
    id: 'book-007',
    title: '平凡的世界',
    author: '路遥',
    cover: '',
    description: '全景式地描写了中国现代城乡生活，深刻地展示了普通人在时代历程中所走过的艰难曲折的道路...',
    category: '当代文学',
    totalChapters: 56,
    fileSize: 680 * 1024,
    publishTime: '1986-12-01',
    rating: 9.0,
  },
  {
    id: 'book-008',
    title: '红楼梦',
    author: '曹雪芹',
    cover: '',
    description: '中国古典四大名著之首，一部具有高度思想性和艺术性的伟大作品...',
    category: '古典文学',
    totalChapters: 120,
    fileSize: 980 * 1024,
    publishTime: '1791-01-01',
    rating: 9.6,
  },
  {
    id: 'book-009',
    title: '月亮与六便士',
    author: '威廉·萨默塞特·毛姆',
    cover: '',
    description: '一个理想主义者如何挣脱世俗枷锁，追寻内心梦想的故事...',
    category: '外国文学',
    totalChapters: 58,
    fileSize: 340 * 1024,
    publishTime: '1919-04-15',
    rating: 9.0,
  },
  {
    id: 'book-010',
    title: '嫌疑人X的献身',
    author: '东野圭吾',
    cover: '',
    description: '一个天才数学家与警察的智力对决，一场关于爱与牺牲的感人故事...',
    category: '推理',
    totalChapters: 28,
    fileSize: 280 * 1024,
    publishTime: '2005-08-01',
    rating: 9.0,
  },
  {
    id: 'book-011',
    title: '1984',
    author: '乔治·奥威尔',
    cover: '',
    description: '反乌托邦小说的代表作，描绘了一个极权主义下的恐怖社会...',
    category: '外国文学',
    totalChapters: 36,
    fileSize: 380 * 1024,
    publishTime: '1949-06-08',
    rating: 9.3,
  },
  {
    id: 'book-012',
    title: '围城',
    author: '钱钟书',
    cover: '',
    description: '婚姻就像围城，城外的人想进去，城里的人想出来...',
    category: '当代文学',
    totalChapters: 9,
    fileSize: 240 * 1024,
    publishTime: '1947-01-01',
    rating: 8.9,
  },
];

// 搜索书籍
export function searchBooks(
  keyword: string,
  page: number = 1,
  pageSize: number = 10
): Promise<SearchBooksResponse> {
  return new Promise((resolve) => {
    // 模拟网络延迟
    setTimeout(() => {
      // 过滤书籍
      const filteredBooks = mockBooks.filter(
        (book) =>
          book.title.toLowerCase().includes(keyword.toLowerCase()) ||
          book.author.toLowerCase().includes(keyword.toLowerCase()) ||
          book.category.toLowerCase().includes(keyword.toLowerCase())
      );

      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const books = filteredBooks.slice(start, end);

      resolve({
        books,
        total: filteredBooks.length,
        page,
        pageSize,
      });
    }, 500); // 模拟500ms延迟
  });
}

// 获取书籍详情
export function getBookDetail(bookId: string): Promise<RemoteBook> {
  return new Promise((resolve, reject) => {
    // 模拟网络延迟
    setTimeout(() => {
      const book = mockBooks.find((b) => b.id === bookId);

      if (book) {
        resolve(book);
      } else {
        reject(new Error('书籍不存在'));
      }
    }, 300); // 模拟300ms延迟
  });
}

// 下载书籍到本地（模拟）
export function downloadBook(bookId: string): Promise<{ filePath: string }> {
  return new Promise((resolve) => {
    // 模拟下载延迟
    setTimeout(() => {
      const filePath = `${wx.env.USER_DATA_PATH}/${bookId}.txt`;
      resolve({ filePath });
    }, 1000); // 模拟1秒下载时间
  });
}
