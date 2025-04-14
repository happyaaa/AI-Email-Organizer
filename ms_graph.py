import os
import msal
from dotenv import load_dotenv

MS_GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0"

def get_access_token(application_id, scopes):
    """
    使用设备代码流获取访问令牌
    """
    print(f"初始化MSAL应用，client_id: {application_id}")
    print(f"请求的权限: {scopes}")
    
    client = msal.PublicClientApplication(
        client_id=application_id,
        authority='https://login.microsoftonline.com/consumers/'
    )

    # 使用设备代码流
    print("初始化设备代码流...")
    flow = client.initiate_device_flow(scopes=scopes)
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

def main():
    load_dotenv()
    APPLICATION_ID = os.getenv('APPLICATION_ID')
    SCOPES = [
        "User.Read",
        "Mail.Read",
        "Mail.ReadBasic",
        "Mail.ReadWrite",
        "MailboxSettings.Read"
    ]

    try:
        access_token = get_access_token(APPLICATION_ID, SCOPES)
        print("成功获取访问令牌！")
    except Exception as e:
        print(f"错误: {e}")

if __name__ == "__main__":
    main()





