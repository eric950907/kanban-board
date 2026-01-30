# Kanban Board

一个 Linear 风格的看板任务管理应用，使用纯 HTML/CSS/JavaScript 构建。

![Screenshot](https://img.shields.io/badge/style-Linear--inspired-5e9eff?style=flat-square)

## ✨ 功能特性

- **看板视图** - 四列状态：Backlog → Todo → In Progress → Done
- **拖拽排序** - 拖动任务卡片在列之间移动
- **任务管理** - 创建、编辑、删除任务
- **子任务** - 任务内添加子任务，跟踪完成进度
- **项目分类** - 按项目筛选任务
- **标签系统** - 多彩标签分类
- **优先级** - 紧急/高/中/低优先级显示
- **搜索** - 实时搜索任务
- **撤销删除** - 删除后 5 秒内可撤销
- **本地存储** - 数据保存在 localStorage

## 🚀 快速开始

### 方式一：直接打开

```bash
# 使用任意静态服务器
npx serve .

# 或者
python3 -m http.server 3000
```

然后打开 http://localhost:3000

### 方式二：开发模式

```bash
npm install
npm run dev
```

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `N` | 新建任务 |
| `/` | 聚焦搜索框 |
| `Esc` | 关闭弹窗 / 清空搜索 |

## 📁 项目结构

```
kanban-board/
├── index.html          # 入口 HTML
├── package.json        # 项目配置
├── data/
│   └── data.json       # 示例数据（首次加载）
└── src/
    ├── main.js         # 应用逻辑
    └── styles/
        └── main.css    # 样式系统
```

## 🎨 设计系统

基于 Linear 的设计语言：

- **主题** - 深色模式
- **字体** - Inter
- **配色** - 柔和的霓虹色调
- **动画** - 细腻的过渡效果

## 📦 数据结构

```javascript
{
  "projects": [
    { "id": "proj-1", "name": "项目名", "color": "blue" }
  ],
  "labels": [
    { "id": "label-1", "name": "Bug", "color": "red" }
  ],
  "tasks": [
    {
      "id": "task-1",
      "projectId": "proj-1",
      "title": "任务标题",
      "description": "任务描述",
      "status": "todo",        // backlog | todo | progress | done
      "priority": "medium",    // urgent | high | medium | low | none
      "labels": ["label-1"],
      "subtasks": [
        { "id": "sub-1", "title": "子任务", "completed": false }
      ]
    }
  ]
}
```

## 🔧 自定义

### 添加新状态列

编辑 `src/main.js` 中的 `STATUSES` 数组：

```javascript
const STATUSES = [
  { id: 'backlog', name: 'Backlog', color: 'backlog' },
  { id: 'todo', name: 'Todo', color: 'todo' },
  // 添加新状态...
];
```

### 添加新标签颜色

在 `src/styles/main.css` 中添加：

```css
.task-label.newcolor { 
  background: rgba(r, g, b, 0.15); 
  color: var(--accent-newcolor); 
}
```

## 📄 License

MIT
