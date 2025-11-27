基于你的需求，我来帮你完善这些接口的详细说明，方便Claude进行前端开发：

## 接口详细说明

### 1. 获取用户信息
```javascript
// GET /getUserInfo
// 返回：用户基本信息
{
  "userId": "123456",
  "username": "阅读者",
  "avatar": "https://wx.xoto.cc/avatar.jpg",
  "vipLevel": 1,
  "bookshelfCount": 15,
  "readingTime": 12560
}
```

### 2. 获取用户书架
```javascript
// GET /getBookshelf
// 参数：userId
// 返回：用户书架中的所有书籍列表
{
  "books": [
    {
      "bookId": "book_001",
      "bookName": "三体",
      "author": "刘慈欣",
      "coverUrl": "https://wx.xoto.cc/covers/santi.jpg",
      "description": "科幻小说经典之作...",
      "currentChapter": 15,
      "latestChapter": 150,
      "remainingChapters": 135,
      "lastReadTime": "2024-01-15 10:30:00",
      "bookUrl": "https://wx.xoto.cc/books/santi.txt",
      "durChapterIndex": 14, // 当前阅读章节索引(0-based)
      "bookGroup": "科幻小说", // 书籍分组
      "progress": 10, // 阅读进度百分比
      "wordCount": 250000
    }
  ]
}
```

### 3. 获取文本目录规则
```javascript
// GET /getTxtTocRules
// 返回：支持的文本解析规则列表
{
  "rules": [
    {
      "id": "rule_001",
      "name": "标准章节规则",
      "rule": "^第[零一二三四五六七八九十百千\\d]+章", // 正则表达式
      "serialNumber": 1,
      "enable": true,
      "description": "匹配'第X章'格式的章节"
    },
    {
      "id": "rule_002", 
      "name": "数字规则",
      "rule": "^\\d+(\\.\\d+)*",
      "serialNumber": 2,
      "enable": true,
      "description": "匹配纯数字章节"
    }
  ]
}
```

### 4. 获取书籍分组
```javascript
// GET /getBookGroups
// 参数：userId
// 返回：用户的书籍分组信息
{
  "groups": [
    {
      "groupId": "group_001",
      "groupName": "科幻小说",
      "bookCount": 5,
      "createTime": "2024-01-01",
      "sortOrder": 1
    },
    {
      "groupId": "group_002",
      "groupName": "历史文学", 
      "bookCount": 3,
      "createTime": "2024-01-02",
      "sortOrder": 2
    },
    {
      "groupId": "default",
      "groupName": "未分组",
      "bookCount": 7,
      "createTime": "2024-01-01",
      "sortOrder": 99
    }
  ]
}
```

### 5. 获取书签列表
```javascript
// GET /getBookmarks  
// 参数：bookId, userId
// 返回：指定书籍的书签列表
{
  "bookmarks": [
    {
      "bookmarkId": "bm_001",
      "bookId": "book_001",
      "chapterIndex": 10,
      "chapterTitle": "第十章 红岸基地",
      "position": 150, // 在章节内的位置(字符索引)
      "createTime": "2024-01-10 15:30:00",
      "note": "重要情节标记"
    }
  ]
}
```

### 6. 获取章节列表
```javascript
// GET /getChapterList
// 参数：bookUrl, ruleId(可选)
// 返回：书籍的章节列表
{
  "chapters": [
    {
      "chapterIndex": 0,
      "chapterTitle": "第一章 科学边界",
      "wordCount": 3250,
      "pageCount": 3
    },
    {
      "chapterIndex": 1,
      "chapterTitle": "第二章 台球", 
      "wordCount": 2850,
      "pageCount": 2
    }
  ],
  "totalChapters": 150,
  "totalWords": 250000
}
```

### 7. 获取章节内容
```javascript
// GET /getBookContent
// 参数：bookUrl, chapterIndex
// 返回：指定章节的文本内容
{
  "chapterIndex": 0,
  "chapterTitle": "第一章 科学边界", 
  "content": "这是第一章的完整文本内容...",
  "previousChapter": null, // 上一章索引，null表示没有
  "nextChapter": 1, // 下一章索引
  "wordCount": 3250
}
```

## 搜索相关接口（需要新增）

### 8. 搜索书籍
```javascript
// GET /searchBooks
// 参数：keyword, page, pageSize
// 返回：搜索结果的书籍列表
{
  "books": [
    {
      "bookId": "search_001",
      "bookName": "三体全集",
      "author": "刘慈欣",
      "coverUrl": "https://wx.xoto.cc/covers/santi.jpg",
      "description": "科幻小说经典...",
      "wordCount": 850000,
      "source": "起点中文网",
      "isInBookshelf": false // 是否已在书架中
    }
  ],
  "total": 15,
  "page": 1,
  "pageSize": 10
}
```

### 9. 添加书籍到书架
```javascript
// POST /addToBookshelf
// 参数：userId, bookId, bookUrl, bookGroup(可选)
// 返回：操作结果
{
  "success": true,
  "message": "添加成功",
  "bookId": "book_001"
}
```

