# https://learn.microsoft.com/en-us/graph/api/resources/emailaddress?view=graph-rest-1.0

import os
import requests
from dotenv import load_dotenv
import mimetypes
import base64
from ms_graph import get_access_token, MS_GRAPH_BASE_URL
from pathlib import Path


def search_folder(headers, folder_name='drafts'):
    """
    Search for a folder by name and return its ID
    """
    endpoint = f"{MS_GRAPH_BASE_URL}/me/mailFolders"
    response = requests.get(endpoint, headers=headers)
    response.raise_for_status()
    folders = response.json().get('value', [])
    for folder in folders:
        if folder['displayName'].lower() == folder_name.lower():
            return folder
    return None


def get_sub_folders(headers, folder_id):
    """
    Get all subfolders of a given folder
    """
    endpoint = f"{MS_GRAPH_BASE_URL}/me/mailFolders/{folder_id}/childFolders"
    response = requests.get(endpoint, headers=headers)
    response.raise_for_status()
    return response.json().get('value', [])


def get_messages(token):
    """
    获取邮件列表
    """
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    
    # 首先获取收件箱文件夹ID
    folders_response = requests.get(
        f'{MS_GRAPH_BASE_URL}/me/mailFolders',
        headers=headers
    )
    folders_response.raise_for_status()
    
    # 查找收件箱
    inbox_id = None
    for folder in folders_response.json().get('value', []):
        if folder['displayName'].lower() == 'inbox':
            inbox_id = folder['id']
            break
    
    if not inbox_id:
        raise ValueError("找不到收件箱文件夹")
    
    # 获取收件箱中的邮件
    response = requests.get(
        f'{MS_GRAPH_BASE_URL}/me/mailFolders/{inbox_id}/messages',
        headers=headers,
        params={
            '$top': 10,
            '$select': 'id,subject,from,receivedDateTime,bodyPreview,isRead',
            '$orderby': 'receivedDateTime desc'
        }
    )
    response.raise_for_status()
    
    messages = response.json().get('value', [])
    return [{
        'id': msg['id'],
        'subject': msg.get('subject', '无主题'),
        'from': msg.get('from', {}).get('emailAddress', {}).get('address', '未知发件人'),
        'receivedDateTime': msg.get('receivedDateTime', ''),
        'preview': msg.get('bodyPreview', '无预览'),
        'isRead': msg.get('isRead', False)
    } for msg in messages]


def search_messages(headers, search_query, filter=None, folder_id=None, fileds='*', top=5, max_results=100):
    if folder_id is None:
        endpoint = f"{MS_GRAPH_BASE_URL}/me/messages"
    else:
        endpoint = f"{MS_GRAPH_BASE_URL}/me/mailFolders/{folder_id}/messages"

    params = {
        '$search': f'"{search_query}"',
        '$filter': filter,
        '$select': fileds,
        '$top': min(top, max_results)
    }

    messages = []  # store messages
    next_link = endpoint

    while next_link and len(messages) < max_results:
        response = requests.get(next_link, headers=headers, params=params)
        if response.status_code != 200:
            raise Exception(f"Failed to retrieve emails: {response.status_code} - {response.text}")

        json_response = response.json()
        messages.extend(json_response.get('value', []))
        next_link = json_response.get('@odata.nextLink', None)
        params = None

        if next_link and len(messages) + top > max_results:
            params = {
                '$top': max_results - len(messages)
            }
    return messages[:max_results]


def add_label_to_message(headers, message_id, label_name):
    """
    为邮件添加标签
    """
    endpoint = f"{MS_GRAPH_BASE_URL}/me/messages/{message_id}"
    data = {
        "categories": [label_name]
    }
    response = requests.patch(endpoint, headers=headers, json=data)
    response.raise_for_status()
    return response.json()


def move_message_to_folder(headers, message_id, folder_id):
    """
    将邮件移动到指定文件夹
    """
    endpoint = f"{MS_GRAPH_BASE_URL}/me/messages/{message_id}/move"
    data = {
        "destinationId": folder_id
    }
    response = requests.post(endpoint, headers=headers, json=data)
    response.raise_for_status()
    return response.json()


def classify_email_with_gpt(token, message_id):
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json'
    }
    
    # 获取邮件内容
    response = requests.get(
        f'{MS_GRAPH_BASE_URL}/me/messages/{message_id}',
        headers=headers
    )
    response.raise_for_status()
    message = response.json()
    
    # 简单的分类逻辑
    subject = message.get('subject', '').lower()
    if 'report' in subject or 'meeting' in subject:
        return '工作'
    elif 'news' in subject or 'subscription' in subject:
        return '订阅'
    else:
        return '其他'


def process_and_classify_emails(headers, folder_id=None, max_emails=10):
    """
    处理并分类邮件
    """
    # 获取邮件
    messages = get_messages(headers)
    
    results = []
    for message in messages:
        message_id = message['id']
        
        # 分类邮件
        category = classify_email_with_gpt(headers, message_id)
        
        # 添加标签
        add_label_to_message(headers, message_id, category)
        
        # 获取或创建对应的文件夹
        target_folder = search_folder(headers, category)
        if target_folder:
            # 移动邮件到对应文件夹
            move_message_to_folder(headers, message_id, target_folder['id'])
        
        results.append({
            'id': message_id,
            'subject': message['subject'],
            'category': category,
            'processed': True
        })
    
    return results









