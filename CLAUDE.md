# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WeChat Mini Program with multi-platform support, written in TypeScript. The project is configured to build as both a WeChat MiniProgram and a native mobile app (iOS and Android) using WeChat's multi-platform architecture.

**App Name:** XCTools · 安神工具集 (XOTO)

## Architecture

### Multi-Platform Structure

The project uses WeChat's `projectArchitecture: "multiPlatform"` configuration, meaning the same codebase deploys to:
- **WeChat MiniProgram**: Standard WeChat mini program environment
- **iOS Native App**: Uses WeChat mini-app SDK (v1.5.10)
- **Android Native App**: Uses WeChat mini-app SDK (v1.5.8)

### Directory Structure

```
miniprogram/          # Main WeChat miniprogram source code
  app.ts              # App entry point with lifecycle hooks
  app.json            # App configuration (pages, tabBar, window)
  app.miniapp.json    # Native app identity/login configuration
  pages/              # Page components
    index/            # Home page
    apps/             # Apps showcase page
    contact/          # Contact page
    logs/             # Logs page
  utils/              # Utility functions
miniapp/              # Native platform resources
  android/            # Android-specific native resources
i18n/                 # Internationalization files (base.json)
typings/              # TypeScript type definitions
```

### Component Framework

- Uses `"componentFramework": "glass-easel"` (WeChat's enhanced component system)
- Pages are built using the Component constructor pattern
- Lazy code loading enabled: `"lazyCodeLoading": "requiredComponents"`

### TypeScript Configuration

Strict TypeScript mode is enabled with:
- `strictNullChecks`, `noImplicitAny`, `noImplicitThis`
- `noUnusedLocals`, `noUnusedParameters`
- Target: ES2020, Module: CommonJS
- Type definitions in `./typings` directory

## Development

### No Build System

This project has no build scripts or package manager commands configured. The WeChat Developer Tools IDE handles compilation directly:
- TypeScript compilation via `"useCompilerPlugins": ["typescript"]`
- Open project in WeChat Developer Tools to develop and preview

### TypeScript Compilation

TypeScript files are compiled automatically by WeChat Developer Tools. The `tsconfig.json` is configured for strict type checking.

### Page Structure

Each page follows the standard WeChat mini program structure:
- `.ts` - Page logic (using Component or Page constructor)
- `.wxml` - Template markup
- `.wxss` - Styles
- `.json` - Page configuration

### App Configuration

**app.json** defines:
- Page routes (index, apps, logs, contact)
- Tab bar with 3 tabs: 首页 (Home), Apps, 联系我们 (Contact)
- Window styling (white background, black nav text)

**app.miniapp.json** configures native app behavior:
- `adapteByMiniprogram.userName`: Links to WeChat account `gh_7b5671a420ee`
- `identityServiceConfig`: Handles WeChat login adaptation for native apps

## Platform-Specific Configuration

### iOS Configuration (project.miniapp.json)
- SDK Version: 1.5.10
- VConsole: enabled (open)
- Extended SDK features configurable (WeAppOpenFuns enabled by default)
- Privacy settings, icons, and splash screen customizable

### Android Configuration (project.miniapp.json)
- SDK Version: 1.5.8
- VConsole: enabled (open)
- Extended SDK features configurable (all disabled by default)
- Privacy enable: true
- Native resources in `miniapp/android/nativeResources/`

## Code Patterns

### Page Definition
Pages use the Component constructor pattern:
```typescript
Component({
  data: { /* reactive data */ },
  methods: { /* event handlers */ }
})
```

### App Instance
Access global app instance:
```typescript
const app = getApp<IAppOption>()
```

### Navigation
Use WeChat APIs:
```typescript
wx.navigateTo({ url: '../page/page' })
```

### Storage
```typescript
wx.setStorageSync('key', value)
wx.getStorageSync('key')
```

## Type Definitions

Custom types defined in `typings/index.d.ts`:
- `IAppOption`: App instance interface with globalData shape
- WeChat API types from `miniprogram-api-typings` package

## Internationalization

The `i18n/base.json` file contains localized app names for iOS, Android, and common platforms. Currently set to "XOTO" across all platforms.

## Notes

- This is a git repository (not yet tracked in remote)
- Editor settings: 2 spaces for indentation
- App ID: `wx41c0a671751b1649`
- Skyline rendering enabled for performance
- No npm dependencies besides TypeScript definitions


---
中文版项目说明

# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

这是一个支持多平台的微信小程序，使用 TypeScript 编写。项目配置为使用微信的多平台架构，可同时构建为微信小程序和原生移动应用（iOS 和 Android）。

**应用名称：** XCTools · 安神工具集 (XOTO)

## 架构说明

### 多平台结构

项目使用微信的 `projectArchitecture: "multiPlatform"` 配置，意味着同一套代码可部署到：
- **微信小程序**：标准的微信小程序环境
- **iOS 原生应用**：使用微信小程序 SDK (v1.5.10)
- **Android 原生应用**：使用微信小程序 SDK (v1.5.8)

### 目录结构

```
miniprogram/          # 微信小程序主源代码
  app.ts              # 应用入口点，包含生命周期钩子
  app.json            # 应用配置（页面，tabBar，窗口样式）
  app.miniapp.json    # 原生应用身份/登录配置
  pages/              # 页面组件
    index/            # 首页
    apps/             # 应用展示页面
    contact/          # 联系页面
    logs/             # 日志页面
  utils/              # 工具函数
miniapp/              # 原生平台资源
  android/            # Android 特定原生资源
i18n/                 # 国际化文件 (base.json)
typings/              # TypeScript 类型定义
```

### 组件框架

- 使用 `"componentFramework": "glass-easel"`（微信增强型组件系统）
- 页面使用 Component 构造函数模式构建
- 启用懒代码加载：`"lazyCodeLoading": "requiredComponents"`

### TypeScript 配置

启用严格 TypeScript 模式：
- `strictNullChecks`, `noImplicitAny`, `noImplicitThis`
- `noUnusedLocals`, `noUnusedParameters`
- 目标：ES2020，模块：CommonJS
- 类型定义位于 `./typings` 目录

## 开发说明

### 无构建系统

此项目没有配置构建脚本或包管理器命令。微信开发者工具 IDE 直接处理编译：
- TypeScript 编译通过 `"useCompilerPlugins": ["typescript"]` 实现
- 在微信开发者工具中打开项目进行开发和预览

### TypeScript 编译

TypeScript 文件由微信开发者工具自动编译。`tsconfig.json` 配置为严格类型检查。

### 页面结构

每个页面遵循标准微信小程序结构：
- `.ts` - 页面逻辑（使用 Component 或 Page 构造函数）
- `.wxml` - 模板标记
- `.wxss` - 样式
- `.json` - 页面配置

### 应用配置

**app.json** 定义：
- 页面路由（index, apps, logs, contact）
- 包含 3 个标签页的标签栏：首页 (Home), Apps, 联系我们 (Contact)
- 窗口样式（白色背景，黑色导航文字）

**app.miniapp.json** 配置原生应用行为：
- `adapteByMiniprogram.userName`：链接到微信公众号 `gh_7b5671a420ee`
- `identityServiceConfig`：处理原生应用的微信登录适配

## 平台特定配置

### iOS 配置 (project.miniapp.json)
- SDK 版本：1.5.10
- VConsole：启用（打开）
- 可配置扩展 SDK 功能（默认启用 WeAppOpenFuns）
- 可自定义隐私设置、图标和启动页

### Android 配置 (project.miniapp.json)
- SDK 版本：1.5.8
- VConsole：启用（打开）
- 可配置扩展 SDK 功能（默认全部禁用）
- 隐私启用：true
- 原生资源位于 `miniapp/android/nativeResources/`

## 代码模式

### 页面定义
页面使用 Component 构造函数模式：
```typescript
Component({
  data: { /* 响应式数据 */ },
  methods: { /* 事件处理程序 */ }
})
```

### 应用实例
访问全局应用实例：
```typescript
const app = getApp<IAppOption>()
```

### 导航
使用微信 API：
```typescript
wx.navigateTo({ url: '../page/page' })
```

### 存储
```typescript
wx.setStorageSync('key', value)
wx.getStorageSync('key')
```

## 类型定义

`typings/index.d.ts` 中定义的自定义类型：
- `IAppOption`：应用实例接口，定义 globalData 结构
- 来自 `miniprogram-api-typings` 包的微信 API 类型

## 国际化

`i18n/base.json` 文件包含针对 iOS、Android 和通用平台的本地化应用名称。目前在所有平台上均设置为 "XOTO"。

## 注意事项

- 这是一个 git 仓库（尚未在远程跟踪）
- 编辑器设置：2 空格缩进
- 启用 Skyline 渲染以提高性能
- 除了 TypeScript 定义外，没有 npm 依赖