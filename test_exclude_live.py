#!/usr/bin/env python3
"""
测试 AI Agent 脚本生成（带直播排除）
"""
import socket
import json
import time

def test_generate():
    s = socket.socket()
    s.settimeout(180)
    s.connect(('127.0.0.1', 11451))
    
    goal = '打开小红书，然后在首页找到点赞上万的笔记卡片（排除直播），点击进去获取前5条评论'
    
    command = f'SCRIPT_GENERATE:{goal}\n'
    print(f'📤 请求生成脚本: {goal}')
    s.sendall(command.encode())
    
    print('⏳ AI 正在生成脚本...')
    all_data = b''
    start = time.time()
    script_id = None
    
    while time.time() - start < 90:
        try:
            s.settimeout(10)
            chunk = s.recv(16384)
            if chunk:
                all_data += chunk
                try:
                    text = all_data.decode('utf-8')
                    for line in text.strip().split('\n'):
                        if 'scriptId' in line:
                            result = json.loads(line)
                            print('\n✅ 脚本生成成功!')
                            script_id = result.get('scriptId')
                            print(f"📝 脚本ID: {script_id}")
                            print(f"📋 脚本名: {result.get('scriptName')}")
                            print(f"📊 步骤数: {result.get('stepCount')}")
                            break
                except:
                    pass
                if script_id:
                    break
        except socket.timeout:
            elapsed = int(time.time() - start)
            print(f'⏳ {elapsed}s...', end='\r')
        except Exception as e:
            print(f'Error: {e}')
            break
    
    print(f'\n\n📄 完整响应:')
    response_text = all_data.decode('utf-8', errors='replace')
    print(response_text[-3000:])
    s.close()
    
    return script_id


def test_execute(script_id):
    if not script_id:
        print('❌ 没有脚本ID')
        return
    
    s = socket.socket()
    s.settimeout(300)
    s.connect(('127.0.0.1', 11451))
    
    command = f'SCRIPT_EXECUTE_AUTO:{script_id}\n'
    print(f'\n📤 执行脚本: {script_id}')
    s.sendall(command.encode())
    
    print('⏳ 执行中...\n')
    start = time.time()
    
    while time.time() - start < 180:
        try:
            s.settimeout(15)
            data = s.recv(16384)
            if data:
                text = data.decode('utf-8', errors='replace')
                for line in text.strip().split('\n'):
                    if line:
                        print(f'📥 {line[:300]}')
                        if 'status":"complete' in line or 'SCRIPT_ERROR' in line:
                            print('\n✅ 执行完成')
                            s.close()
                            return
        except socket.timeout:
            elapsed = int(time.time() - start)
            print(f'⏳ {elapsed}s...', end='\r')
        except Exception as e:
            print(f'Error: {e}')
            break
    
    s.close()


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'execute':
        script_id = sys.argv[2] if len(sys.argv) > 2 else None
        test_execute(script_id)
    else:
        script_id = test_generate()
        if script_id:
            print(f'\n💡 执行命令: python test_exclude_live.py execute {script_id}')
