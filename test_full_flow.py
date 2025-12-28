# -*- coding: utf-8 -*-
import socket
import time
import json
import re

def send_command(cmd, timeout=120):
    s = socket.socket()
    s.settimeout(timeout)
    s.connect(('127.0.0.1', 11451))
    s.sendall((cmd + '\n').encode('utf-8'))
    
    all_data = b''
    start = time.time()
    printed = set()
    
    while time.time() - start < timeout:
        try:
            chunk = s.recv(4096)
            if chunk:
                all_data += chunk
                decoded = all_data.decode('utf-8', 'replace')
                
                lines = decoded.strip().split('\n')
                for line in lines:
                    if line and line not in printed:
                        try:
                            data = json.loads(line)
                            if 'log' in data:
                                print("  LOG: " + data['log'])
                            elif 'progress' in data:
                                p = data['progress']
                                print("  PROGRESS: " + str(p['step']) + "/" + str(p['total']) + " - " + p['description'])
                        except:
                            pass
                        printed.add(line)
                
                if '"status":"success"' in decoded or '"status":"complete"' in decoded or '"status":"failed"' in decoded:
                    if decoded.rstrip().endswith('}'):
                        break
            else:
                break
        except socket.timeout:
            break
        except:
            break
    
    s.close()
    return all_data.decode('utf-8', 'replace')

print("=" * 60)
print("VS Code Copilot 自主驱动 APK AI代理 测试")
print("=" * 60)
print()

print("[Step 1] 让APK AI代理生成自动化脚本...")
print("-" * 50)
goal = "打开小红书，在首页瀑布流中找到点赞数超过1万的笔记卡片，点击进入笔记详情，向上滑动查看评论区，提取前5条有意义的评论内容"
result = send_command('SCRIPT_GENERATE:' + goal)

match = re.search(r'"id":\s*"([^"]+)"', result)
if not match:
    print("脚本生成失败!")
    exit(1)

script_id = match.group(1)
print()
print("脚本生成成功! ID: " + script_id)
print()

print("[Step 2] 执行脚本（带自动改进）...")
print("-" * 50)
exec_result = send_command('SCRIPT_EXECUTE_AUTO:' + script_id, timeout=180)

print()
success = '"success": true' in exec_result or '"success":true' in exec_result
if success:
    print("脚本执行成功!")
    comments_match = re.search(r'"comments":\s*\[([^\]]*)\]', exec_result)
    if comments_match:
        comments = comments_match.group(1)
        if comments.strip():
            print("提取到的评论: " + comments[:200] + "...")
        else:
            print("评论列表为空 (需要改进EXTRACT_DATA逻辑)")
else:
    print("脚本执行未完全成功")
    error_match = re.search(r'"error":\s*"([^"]*)"', exec_result)
    if error_match:
        print("错误: " + error_match.group(1))

print()
print("=" * 60)
print("测试总结")
print("=" * 60)
print("脚本ID: " + script_id)
status = "成功" if success else "需要改进"
print("执行状态: " + status)
print()
