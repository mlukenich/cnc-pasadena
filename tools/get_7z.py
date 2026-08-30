import urllib.request
import re
import subprocess
import os

req = urllib.request.Request('https://www.7-zip.org/download.html', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')
    matches = re.findall(r'href=["\'](a/7z[0-9]+-extra\.7z)["\']', html)
    print('Found 7z extra URL:', matches)
    if matches:
        extra_url = 'https://www.7-zip.org/' + matches[0]
        print('Downloading:', extra_url)
        with urllib.request.urlopen(urllib.request.Request(extra_url, headers={'User-Agent': 'Mozilla/5.0'})) as d_resp:
            with open('tools/7z-extra.7z', 'wb') as out_f:
                out_f.write(d_resp.read())
        print('Extracting with 7zr.exe...')
        subprocess.run(['tools/7zr.exe', 'x', '-otools/7z_extra', 'tools/7z-extra.7z', '-y'])
        print('7za extracted successfully!')
