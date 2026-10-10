#!/usr/bin/env python3
import os
import sys
import json
import re
import time

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import load_saleor_config
from saleor_client import SaleorClient
from state_manager import StateManager

def slugify(text):
    text = re.sub(r'[^\w\s-]', '', str(text).lower()).strip()
    return re.sub(r'[-\s]+', '-', text)

def migrate_products(limit=None, dry_run=False):
    print("==================================================")
    print(" [Stage 4] Migrating Products & Variants to Saleor")
    print("==================================================")

    prod_file = os.path.join("artifacts", "extracted", "products.json")
    if not os.path.exists(prod_file):
        raise FileNotFoundError(f"Products file not found at {prod_file}. Run 01_extract_all.py first!")

    with open(prod_file, "r", encoding="utf-8") as f:
        products = json.load(f)

    config = load_saleor_config()
    client = SaleorClient(config, dry_run=dry_run)
    state = StateManager(dry_run=dry_run)

    total_available = len(products)
    if limit:
        products = products[:limit]
    print(f"Processing {len(products)} products (out of {total_available} total, limit={limit})...\n")

    # Map of child simple product IDs that belong to configurable products
    child_product_ids = set()
    for p in products:
        if p.get("type_id") == "configurable":
            for child in p.get("_configurable_children", []):
                child_product_ids.add(child.get("id"))

    print(f"Detected {len(child_product_ids)} child simple products belonging to configurables (will be migrated as variants).\n")

    success_count = 0
    skipped_count = 0

    for idx, p in enumerate(products, 1):
        p_id = p.get("id")
        sku = p.get("sku")
        name = p.get("name", "").strip()
        type_id = p.get("type_id")
        attr_set_id = p.get("attribute_set_id")
        price = float(p.get("price") or 0.0)

        # Skip child products being processed as standalone
        if type_id == "simple" and p_id in child_product_ids:
            continue

        # Check if already migrated
        existing_s_id = state.get_product(p_id)
        if existing_s_id:
            skipped_count += 1
            continue

        # Determine Category
        category_ids = []
        for attr in p.get("custom_attributes", []):
            if attr.get("attribute_code") == "category_ids":
                category_ids = attr.get("value", [])
                break

        saleor_cat_id = None
        for cat_id in category_ids:
            s_cat = state.get_category(cat_id)
            if s_cat:
                saleor_cat_id = s_cat
                break

        # Determine ProductType
        saleor_pt_id = state.get_product_type(attr_set_id)
        if not saleor_pt_id:
            # Fallback to any known product type or default
            saleor_pt_id = list(state.state["product_types"].values())[0] if state.state["product_types"] else "default-pt"

        # Description
        description = ""
        for attr in p.get("custom_attributes", []):
            if attr.get("attribute_code") == "description":
                description = attr.get("value", "")
                break

        slug = f"{slugify(name)}-{p_id}"[:200]

        print(f"[{idx}/{len(products)}] Creating [{type_id.upper()}] SKU: {sku} - {name[:30]}...", end="")

        try:
            # 1. Create Product
            s_prod = client.create_product(
                name=name,
                slug=slug,
                product_type_id=saleor_pt_id,
                category_id=saleor_cat_id,
                description=description
            )
            s_prod_id = s_prod.get("id") if s_prod else f"mock-prod-{p_id}"
            state.set_product(p_id, s_prod_id)

            # 2. Publish to Channel
            client.update_product_channel_listing(s_prod_id, config["channel"], is_published=True)

            # 3. Handle Variants
            if type_id == "configurable":
                children = p.get("_configurable_children", [])
                variants_input = []
                for child in children:
                    c_sku = child.get("sku")
                    c_name = child.get("name", c_sku)
                    c_price = float(child.get("price") or price)
                    variants_input.append({
                        "sku": c_sku,
                        "name": c_name,
                        "attributes": [],
                        "channelListings": [{
                            "channelId": config["channel"],
                            "price": c_price
                        }]
                    })
                if variants_input:
                    client.create_variant_bulk(s_prod_id, variants_input)
            else:
                # Standalone simple product
                client.create_variant_bulk(s_prod_id, [{
                    "sku": sku,
                    "name": name,
                    "attributes": [],
                    "channelListings": [{
                        "channelId": config["channel"],
                        "price": price
                    }]
                }])

            # 3. Handle Media Images
            media_entries = p.get("media_gallery_entries", [])
            for m in media_entries[:3]: # First 3 photos
                img_file = m.get("file", "")
                if img_file:
                    minio_url = f"https://minio.k8s.bdgyoo.com/bdgy-media/media/catalog/product{img_file}"
                    client.create_product_media(s_prod_id, minio_url, alt=name)

            print(f" ✅ Success -> {s_prod_id}")
            success_count += 1
        except Exception as e:
            print(f" ❌ Error: {e}")

    print(f"\nProducts Migration Finished: {success_count} migrated, {skipped_count} skipped.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    migrate_products(limit=args.limit, dry_run=args.dry_run)
