# AI 邮件分类器

这是一个使用 Microsoft Graph API 和 Azure AI 服务的邮件自动分类工具。它可以帮助你自动分类和管理 Outlook 邮件。

## 功能特点

- 自动获取 Outlook 邮件
- 使用 AI 进行邮件内容分析
- 自动分类和标记邮件
- 支持自定义分类规则

## 环境要求

- Python 3.8 或更高版本
- Microsoft 365 账户
- Azure 订阅（用于 AI 服务）

## 安装步骤

1. 克隆项目到本地：
```bash
git clone [项目地址]
cd AI-Email-Organizer
```

2. 安装依赖包：
```bash
pip install -r requirements.txt
```

3. 配置环境变量：
   - 复制 `.env.example` 文件为 `.env`
   - 在 `.env` 文件中填入以下信息：
     ```
     APPLICATION_ID=
  AZURE_LANGUAGE_KEY=
  AZURE_LANGUAGE_ENDPOINT=
     ```

## 运行项目

1. 确保已正确配置 `.env` 文件

2. test:
```bash
python test_simple.py

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件
