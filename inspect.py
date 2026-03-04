import sys
path='multilang.js'
with open(path,'rb') as f:
    data=f.read()
for i in range(len(data)):
    if 1300<=i<=1410:
        sys.stdout.write(f"{i:04d}:{data[i]:02x} ")
    if i==1410:
        break
print()