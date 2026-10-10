#!/usr/bin/env python3
import os
import sys
import json
import re

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import load_saleor_config
from saleor_client import SaleorClient
from state_manager import StateManager

def slugify(text):
    text = re.sub(r'[^\w\s-]', '', str(text).lower()).strip()
    return re.sub(r'[-\s]+', '-', text)

def migrate_categories(dry_run=False):
    print("==================================================")
    print(" [Stage 2] Migrating Categories Hierarchy         ")
    print("==================================================")

    cat_file = os.path.join("artifacts", "extracted", "categories.json")
    if not os.path.exists(cat_file):
        raise FileNotFoundError(f"Extracted categories not found at {cat_file}. Run 01_extract_all.py first!")

    with open(cat_file, "r", encoding="utf-8") as f:
        root_tree = json.load(f)

    config = load_saleor_config()
    client = SaleorClient(config, dry_run=dry_run)
    state = StateManager(dry_run=dry_run)

    # Collect nodes by level
    nodes = []

    def collect(node, parent_id=None):
        m_id = node.get("id")
        level = node.get("level", 0)
        name = node.get("name", "").strip()
        is_active = node.get("is_active", True)
        slug = slugify(name) or f"category-{m_id}"

        # Don't migrate root node (ID 1 or 2 usually "Root Catalog")
        if level > 1:
            nodes.append({
                "m_id": m_id,
                "parent_m_id": parent_id,
                "name": name,
                "slug": slug,
                "level": level,
                "is_active": is_active
            })

        for child in node.get("children_data", []):
            collect(child, parent_id=m_id)

    collect(root_tree)
    # Sort by level so parents are created before children
    nodes.sort(key=lambda x: x["level"])

    print(f"Total categories to process: {len(nodes)}\n")

    created = 0
    skipped = 0

    for cat in nodes:
        m_id = cat["m_id"]
        name = cat["name"]
        slug = cat["slug"]
        parent_m_id = cat["parent_m_id"]

        # Check if already migrated
        existing_s_id = state.get_category(m_id)
        if existing_s_id:
            print(f"  [Skipped] {name} (Already migrated: {existing_s_id})")
            skipped += 1
            continue

        parent_s_id = state.get_category(parent_m_id) if parent_m_id else None

        print(f"  Creating Category: {name} (Level {cat['level']}, Parent Saleor ID: {parent_s_id or 'ROOT'})...", end="")
        try:
            s_cat = client.create_category(
                name=name,
                slug=f"{slug}-{m_id}",
                parent_id=parent_s_id
            )
            s_id = s_cat.get("id") if s_cat else f"mock-cat-{m_id}"
            state.set_category(m_id, s_id)
            print(f" ✅ Success -> {s_id}")
            created += 1
        except Exception as e:
            print(f" ❌ Error: {e}")

    print(f"\nCategories Migration Finished: {created} created, {skipped} skipped.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    migrate_categories(dry_run=args.dry_run)
