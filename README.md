# MyStanford - AI专家讨论平台

基于Vue 3的现代化AI专家讨论平台，让传奇历史人物为您出谋划策。

## ✨ 功能特点

- 🎭 **12位传奇专家**：包含乔布斯、马斯克、图灵、爱因斯坦等历史名人AI复刻
- 🎰 **智能老虎机**：随机选择专家组合，发现思维火花
- 💬 **实时讨论**：专家AI深度分析您的话题，提供独特视角  
- 🎮 **游戏化互动**：对专家观点进行投票和反馈
- 💡 **洞察生成**：AI自动提炼讨论精华，生成可执行建议
- 📄 **一键导出**：支持Markdown和PDF格式报告导出
- 🔗 **Web3集成**：支持MetaMask等钱包连接
- 📱 **响应式设计**：完美适配桌面和移动设备

## 🚀 快速开始

### 安装依赖
```bash
pnpm install
```

### 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始使用。

### 构建生产版本
```bash
pnpm build
```

### 预览生产构建
```bash
pnpm preview
```

## 🛠 技术栈

- **框架**: Vue 3 + Vite
- **路由**: Vue Router 4
- **状态管理**: Vuex 4
- **包管理**: pnpm
- **PDF生成**: jsPDF + html2canvas
- **Web3**: MetaMask集成
- **样式**: CSS Variables + 响应式设计

## 📁 项目结构

```
src/
├── components/          # 组件目录
│   ├── layout/         # 布局组件
│   ├── workflow/       # 工作流组件
│   ├── wallet/         # 钱包组件
│   └── api/           # API配置组件
├── views/              # 页面组件
├── router/             # 路由配置
├── store/              # Vuex状态管理
├── data/              # 数据配置
└── styles/            # 全局样式
```

## ⚙️ 配置说明

### 智能模式切换
应用支持两种运行模式：
- **真实API模式**：连接后端服务，使用真实AI API
- **演示模式**：模拟后端响应，无需后端服务即可体验完整功能

**自动切换机制**：
- 应用启动时会自动尝试连接后端API
- 如果后端不可用，会自动切换到演示模式
- 可在API配置面板中手动切换模式

### 后端API配置
1. 确保后端服务运行在 `http://localhost:8080`
2. 如需修改后端地址，请编辑 `src/config/api.js` 中的 `BASE_URL`
3. 或设置环境变量 `VITE_API_BASE_URL`

### 前端API配置
1. 点击右上角的⚙️按钮打开配置面板
2. 查看当前连接状态（真实API或演示模式）
3. 可手动切换运行模式
4. 系统会自动从后端获取可用AI模型列表

### 钱包连接
- 支持MetaMask、Trust Wallet、Coinbase Wallet等
- 自动检测已安装的钱包
- 支持多网络切换

## 💡 使用指南

1. **选择专家**：从12位传奇专家中选择3-5位组成智囊团
2. **输入主题**：描述您想讨论的问题或挑战
3. **开始思考**：AI专家开始深度分析和讨论
4. **互动反馈**：对专家观点进行投票和评价
5. **获取洞察**：AI自动生成讨论结果和建议
6. **导出报告**：一键导出专业分析报告

## 🎯 专家阵容

### 科技类
- 🍎 **乔布斯** - 创新教父，产品哲学大师
- 🚀 **马斯克** - 未来预言家，颠覆式创新者
- 🤖 **图灵** - 计算机之父，AI理论先驱
- 🧮 **冯诺依曼** - 数学天才，系统架构师
- 📡 **香农** - 信息论之父
- 🔬 **费曼** - 物理奇才，科学教育大师

### 商业类
- 💰 **巴菲特** - 投资智者，价值投资鼻祖
- 📦 **贝佐斯** - 客户至上主义者
- 🏢 **稻盛和夫** - 经营哲学大师
- 📚 **德鲁克** - 现代管理学之父
- ⚡ **爱因斯坦** - 相对论大师，直觉思维
- 🎭 **达芬奇** - 全才大师，跨领域思维

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目！

---

**Think Different, Create Different** 🌟
