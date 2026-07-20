#!/usr/bin/env python3
"""Extract the `content` field of a persisted DesignSync get_file tool result
into a target file. Usage: extract-designsync.py <result.json/txt> <target>"""
import json, sys, base64
src, target = sys.argv[1], sys.argv[2]
d = json.load(open(src))
assert not d.get('truncated'), f"{d['path']} was truncated at 256KiB — do not use this copy"
if d.get('isBase64'):
    open(target, 'wb').write(base64.b64decode(d['content']))
else:
    open(target, 'w').write(d['content'])
print(f"{d['path']} -> {target} ({len(d['content'])} chars)")
