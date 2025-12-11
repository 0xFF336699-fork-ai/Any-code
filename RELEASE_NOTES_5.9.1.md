# Release Notes - v5.9.1

## 🎉 重大功能更新

### 🔧 MCP (Model Context Protocol) 管理系统全面重构

本版本对 MCP 管理模块进行了完全重构，实现了真正的多引擎独立隔离控制架构。

---

## ✨ 新功能

### 1. 多引擎独立隔离架构

#### 核心特性
- **3 个独立的引擎管理面板**：Claude、Codex、Gemini 各自独立
- **完全隔离的配置存储**：
  - Claude: `~/.claude.json`
  - Codex: `~/.codex/config.toml`
  - Gemini: `~/.gemini/settings.json`
- **独立的工具列表视图**：每个引擎显示自己的 MCP 工具，互不干扰

#### 业务价值
- 用户可以在 Claude 中启用某个工具，同时在 Codex 中禁用
- 每个引擎的工具配置完全独立，互不影响
- 清晰的视图，一目了然

---

### 2. 细粒度的启用/禁用开关控制

#### 功能说明
- **独立的 Switch 开关**：每个 MCP 工具都有自己的启用/禁用开关
- **实时状态显示**：
  - ✅ 已启用（绿色徽章）
  - ⭕ 已禁用（灰色徽章）
- **即时持久化**：开关状态变更立即写入配置文件

#### 技术实现
- enabled=true: 工具存在于引擎配置文件中
- enabled=false: 工具从引擎配置文件中移除
- 不同引擎下同名工具的状态完全独立

---

### 3. 完整的 CRUD 操作

#### 添加工具
- 动态表单支持 stdio、http、sse 三种传输类型
- 根据类型显示对应配置项：
  - **stdio**: command, args, env, cwd
  - **http/sse**: url, headers
- 表单验证和错误提示

#### 编辑工具
- 点击"编辑"按钮打开配置对话框
- 预填充现有配置
- 支持修改所有参数：命令、参数、环境变量、URL 等
- 保存后立即生效

#### 删除工具
- 永久删除功能（带确认提示）
- 从引擎配置文件中移除
- 支持单独删除某个引擎中的工具

---

### 4. 品牌化 UI 设计

#### 引擎专属图标
- **Claude**: 🟠 橙色 Claude 官方图标
- **Codex**: 🟢 绿色 Codex 官方图标
- **Gemini**: 🔵 蓝色渐变 Gemini 官方图标

#### 统一的设计语言
- Tab 标签显示引擎图标
- 面板头部使用品牌色背景
- 空状态提示使用大号引擎图标
- 实时统计显示：`X / Y 个工具已启用`

---

## 🐛 Bug 修复

### MCP 配置
- **修正 Claude MCP 配置文件路径**：从错误的 `~/.claude/settings.json` 更正为 `~/.claude.json`
- **完整实现 Codex TOML 配置读写**：参考 cc-switch 项目标准
- **修复 MCP 导入逻辑**：简化流程，添加详细调试日志

### UI 组件
- **修复 Switch 组件 React 警告**：消除控制台警告信息

### 会话管理
- **修复会话删除后项目列表统计不同步**：确保数据一致性

### Codex 配置
- **修复自定义配置无法编辑删除**：恢复完整的编辑功能

---

## 🔄 API 更新

### 新增按引擎隔离的 API

#### 后端 Rust API
```rust
mcp_get_engine_servers(engine)           // 获取指定引擎的工具列表
mcp_upsert_engine_server(engine, id, spec) // 添加/更新工具
mcp_delete_engine_server(engine, id)     // 删除工具
mcp_toggle_engine_server(engine, id, spec, enabled) // 切换启用状态
```

#### 前端 TypeScript API
```typescript
api.mcpGetEngineServers(engine)
api.mcpUpsertEngineServer(engine, id, spec)
api.mcpDeleteEngineServer(engine, id)
api.mcpToggleEngineServer(engine, id, spec, enabled)
```

### 废弃的 API
- `mcpGetUnifiedServers()` - 使用 `mcpGetEngineServers()` 代替

---

## 📁 新增组件

### MCPEnginePanel
- 单个引擎的 MCP 管理面板
- 支持启用/禁用、添加、编辑、删除操作
- 独立的状态管理和数据加载

### MCPServerDialog
- 统一的添加/编辑对话框
- 动态表单根据传输类型调整
- 支持参数、环境变量、请求头等复杂配置

### MCPManager（重构）
- 3 个 Tab 对应 3 个引擎
- 使用品牌图标和色彩
- 清晰的引擎隔离视图

---

## 🏗️ 架构改进

### 配置隔离保证
```
用户界面
├─ Claude Tab → MCPEnginePanel → ~/.claude.json
├─ Codex Tab  → MCPEnginePanel → ~/.codex/config.toml
└─ Gemini Tab → MCPEnginePanel → ~/.gemini/settings.json
```

### 状态管理
- 每个引擎独立管理自己的工具列表
- 操作后自动刷新，保持前后端一致
- 完全的引擎隔离，互不干扰

---

## 📊 使用场景示例

### 场景 1：独立控制
```
Claude 引擎：
  ✓ filesystem-mcp  [✓ 已启用]
  ✓ database-mcp    [○ 已禁用]

Codex 引擎：
  ✓ filesystem-mcp  [○ 已禁用]  ← 与 Claude 状态独立！
  ✓ database-mcp    [✓ 已启用]
```

### 场景 2：添加工具
在 Gemini 中添加 `translation-mcp`：
- 只写入 `~/.gemini/settings.json`
- Claude 和 Codex 不受影响

### 场景 3：编辑配置
在 Claude 中修改 `database-mcp` 的环境变量：
- 只更新 `~/.claude.json`
- Codex 的同名工具配置保持独立

---

## 📝 详细提交记录

1. **c5bda23** - feat(mcp): 使用真实的引擎图标替代通用图标
2. **50c9f38** - feat(mcp): 实现细粒度开关控制和完整CRUD功能
3. **01bfc52** - feat(mcp): 重构为多引擎独立隔离控制架构
4. **43a303d** - fix(mcp): 修正Claude MCP配置文件路径
5. **6b6ec5c** - fix(mcp): 完整实现 Codex TOML 配置读写，完全参考 cc-switch
6. **8888c76** - fix(ui): 修复 Switch 组件 React 警告
7. **0bfab83** - fix(mcp): 简化导入逻辑并添加详细调试日志
8. **3eb60ff** - feat(mcp): 实现真正的多应用统一视图和独立控制
9. **34c8e29** - docs(mcp): 添加废弃命令说明文档
10. **5f6a53c** - feat(mcp-frontend): 完成前端组件迁移到新版多应用 MCP API
11. **8958650** - feat(mcp): 完全重构 MCP 功能，支持 Claude/Codex/Gemini 多应用管理
12. **f20390a** - fix(session): 修复会话删除后项目列表统计不同步问题
13. **69e31dc** - fix(codex): 修复自定义配置无法编辑删除的问题

---

## 🚀 升级指南

从 5.8.8 升级到 5.9.1 后：

1. 重新打开 MCP 管理面板
2. 现在会看到 3 个独立的引擎 Tab
3. 每个工具都有独立的启用/禁用开关
4. 可以点击"添加工具"按钮添加新工具
5. 可以点击"编辑"按钮修改工具配置

**无需迁移数据**：系统会自动读取现有的配置文件。

---

## 💡 已知问题

无

---

## 🙏 致谢

感谢所有用户的反馈和建议！

---

**发布日期**: 2024-12-11
**版本**: 5.9.1
