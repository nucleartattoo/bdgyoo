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

def migrate_attributes(dry_run=False):
    print("==================================================")
    print(" [Stage 3] Migrating Attributes & Product Types   ")
    print("==================================================")

    attr_file = os.path.join("artifacts", "extracted", "attributes.json")
    if not os.path.exists(attr_file):
        raise FileNotFoundError(f"Attributes file not found at {attr_file}. Run 01_extract_all.py first!")

    with open(attr_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    config = load_saleor_config()
    client = SaleorClient(config, dry_run=dry_run)
    state = StateManager(dry_run=dry_run)

    attribute_sets = data.get("attribute_sets", [])
    attributes = data.get("attributes", [])

    print(f"Loaded {len(attribute_sets)} Attribute Sets and {len(attributes)} Attributes.\n")

    # 1. Key Variant Selection Attributes to ensure in Saleor
    CORE_VARIANT_ATTRS = [
        {"code": "color", "name": "Color", "values": ["Black", "Grey", "Red", "Gold", "Silver", "Purple", "Blue"]},
        {"code": "size", "name": "Size", "values": ["0801RL", "1003RL", "1205RS", "1207M1", "1209RM"]},
        {"code": "stroke", "name": "Stroke Length", "values": ["2.5mm", "3.0mm", "3.5mm", "4.0mm", "4.2mm"]},
        {"code": "needle_style", "name": "Needle Style", "values": ["Round Liner", "Round Shader", "Magnum", "Curved Magnum"]},
        {"code": "clip_cord_type", "name": "Clip Cord Type", "values": ["RCA", "DC", "Wireless Battery"]},
    ]

    migrated_attr_ids = []

    print("[1/2] Creating Variant Selection Attributes in Saleor...")
    for attr in CORE_VARIANT_ATTRS:
        code = attr["code"]
        existing = state.get_attribute(code)
        if existing:
            print(f"  [Skipped] Attribute {attr['name']} ({code}) already created -> {existing}")
            migrated_attr_ids.append(existing)
            continue

        print(f"  Creating Attribute: {attr['name']} ({code})...", end="")
        try:
            s_attr = client.create_attribute(
                name=attr["name"],
                slug=f"bdgy-{slugify(code)}",
                values=attr["values"]
            )
            s_id = s_attr.get("id") if s_attr else f"mock-attr-{code}"
            state.set_attribute(code, s_id)
            migrated_attr_ids.append(s_id)
            print(f" ✅ Success -> {s_id}")
        except Exception as e:
            print(f" ❌ Error: {e}")

    # 2. Product Types (from 17 Attribute Sets)
    print("\n[2/2] Creating Product Types from Attribute Sets...")
    for s in attribute_sets:
        set_id = s.get("attribute_set_id")
        set_name = s.get("attribute_set_name")
        slug = f"pt-{slugify(set_name)}-{set_id}"

        existing_pt = state.get_product_type(set_id)
        if existing_pt:
            print(f"  [Skipped] ProductType {set_name} (Set {set_id}) already created -> {existing_pt}")
            continue

        print(f"  Creating ProductType: {set_name} (Set {set_id})...", end="")
        try:
            s_pt = client.create_product_type(
                name=set_name,
                slug=slug,
                has_variants=True,
                variant_attributes=migrated_attr_ids
            )
            pt_id = s_pt.get("id") if s_pt else f"mock-pt-{set_id}"
            state.set_product_type(set_id, pt_id)
            print(f" ✅ Success -> {pt_id}")
        except Exception as e:
            print(f" ❌ Error: {e}")

    print("\nAttributes & Product Types Migration Finished.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    migrate_attributes(dry_run=args.dry_run)
