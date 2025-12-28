#!/usr/bin/env python3
"""
测试 VS Code Copilot ↔ APK AI Agent 双层协作
"""
import socket
import json
import time
import sys

def test_script_generate():
    """测试 AI Agent 生成脚本"""
    s = socket.socket()
    s.settimeout(180)
    s.connect(('127.0.0.1', 11451))
    
    goal = '打开小红书，然后在首页找到点赞上万的瀑布流卡片，然后点击进去获取前5个有意义评论'
    
    command = f'SCRIPT_GENERATE:{goal}\n'
    print(f'📤 [Step 1] 请求 AI Agent 生成脚本...')
    print(f'🎯 目标: {goal}')
    s.sendall(command.encode())
    
    print('\n⏳ AI 正在分析屏幕并生成脚本...\n')
    all_data = b''
    start = time.time()
    script_id = None
    
    while time.time() - start < 120:
        try:
            s.settimeout(5)
            chunk = s.recv(16384)
            if chunk:
                all_data += chunk
                try:
                    text = all_data.decode('utf-8')
                    if text.strip().endswith('}'):
                        result = json.loads(text)
                        print('✅ 收到脚本生成结果!')
                        print(json.dumps(result, ensure_ascii=False, indent=2)[:2000])
                        
                        if 'scriptId' in result:
                            script_id = result['scriptId']
                            print(f'\n📝 脚本ID: {script_id}')
                            print(f'📋 脚本名: {result.get("scriptName", "未知")}')
                            print(f'📊 步骤数: {result.get("stepCount", "未知")}')
                        break
                except json.JSONDecodeError:
                    continue
                except UnicodeDecodeError:
                    continue
        except socket.timeout:
            elapsed = int(time.time() - start)
            print(f'⏳ AI 正在思考... ({elapsed}s)', end='\r')
        except Exception as e:
            print(f'\n⚠️ 异常: {e}')
            break
    
    if all_data and script_id is None:
        raw = all_data.decode('utf-8', errors='replace')[:1500]
        print(f'\n📄 原始响应: {raw}')
    
    s.close()
    return script_id


def test_script_execute(script_id):
    """测试执行已生成的脚本"""
    if not script_id:
        print('❌ 没有脚本ID，跳过执行测试')
        return
    
    s = socket.socket()
    s.settimeout(180)
    s.connect(('127.0.0.1', 11451))
    
    # 使用自动执行模式（带自我改进）
    command = f'SCRIPT_EXECUTE_AUTO:{script_id}\n'
    print(f'\n📤 [Step 2] 执行脚本（自动改进模式）...')
    print(f'🆔 脚本ID: {script_id}')
    s.sendall(command.encode())
    
    print('\n⏳ 执行中...\n')
    start = time.time()
    
    while time.time() - start < 180:
        try:
            s.settimeout(10)
            data = s.recv(16384)
            if data:
                text = data.decode('utf-8', errors='replace')
                for line in text.strip().split('\n'):
                    if line:
                        print(f'📥 {line[:300]}')
                        if 'SCRIPT_COMPLETE' in line or 'SCRIPT_ERROR' in line:
                            print('\n✅ 脚本执行完成')
                            s.close()
                            return
        except socket.timeout:
            elapsed = int(time.time() - start)
            print(f'⏳ 执行中... ({elapsed}s)', end='\r')
        except Exception as e:
            print(f'\n⚠️ 异常: {e}')
            break
    
    s.close()


def test_run_ai_goal():
    """测试完整的 AI Goal 执行（生成+执行一体）"""
    s = socket.socket()
    s.settimeout(300)  # 5分钟超时
    s.connect(('127.0.0.1', 11451))
    
    goal = '打开小红书，然后在首页找到点赞上万的瀑布流卡片，然后点击进去获取前5个有意义评论'
    
    command = f'RUN_AI_GOAL:{goal}\n'
    print(f'📤 [一体化] 发送 AI Goal...')
    print(f'🎯 目标: {goal}')
    s.sendall(command.encode())
    
    print('\n⏳ AI Agent 正在自主处理（生成脚本→执行→自我改进）...\n')
    start = time.time()
    
    while time.time() - start < 300:
        try:
            s.settimeout(15)
            data = s.recv(16384)
            if data:
                text = data.decode('utf-8', errors='replace')
                for line in text.strip().split('\n'):
                    if line:
                        print(f'📥 {line[:400]}')
                        if 'AI_GOAL_COMPLETE' in line or 'AI_GOAL_ERROR' in line:
                            print('\n✅ AI Goal 执行完成')
                            s.close()
                            return
        except socket.timeout:
            elapsed = int(time.time() - start)
            print(f'⏳ AI 自主处理中... ({elapsed}s)', end='\r')
        except Exception as e:
            print(f'\n⚠️ 异常: {e}')
            break
    
    s.close()


if __name__ == '__main__':
    print('='*60)
    print('🤖 VS Code Copilot ↔ APK AI Agent 双层协作测试')
    print('='*60)
    
    mode = sys.argv[1] if len(sys.argv) > 1 else 'generate'
    
    if mode == 'generate':
        # 分步测试：先生成脚本
        script_id = test_script_generate()
        if script_id:
            print(f'\n💡 执行脚本命令: python test_ai_agent.py execute {script_id}')
    
    elif mode == 'execute' and len(sys.argv) > 2:
        # 执行指定脚本
        test_script_execute(sys.argv[2])
    
    elif mode == 'goal':
        # 一体化测试
        test_run_ai_goal()
    
    else:
        print('用法:')
        print('  python test_ai_agent.py generate    # 生成脚本')
        print('  python test_ai_agent.py execute ID  # 执行脚本')
        print('  python test_ai_agent.py goal        # 一体化执行')
