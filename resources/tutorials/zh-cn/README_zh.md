<div align="center">

# OpenWebUI Monitor

[English](../../../README.md) / **简体中文**

</div>

专为 OpenWebUI 设计的用量监控和用户余额管理面板。只需要向 OpenWebUI 添加一个简单的[函数](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/resources/functions/openwebui_monitor.py)，就能在一个面板统一查看用户使用情况和余额。

## 特性

- 为 OpenWebUI 中的每个模型设置价格；
- 为每个用户设置余额，根据对话消耗 tokens 和模型价格扣除，并在每条聊天末尾提示；
- 查看用户使用数据和可视化。
- 一键测试所有模型的可用性。

## 部署

支持 Vercel 一键部署 [![Deploy on Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVariantConst%2FOpenWebUI-Monitor&project-name=openwebui-monitor&repository-name=OpenWebUI-Monitor&env=OPENWEBUI_DOMAIN,OPENWEBUI_API_KEY,ACCESS_TOKEN,API_KEY) 和 Docker 部署。详见 [部署指南](https://github.com/VariantConst/OpenWebUI-Monitor/blob/main/resources/tutorials/zh-cn/deployment_guide_zh.md)。

## 更新

Vercel 部署后会自动更新，如果有问题可以去 fork 的仓库手动 Sync fork。至于 Docker，拉取最新镜像后重启容器即可：

```bash
sudo docker compose pull
sudo docker compose up -d
```

## 环境变量

### 必填

| 变量名            | 说明                                                          | 示例                       |
| ----------------- | ------------------------------------------------------------- | -------------------------- |
| OPENWEBUI_DOMAIN  | OpenWebUI 的域名                                              | `https://chat.example.com` |
| OPENWEBUI_API_KEY | OpenWebUI 的 API Key，在 `个人设置 -> 账号 -> API密钥` 中获取 | `sk-xxxxxxxxxxxxxxxx`      |
| API_KEY           | 用于 API 请求验证                                             | `your-api-key-here`        |
| ACCESS_TOKEN      | 用于页面访问验证                                              | `your-access-token-here`   |

### 可选

| 变量名                     | 说明                                     | 默认值 |
| -------------------------- | ---------------------------------------- | ------ |
| DEFAULT_MODEL_INPUT_PRICE  | 默认模型输入价格，单位为元/百万 tokens | `60`   |
| DEFAULT_MODEL_OUTPUT_PRICE | 默认模型输出价格，单位为元/百万 tokens | `60`   |
| DEFAULT_MODEL_PER_MSG_PRICE | 模型默认每条消息价格，设为负数将按 token 计费 | `-1`   |
| INIT_BALANCE               | 用户初始余额                             | `0`    |

<h2>Gallery</h2>

<img width="993" alt="image" src="https://github.com/user-attachments/assets/0bc0043e-c949-4935-a5ef-d0d15e5501e0">
