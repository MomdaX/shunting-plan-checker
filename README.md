# Shunting Plan Checker

调车计划检查浏览器插件 — 自动扫描页面 iframe 中的调车计划表格，检测数据异常并高亮标记。

## 功能

- **自动监测**：开启后每 2 秒扫描目标 iframe，检查调车计划表格数据
- **手动检查**：一键检查当前页面的调车计划
- **嵌套 iframe 支持**：递归搜索任意层级 iframe，自动定位含表格的目标
- **标题匹配**：可自定义 iframe 标题匹配关键词，回车立即生效
- **数据校验**：自动检测转场方向、甩挂车数、股道容量等常见错误
- **后台运行**：基于 Service Worker 实现，关闭 popup 后监测继续运行
- **状态持久化**：开关状态、匹配标题、检查日志均持久保存

## 安装

1. 克隆仓库
2. 打开 Chrome，访问 `chrome://extensions`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」，选择项目目录

## 项目结构

```
├── manifest.json       # 扩展配置
├── background.js       # Service Worker（监测核心）
├── content.js          # 页面注入脚本（表格检查引擎）
├── main.js             # Popup 交互逻辑
├── index.html          # Popup 界面
├── style.css           # Popup 样式
├── icon-active.png     # 激活图标
├── icon-inactive.png   # 非激活图标
└── generate-icons.js   # 图标生成脚本
```

## 使用说明

1. 打开包含调车计划表格的页面
2. 点击扩展图标打开 popup
3. 在输入框填写 iframe 匹配标题（默认：调车计划分析系统）
4. 点击「开始检查」手动检查，或开启「自动监测」
5. 查看日志了解检查结果

## 技术栈

- Chrome Extension Manifest V3
- Service Worker + chrome.alarms 保活机制
- chrome.storage.local 状态持久化
- 递归 DOM 遍历支持嵌套 iframe
