# 部署、升级、备份与恢复

## 本机单人运行

按[第一次使用](getting-started.md)安装 Node 24 后启动。Windows 启动文件只监听 127.0.0.1，默认地址 http://localhost:8080，数据默认保存在程序根目录的 data。

## 环境变量

| 变量 | 含义 |
| --- | --- |
| PORT | 监听端口，默认 8080 |
| HOST | 监听地址；Windows 本机启动文件设为 127.0.0.1 |
| APP_ORIGIN | 用户实际访问的协议、主机和端口，不含路径与结尾斜杠 |
| DATA_DIR | 数据目录，默认 ./data；可设置绝对路径 |
| OWNER_CODE | 可选：至少 24 字符的私密负责人码；未设置时自动生成文件 |
| TRUST_LOCAL_PROXY | 仅确有本机反向代理并覆盖真实 IP 头时设为 1 |
| TRUST_PRIVATE_GATEWAY | 仅私有容器网络入口受控时设为 1，Compose 已按此连接 |

直接运行 Node 不会自动读取 .env。Compose 会读取根目录 .env 用于变量替换。手动 Node 运行应在终端设置环境变量。

## 服务器使用 Docker Compose

先准备能由负责人管理的服务器、Docker Compose 和团队访问地址。仓库不包含云账号、付费资源或现有平台配置。域名、证书及当地托管要求按服务商当前说明核实。

1. 把部署 ZIP 上传到自己的服务器并完整解压，进入该目录。
2. 将 .env.example 复制为 .env。
3. 编辑 .env，将 SITE_HOST 改为自己的域名，APP_ORIGIN 改为对应 HTTPS 来源。例如：

   ```text
   SITE_HOST=training.example.com
   APP_ORIGIN=https://training.example.com
   ```

4. 确认域名指向服务器，入站 80/443 可达，没有其他程序占用。
5. 运行 docker compose up -d --build。
6. 用 docker compose ps 和 docker compose logs --tail=50 检查状态，再打开自己的 HTTPS 地址。
7. 在自己的服务器终端运行 docker compose exec app cat /data/owner-code.txt，将显示的码私下保存；不要发到群里或提交仓库。
8. 登录负责人后台，创建成员，发送地址和各自独立成员码。

Compose 让应用只在宿主机回环端口暴露 8080，经 Caddy 提供浏览器入口；数据使用 arena_data 卷。不要将应用容器端口另行直接公开并信任未经控制的代理头。

Caddyfile.ip 作为可选配置保存，需要运营者自行验证当前证书服务支持；本发布未重新验证 IP 证书签发。推荐按已配置域名的常规流程维护访问地址。

## 备份

SQLite 在线备份使用内置 VACUUM INTO，不要只复制正在写入的 .sqlite 文件而遗漏 WAL。

Node 本机：在相同程序目录、使用与服务相同的 DATA_DIR 配置，运行：

```sh
node server/backup.mjs
```

Compose：

```sh
docker compose exec app node server/backup.mjs
```

输出是备份数据库路径。另行保存 owner-code.txt（或自己设置的 OWNER_CODE），将备份文件复制到独立、安全的位置。数据库含成员、会话和训练记录，不能当作公开发布附件。

## 升级

1. 先生成备份，确认能找到负责人码和原数据位置。
2. 停止自己的服务。Compose 用 docker compose down，不加 -v。
3. 在独立位置解压新版，保留原数据目录或原 Compose 卷，记录当前 Compose 项目名。
4. 更新程序文件，使用相同 DATA_DIR；Compose 应继续使用原项目及卷，避免因换目录而创建新的空卷。
5. 启动后检查成员、训练局数与最近季度，再继续使用。

迁移按文件名和 SHA256 校验。不要编辑已应用的 drizzle/*.sql；结构变化应添加新迁移。

## 从备份恢复

1. 先停止服务并保留当前数据目录副本。
2. 在新的空数据目录放入备份，将数据库命名为 arena.sqlite，放入对应 owner-code.txt；如使用环境变量负责人码，仍设置同一个码。
3. 将 DATA_DIR 指向新目录，确认没有旧 arena.sqlite-wal 或 arena.sqlite-shm 混入。
4. 用相同版本或兼容新版启动，确认恢复内容和登录后，再考虑替换正式数据位置。
5. 容器恢复同样先停机，在自己的数据卷或新卷中准备空目录后恢复，避免覆盖运行中数据库。

本次 GitHub 发布只保存程序，未对现有在线部署执行升级或恢复。
