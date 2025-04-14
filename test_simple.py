import os
import msal
from dotenv import load_dotenv
import requests
from datetime import datetime
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential

# 加载环境变量
load_dotenv()

# 配置
APPLICATION_ID = os.getenv('APPLICATION_ID')
AZURE_LANGUAGE_KEY = os.getenv('AZURE_LANGUAGE_KEY')
AZURE_LANGUAGE_ENDPOINT = os.getenv('AZURE_LANGUAGE_ENDPOINT')
SCOPES = [
    "User.Read",
    "Mail.Read",
    "Mail.ReadBasic",
    "Mail.ReadWrite",
    "MailboxSettings.Read"
]

# 初始化 Azure AI Language Service 客户端
print("初始化 Azure AI Language Service...")
text_analytics_client = TextAnalyticsClient(
    endpoint=AZURE_LANGUAGE_ENDPOINT,
    credential=AzureKeyCredential(AZURE_LANGUAGE_KEY)
)

def get_access_token():
    """
    使用设备代码流获取访问令牌
    """
    print(f"初始化MSAL应用，client_id: {APPLICATION_ID}")
    print(f"请求的权限: {SCOPES}")
    
    client = msal.PublicClientApplication(
        client_id=APPLICATION_ID,
        authority='https://login.microsoftonline.com/consumers/'
    )

    # 使用设备代码流
    print("初始化设备代码流...")
    flow = client.initiate_device_flow(scopes=SCOPES)
    if "user_code" not in flow:
        print("设备流初始化失败")
        print(f"Flow response: {flow}")
        raise ValueError("无法初始化设备流")

    print(f"请在浏览器中访问: {flow['verification_uri']}")
    print(f"输入以下代码: {flow['user_code']}")
    
    # 等待用户完成认证
    print("等待用户认证...")
    result = client.acquire_token_by_device_flow(flow)
    
    if "access_token" in result:
        print("成功获取访问令牌")
        print(f"令牌类型: {result.get('token_type')}")
        print(f"权限范围: {result.get('scope')}")
        return result["access_token"]
    else:
        print("获取访问令牌失败")
        print(f"错误详情: {result}")
        raise ValueError("获取访问令牌失败: " + str(result.get("error_description")))

def classify_email(subject, content):
    """
    使用 Azure AI Language Service 对邮件进行分类
    """
    try:
        # 准备分类文本
        text = f"主题: {subject}\n内容: {content}"
        
        # 使用 Azure AI 进行情感分析和关键词提取
        sentiment_result = text_analytics_client.analyze_sentiment([text])[0]
        key_phrases = text_analytics_client.extract_key_phrases([text])[0]
        
        # 根据情感和关键词进行分类
        sentiment = sentiment_result.sentiment
        confidence = sentiment_result.confidence_scores[sentiment]
        
        print(f"情感分析结果: {sentiment} (置信度: {confidence:.2f})")
        print(f"关键词: {key_phrases.key_phrases}")
        
        # 根据情感和关键词映射到分类
        if sentiment == "positive" and any(phrase in ["工作", "项目", "会议"] for phrase in key_phrases.key_phrases):
            return "工作"
        elif sentiment == "positive" and any(phrase in ["学习", "课程", "作业"] for phrase in key_phrases.key_phrases):
            return "学习"
        elif sentiment == "positive" and any(phrase in ["社交", "活动", "聚会"] for phrase in key_phrases.key_phrases):
            return "社交"
        elif any(phrase in ["订阅", "新闻", "通知"] for phrase in key_phrases.key_phrases):
            return "订阅"
        else:
            return "其他"
            
    except Exception as e:
        print(f"AI 分类错误: {str(e)}")
        return "其他"

def add_category_to_email(token, message_id, category):
    """
    为邮件添加分类标签
    """
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "categories": [category]
    }
    
    try:
        response = requests.patch(
            f"https://graph.microsoft.com/v1.0/me/messages/{message_id}",
            headers=headers,
            json=data
        )
        response.raise_for_status()
        print(f"成功为邮件添加分类: {category}")
    except Exception as e:
        print(f"添加分类失败: {str(e)}")

def get_messages(token):
    """
    获取邮件列表并进行分类
    """
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    
    try:
        # 首先获取收件箱文件夹ID
        print("获取邮件文件夹...")
        folders_response = requests.get(
            "https://graph.microsoft.com/v1.0/me/mailFolders",
            headers=headers
        )
        folders_response.raise_for_status()
        print(f"文件夹响应状态: {folders_response.status_code}")
        
        # 打印所有找到的文件夹
        folders = folders_response.json().get('value', [])
        print("\n找到的文件夹:")
        for folder in folders:
            print(f"- {folder['displayName']} (ID: {folder['id']})")
        
        # 查找收件箱
        inbox_id = None
        for folder in folders:
            if folder['displayName'].lower() in ['inbox', '收件箱']:
                inbox_id = folder['id']
                break
        
        if not inbox_id:
            raise ValueError("找不到收件箱文件夹")
        
        print(f"\n找到收件箱ID: {inbox_id}")
        
        # 获取收件箱中的邮件
        print("\n获取邮件...")
        response = requests.get(
            f"https://graph.microsoft.com/v1.0/me/mailFolders/{inbox_id}/messages",
            headers=headers,
            params={
                '$top': 10,
                '$select': 'id,subject,from,receivedDateTime,bodyPreview,isRead,categories,importance,body',
                '$orderby': 'receivedDateTime desc'
            }
        )
        response.raise_for_status()
        print(f"邮件响应状态: {response.status_code}")
        
        messages = response.json().get('value', [])
        print(f"获取到 {len(messages)} 封邮件")
        
        for msg in messages:
            print("\n" + "="*50)
            print(f"主题: {msg.get('subject', '无主题')}")
            print(f"发件人: {msg.get('from', {}).get('emailAddress', {}).get('address', '未知发件人')}")
            print(f"时间: {msg.get('receivedDateTime', '')}")
            print(f"重要性: {msg.get('importance', '普通')}")
            print(f"当前分类: {', '.join(msg.get('categories', ['无分类']))}")
            
            # 获取邮件完整内容
            message_id = msg['id']
            message_response = requests.get(
                f"https://graph.microsoft.com/v1.0/me/messages/{message_id}",
                headers=headers,
                params={'$select': 'body'}
            )
            message_response.raise_for_status()
            message_content = message_response.json().get('body', {}).get('content', '')
            
            # 使用 AI 进行分类
            category = classify_email(msg.get('subject', ''), message_content)
            print(f"AI 分类结果: {category}")
            
            # 添加分类标签
            add_category_to_email(token, message_id, category)
            
            print(f"预览: {msg.get('bodyPreview', '无预览')}")
            print(f"已读: {msg.get('isRead', False)}")
        
    except requests.exceptions.RequestException as e:
        print(f"请求错误: {str(e)}")
        if hasattr(e, 'response'):
            print(f"响应状态码: {e.response.status_code}")
            print(f"响应内容: {e.response.text}")
        raise

def main():
    try:
        # 获取访问令牌
        access_token = get_access_token()
        
        # 获取邮件并进行分类
        get_messages(access_token)
        
    except Exception as e:
        print(f"发生错误: {str(e)}")

if __name__ == "__main__":
    main() 