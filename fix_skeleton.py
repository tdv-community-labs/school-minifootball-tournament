import os

path = r'C:\Users\orxan\.gemini\antigravity\scratch\school-minifootball-tournament\components\Standings.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Only keep one import of Skeleton
lines = content.split('\n')
new_lines = []
skeleton_imports_seen = 0

for line in lines:
    if 'import { Skeleton }' in line:
        skeleton_imports_seen += 1
        if skeleton_imports_seen > 1:
            continue
    new_lines.append(line)

with open(path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))
