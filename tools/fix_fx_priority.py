import os

with open('src/Data/GlobalData/FXParticleSystem.xml', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Priority="ULTRA_HIGH"', 'Priority="VERY_HIGH"')

with open('src/Data/GlobalData/FXParticleSystem.xml', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed FXParticleSystem.xml priorities!")
