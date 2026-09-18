# CI/CD 说明

## 流程

```
push / PR  →  CI（前端 lint + i18n 校验 + 构建，后端编译）
push main  →  构建两个镜像 → 推 GHCR → SSH 到 EC2 → pull → up -d → 健康检查
```

镜像全部在 GitHub 的机器上构建，EC2（t2.micro）只负责拉取和启动。

| 文件 | 作用 |
| :--- | :--- |
| `.github/workflows/ci.yml` | 每次 push / PR 跑检查 |
| `.github/workflows/deploy.yml` | 构建镜像、推 GHCR、触发部署 |
| `scripts/deploy-remote.sh` | 在 EC2 上执行的部署脚本（通过 SSH 传入） |
| `docker-compose.prod.yml` | EC2 上使用的 compose，镜像来自 GHCR，不在本机构建 |
| `Frontend/scripts/check-i18n.mjs` | 中英文词典一致性校验 |

镜像地址：
- `ghcr.io/wany353/aws-practice-test-backend:<commit-sha>`
- `ghcr.io/wany353/aws-practice-test-frontend:<commit-sha>`

每次部署同时打 `latest` 和 commit SHA 两个标签，SHA 标签用于回滚。

## 一次性配置

### 1. GitHub Secrets

仓库 → Settings → Secrets and variables → Actions：

| 名称 | 值 |
| :--- | :--- |
| `EC2_HOST` | EC2 公网 IP 或域名 |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | 部署私钥全文（含 BEGIN/END 行） |

生成专用密钥（不要复用日常登录的 key，便于随时吊销）：

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/cq_deploy -N ""
cat ~/.ssh/cq_deploy.pub    # 追加到 EC2 的 ~/.ssh/authorized_keys
cat ~/.ssh/cq_deploy        # 填入 EC2_SSH_KEY
```

### 2. 安全组

放行 22 端口。GitHub Actions 出口 IP 不固定，需要对 `0.0.0.0/0` 开放（仅密钥登录）。若不接受，改用 AWS SSM 方案。

### 3. EC2 上登录 GHCR（私有仓库必须）

GitHub → Settings → Developer settings → Personal access tokens，勾选 `read:packages`，然后在 EC2 上执行一次：

```bash
echo "<TOKEN>" | docker login ghcr.io -u wany353 --password-stdin
```

### 4. EC2 上的 `.env`

`~/AWS-Practice-Test/.env` 需要包含（参考仓库根目录的 `.env.example`）：

```
ConnectionStrings__DefaultConnection=...    # Neon
JwtSettings__Secret=...                     # openssl rand -base64 48
```

这个文件不在 git 里，部署流程不会覆盖它。

## 日常使用

```bash
git checkout -b feature/xxx
# 改代码、提交
git push -u origin feature/xxx
# 在 GitHub 上开 PR，等 CI 变绿，合并到 main → 自动部署
```

## 回滚

Actions → Deploy → Run workflow → 在 `image_tag` 填入要回退到的 commit SHA。填了 SHA 就跳过构建，直接部署已存在的镜像，约 1 分钟。

## 排错

| 现象 | 原因 |
| :--- | :--- |
| 部署卡在健康检查，日志里后端起不来 | 多半是数据库迁移失败或 `.env` 缺变量，看 `docker compose logs backend` |
| `docker compose pull` 报 unauthorized | EC2 上的 GHCR 登录过期，重新 `docker login ghcr.io` |
| SSH 步骤 permission denied | 公钥没进 `authorized_keys`，或 `EC2_SSH_KEY` 粘贴时丢了首尾行 |

健康检查打的是 `http://localhost/api/health`，经 nginx 反代到后端，能同时验证两个容器。

## 当前的局限

- 项目没有自动化测试，CI 只能保证"能编译、能打包、翻译词典完整"，逻辑错误挡不住。
- 单实例部署，`up -d` 先停后起，每次部署有 10–20 秒中断。
- 数据库迁移在后端启动时自动执行，迁移失败要等部署时才暴露，需靠回滚恢复。
