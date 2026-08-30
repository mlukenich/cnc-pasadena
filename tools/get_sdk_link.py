import urllib.request
import re

url = 'https://cncnz.com/downloads/tiberium-wars-downloads/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'href=["\']([^"\']+)["\']', html)
        for m in matches:
            if any(k in m.lower() for k in ['sdk', 'builder', 'mod', 'file', 'download', 'exe', 'zip']):
                print('Match:', m)
except Exception as e:
    print('Error:', e)
