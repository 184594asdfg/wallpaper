# 壁纸小程序

一个功能丰富的微信小程序壁纸应用，提供多种类型的壁纸下载和预览功能。

## 🎯 功能特性

### 核心功能
- **多类型壁纸**: 手机壁纸、电脑壁纸、聊天背景、朋友圈背景、头像、表情
- **智能搜索**: 支持关键词搜索和分类推荐
- **预览下载**: 全屏预览壁纸，一键下载到相册
- **用户中心**: 下载记录、个人设置、意见反馈

### 用户体验
- **响应式设计**: 适配不同屏幕尺寸
- **图片懒加载**: 提升页面性能
- **自定义导航**: 适配微信胶囊按钮
- **空状态处理**: 优雅的无数据展示

## 📁 项目目录结构

```
wallpaper/
├── app.js                    # 小程序入口文件
├── app.json                  # 小程序配置文件
├── app.wxss                  # 全局样式文件
├── components/               # 自定义组件
│   ├── common-navbar/        # 通用导航栏组件
│   └── wallpaper-preview/    # 壁纸预览组件
├── config/                   # 配置文件
│   ├── api.js               # API接口配置
│   └── request.js           # 网络请求封装
├── images/                   # 图片资源
│   ├── banner/              # 轮播图
│   ├── icons/               # 功能图标
│   └── search/              # 搜索页面图片
├── pages/                    # 页面文件
│   ├── home/                # 首页
│   ├── search/              # 搜索页面
│   ├── computer/            # 电脑壁纸
│   ├── chat/                # 聊天背景
│   ├── moments/             # 朋友圈背景
│   ├── avatar/              # 头像
│   ├── emoji/               # 表情
│   └── mine/                # 我的页面
└── utils/                   # 工具函数
    └── cdn.js               # CDN图片处理
```

详细目录结构请查看 [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

## 🚀 快速开始

### 环境要求
- 微信开发者工具
- 小程序开发权限

### 开发步骤
1. 克隆项目到本地
2. 使用微信开发者工具打开项目
3. 配置小程序AppID
4. 开始开发和调试

### 项目配置
在 `app.json` 中注册所有页面路径：

```json
{
  "pages": [
    "pages/home/index",
    "pages/search/index",
    "pages/computer/index",
    "pages/chat/index",
    "pages/moments/index",
    "pages/avatar/index",
    "pages/emoji/index",
    "pages/mine/index"
  ]
}
```

## 🔧 核心功能实现

### 壁纸预览组件
```javascript
// components/wallpaper-preview/index.js
Component({
  methods: {
    // 下载壁纸
    downloadWallpaper() {
      this.triggerEvent('downloadWallpaper', {
        wallpaper: this.properties.currentPreviewWallpaper
      });
    }
  }
})
```

### 图片CDN管理
```javascript
// utils/cdn.js
const cdn = {
  getImageUrl(folder, filename) {
    return `${CDN_CONFIG.baseUrl}/${CDN_CONFIG.folders[folder]}/${filename}`;
  }
}
```

### 自定义导航栏
```css
/* 适配胶囊按钮位置 */
.custom-nav-bar {
  position: fixed;
  top: {{navBarTop}}px;
  height: {{navBarHeight}}px;
}
```

## 📱 页面功能说明

### 首页 (home/)
- 轮播图展示
- 功能分类入口
- 壁纸网格浏览
- 分类切换导航

### 搜索页面 (search/)
- 搜索框功能
- 分类推荐展示
- 热门搜索标签

### 分类页面
- **电脑壁纸 (computer/)**: 高清电脑壁纸
- **聊天背景 (chat/)**: 微信聊天背景
- **朋友圈背景 (moments/)**: 朋友圈封面
- **头像 (avatar/)**: 个性化头像
- **表情 (emoji/)**: 表情包资源

### 我的页面 (mine/)
- 用户信息展示
- 下载记录统计
- 功能设置入口
- 意见反馈通道

## 🎨 设计特色

### 视觉设计
- 现代化界面风格
- 统一的配色方案
- 清晰的视觉层次

### 交互体验
- 流畅的页面切换
- 直观的操作反馈
- 贴心的空状态提示

### 性能优化
- 图片懒加载技术
- 组件化开发模式
- 代码分割和复用

## 🔄 开发规范

### 代码规范
- 使用ES6+语法特性
- 统一的命名规范
- 组件化开发模式

### 文件组织
- 按功能模块划分目录
- 页面和组件分离
- 资源文件分类管理

### 提交规范
- 清晰的提交信息
- 功能模块化提交
- 及时解决冲突

## 📈 项目进展

### 已完成功能
- ✅ 基础页面框架搭建
- ✅ 图片资源集成
- ✅ 壁纸预览功能
- ✅ 下载功能实现
- ✅ 搜索页面优化
- ✅ 用户中心页面

### 待开发功能
- 🔄 用户登录系统
- 🔄 云端数据同步
- 🔄 个性化推荐
- 🔄 社交分享功能

## 🤝 贡献指南

欢迎提交Issue和Pull Request来帮助改进项目！

### 开发流程
1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 发起 Pull Request

### 代码审查
- 确保代码符合规范
- 添加适当的注释
- 测试功能完整性

## 📄 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 📞 联系方式

如有问题或建议，欢迎联系开发团队。

---

**壁纸小程序** - 让每一刻都充满美感！