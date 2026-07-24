#!/usr/bin/env bash
cd /home/user/ShieldTechPortal
pkill -f "vite preview" 2>/dev/null; sleep 1
nohup npx --prefix apps/portal vite preview --port 4180 --strictPort >/tmp/p.log 2>&1 &
P1=$!
nohup npx --prefix apps/tech vite preview --port 4181 --strictPort >/tmp/t.log 2>&1 &
P2=$!
nohup npx --prefix apps/customer vite preview --port 4182 --strictPort >/tmp/c.log 2>&1 &
P3=$!
sleep 6
curl -s -o /dev/null -w "portal:%{http_code} tech:%{http_code} cust:%{http_code}\n" http://localhost:4180/ http://localhost:4181/ http://localhost:4182/
node scripts/viewport-check.mjs 2>&1 | tail -18
kill $P1 $P2 $P3 2>/dev/null
exit 0
