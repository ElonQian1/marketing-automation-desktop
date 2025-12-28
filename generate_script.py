import socket
import time

s = socket.socket()
s.settimeout(60)
s.connect(('127.0.0.1', 11451))
cmd = 'SCRIPT_GENERATE:打开小红书，在首页瀑布流中找到点赞数超过1万的笔记，点击进入查看，然后提取前5条评论\n'
s.sendall(cmd.encode('utf-8'))

all_data = b''
start = time.time()

while time.time() - start < 60:
    try:
        chunk = s.recv(4096)
        if chunk:
            all_data += chunk
            decoded = all_data.decode('utf-8', 'replace')
            print(decoded)
            if '"status":"success"' in decoded or '"status":"failed"' in decoded:
                break
        else:
            break
    except:
        break

s.close()
