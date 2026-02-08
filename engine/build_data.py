#!/usr/bin/env python3
import json
import os
import re
import uuid


def main() -> int:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(base_dir)

    info_file = os.path.join(base_dir, "info_output.json")
    clean_dir = os.path.join(root_dir, "app", "Assets", "Creator", "clean_image")

    page_out = os.path.join(root_dir, "app", "data", "page_data.json")
    image_out = os.path.join(root_dir, "app", "data", "image_data.json")

    if not os.path.isfile(info_file):
        print(f"Missing info_output.json: {info_file}")
        return 1

    if not os.path.isdir(clean_dir):
        print(f"Missing clean_image folder: {clean_dir}")
        return 1

    with open(info_file, "r", encoding="utf-8") as f:
        items = json.load(f)

    if not isinstance(items, list):
        print("info_output.json must be a list")
        return 1

    id_to_uuid = {}
    page_items = []
    for item in items:
        if not isinstance(item, dict):
            continue
        profile_id = item.get("ID")
        page_uuid = str(uuid.uuid4())
        row = dict(item)
        row["uuid"] = page_uuid
        page_items.append(row)
        if profile_id:
            id_to_uuid[str(profile_id)] = page_uuid

    with open(page_out, "w", encoding="utf-8") as f:
        json.dump(page_items, f, indent=2, ensure_ascii=False)

    pattern = re.compile(r"^IM_(.+)\.(jpg|jpeg|png|webp)$", re.IGNORECASE)
    image_items = []

    for name in sorted(os.listdir(clean_dir)):
        match = pattern.match(name)
        if not match:
            continue
        image_id = match.group(1)
        parts = image_id.split("_")
        profile_id = parts[0] if parts else ""
        page_uuid = id_to_uuid.get(profile_id)
        rel_path = os.path.join("app", "Assets", "Creator", "clean_image", name)
        image_items.append({
            "id": f"IM_{image_id}",
            "file": rel_path,
            "profile_id": profile_id,
            "page_uuid": page_uuid,
        })

    with open(image_out, "w", encoding="utf-8") as f:
        json.dump(image_items, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(page_items)} pages to {page_out}")
    print(f"Wrote {len(image_items)} images to {image_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
