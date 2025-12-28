import socket
import time

def send_command(cmd, timeout=60):
    s = socket.socket()
    s.settimeout(timeout)
    s.connect(('127.0.0.1', 11451))
    s.sendall((cmd + '\n').encode('utf-8'))
    
    all_data = b''
    start = time.time()
    
    while time.time() - start < timeout:
        try:
            chunk = s.recv(4096)
            if chunk:
                all_data += chunk
                decoded = all_data.decode('utf-8', 'replace')
                # Check for completion
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

# Step 1: Generate a new script
print("=" * 50)
print("Step 1: Generating script...")
print("=" * 50)
result = send_command('SCRIPT_GENERATE:打开小红书，滚动首页找到包含"万"字样的点赞数笔记，点击进入后提取5条评论')
print(result)

# Extract script ID
import re
match = re.search(r'"id":\s*"([^"]+)"', result)
if match:
    script_id = match.group(1)
    print(f"\nScript ID: {script_id}")
    
    # Step 2: Execute the script
    print("\n" + "=" * 50)
    print("Step 2: Executing script with auto-improve...")
    print("=" * 50)
    
    exec_result = send_command(f'SCRIPT_EXECUTE_AUTO:{script_id}', timeout=180)
    
    # Print progress
    lines = exec_result.split('\n')
    for line in lines:
        if line.strip():
            print(line)
else:
    print("Failed to extract script ID")
