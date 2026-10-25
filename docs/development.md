# 开发、验证和打包

## 环境与目录

Node.js 24（验证版本 24.19.0），npm。无需另装 SQLite；服务使用 Node 内置 node:sqlite。生产运行使用预构建网页，不依赖 node_modules。

| 目录 | 内容 |
| --- | --- |
| frontend/ | React 页面及 CSS，Vite 构建入口 |
| lib/ | 经营模型、策略识别、案例、决策教学及排名 |
| server/ | API、SQLite 适配、迁移、备份 |
| public/ | 已构建静态网页，供服务与部署包使用 |
| drizzle/ | SQL 迁移；已应用文件不得修改字节 |
| tests/ | 模型与 API 回归检查 |
| scripts/ | 发布打包 |
| data/ | 首次启动生成的私密数据，不纳入 Git |
| build/ | 发布包和校验信息，不纳入 Git |

## 获取源码并运行

在 GitHub 仓库点击 Code → HTTPS，复制自己的仓库地址：

```sh
git clone 复制的仓库地址
cd poju-business-arena
npm ci
npm test
npm run build
npm start
```

如果解压的是部署包，可直接运行 node server.mjs；部署包不含前端源码，不能用来修改并重新构建页面。

## 修改并验证

1. 修改 frontend、lib 或 server 中相应文件。
2. 执行 npm test，检查模型时间差、排名、逐项回测、权限、结算一致性和团队记录。
3. 执行 npm run build，确认前端重新构建完成。
4. 启动服务，在浏览器检查受影响页面。只有构建不会验证交互布局。
5. 用负责人和成员分别登录，确认两种权限下行为符合预期。
6. 提交源文件与新的 public 构建产物。不要提交运行后生成的 data。

本项目已有 TypeScript 扩展名页面使用 @ts-nocheck，Vite 负责转译；构建通过不等于完成严格 TypeScript 类型检查。

## 自定义本地端口

PowerShell，在仓库根目录运行：

```powershell
$env:PORT='8081'
$env:HOST='127.0.0.1'
$env:APP_ORIGIN='http://localhost:8081'
node server.mjs
```

打开 http://localhost:8081。APP_ORIGIN 不含结尾斜杠，浏览器地址必须完全匹配。

## 生成部署包

```sh
npm run build
npm test
npm run package
```

build/Poju-Deploy-v版本号.zip 使用明确文件清单，只加入服务、模型、迁移、静态网页、配置示例与说明。SHA256SUMS.txt 可核对下载内容，package-info.json 保存本地打包元数据。不包含数据库或账号。

Windows 可运行 Get-FileHash .\build\Poju-Deploy-v2.1.1.zip -Algorithm SHA256，与校验文件比较。

## 持续集成

GitHub Actions 在 Node 24.19.0 下执行 npm ci、npm test、npm run build 和发布打包检查。它不连接现有线上服务器，不会自动部署。私有仓库的 Actions 可用额度和设置以账号实际配置为准。
