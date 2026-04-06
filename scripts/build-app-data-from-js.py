#!/usr/bin/env python3
"""Импорт src/data.js → src/data/app-data.json (дублирует generate-app-data.mjs)."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
text = (root / "src/data.js").read_text(encoding="utf-8")
t, rest = text.split("const happy_entries = ", 1)
thoughts_s = t.split("const happy_thoughts = ", 1)[1].strip()
e, rest2 = rest.split("const happy_categories = ", 1)
entries_s = e.strip()
cat_s = rest2.split("export", 1)[0].strip()

happy_thoughts = json.loads(thoughts_s)
happy_entries = json.loads(entries_s)
happy_categories = json.loads(cat_s)
for th in happy_thoughts:
    th.setdefault("favorite", False)

payload = {
    "happy_entries": happy_entries,
    "happy_categories": happy_categories,
    "happy_thoughts": happy_thoughts,
    "happy_state_actions": [],
    "happy_victory_entries": [],
    "happy_victory_drafts": [],
    "happy_reward_tasks": [],
    "happy_hypotheses": [],
    "happy_section_stats": {},
    "happy_profile": {
        "displayName": "",
        "avatarDataUrl": None,
        "levelXp": 0,
        "teacherCharacterId": None,
        "pendingCaseLevels": [],
        "pendingTeacherLevels": [],
        "pendingTeacherModalLevel": None,
        "characterInventory": {},
    },
}
out = root / "src/data/app-data.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
print(
    "Written",
    out,
    "entries=",
    len(happy_entries),
    "thoughts=",
    len(happy_thoughts),
    "categories=",
    len(happy_categories),
)
