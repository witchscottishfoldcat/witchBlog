# MinIO 公开读策略：运维授权指令

## 背景

应用启动流程（`init_service` → `minio_policy_service.setup_all_policies()`）会为
`witchcat-files` 桶规范设置前缀级公开读策略（`s3:GetObject`，公开前缀清单见
`app/core/storage_paths.py`）。当前服务账号 `witchcat-app` 缺少桶策略管理权限，
启动时报：

```
S3 operation failed; code: AccessDenied, resource: /witchcat-files
```

这是 **MinIO 侧 IAM 授权问题**（应用代码行为正确），需管理员在 MinIO 服务器执行一次。

## 修复步骤（在能访问 MinIO 的机器上，用管理员凭证）

```bash
# 1) 用管理员账号注册别名（替换 <ADMIN_AK>/<ADMIN_SK>）
mc alias set minio-admin http://minio.example.com:9000 <ADMIN_AK> <ADMIN_SK>

# 2) 创建"允许管理 witchcat-files 桶策略"的 IAM 策略
cat > witchcat-bucket-policy-admin.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetBucketPolicy", "s3:PutBucketPolicy"],
      "Resource": ["arn:aws:s3:::witchcat-files"]
    }
  ]
}
EOF
mc admin policy create minio-admin witchcat-bucket-policy-admin witchcat-bucket-policy-admin.json

# 3) 把策略附加给应用服务账号
mc admin policy attach minio-admin witchcat-bucket-policy-admin --user witchcat-app

# 4) 重启应用（或重新触发启动流程），观察日志应出现：
#    "✅ 所有MinIO策略设置成功"
```

## 验证

应用启动日志不再出现 `设置公开读取策略失败: AccessDenied`；
`minio_policy_service.verify_policy()` 返回 True。

## 备注

- 不要用 `mc anonymous set download` 整桶公开——应用的公开范围是**前缀级**的
  （私有文件仍受保护），整桶公开会扩大暴露面。
- 授权后策略由应用统一维护（`set_public_read_policy` 会清理历史遗留语句、
  只保留一条权威语句），无需手工管理桶策略内容。
