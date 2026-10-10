#!/usr/bin/env python3
import os
import sys
import json
import time

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import load_magento_config
from magento_client import MagentoClient

def extract_catalog():
    print("==================================================")
    print(" [Stage 1] Extracting Magento 2 Catalog Data      ")
    print("==================================================")

    config = load_magento_config()
    client = MagentoClient(config)
    output_dir = os.path.join("artifacts", "extracted")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Categories
    cat_file = os.path.join(output_dir, "categories.json")
    if not os.path.exists(cat_file):
        print("\n[1/3] Extracting Categories Tree...")
        cat_tree = client.get_categories_tree()
        with open(cat_file, "w", encoding="utf-8") as f:
            json.dump(cat_tree, f, indent=2, ensure_ascii=False)
        print(f"  -> Saved categories to {cat_file}")
    else:
        print("\n[1/3] Categories tree already cached.")

    # 2. Attribute Sets & Key Attributes
    attr_file = os.path.join(output_dir, "attributes.json")
    if not os.path.exists(attr_file):
        print("\n[2/3] Extracting Attribute Sets & Custom Attributes...")
        attr_sets = client.get_attribute_sets()
        attributes = client.get_attributes(page_size=200)
        attr_data = {
            "attribute_sets": attr_sets,
            "attributes": attributes
        }
        with open(attr_file, "w", encoding="utf-8") as f:
            json.dump(attr_data, f, indent=2, ensure_ascii=False)
        print(f"  -> Saved {len(attr_sets)} attribute sets and {len(attributes)} attributes to {attr_file}")
    else:
        print("\n[2/3] Attributes & Sets already cached.")

    # 3. Products (Public Catalog) with resume capability
    print("\n[3/3] Extracting Catalog Products (1,049 items)...")
    products_file = os.path.join(output_dir, "products.json")
    all_products = []
    seen_skus = set()

    if os.path.exists(products_file):
        try:
            with open(products_file, "r", encoding="utf-8") as f:
                all_products = json.load(f)
                seen_skus = {p.get("sku") for p in all_products if p.get("sku")}
                print(f"  Resuming from existing {len(all_products)} cached products...")
        except Exception:
            all_products = []

    page_size = 50
    # Calculate starting page
    start_page = (len(all_products) // page_size) + 1

    page = start_page
    while True:
        print(f"  Fetching products page {page}...", end="", flush=True)
        res = client.fetch_products_page(page=page, page_size=page_size)
        items = res.get("items", [])
        total_count = res.get("total_count", 0)

        if not items:
            print(" (Done)")
            break

        new_items = []
        for p in items:
            sku = p.get("sku")
            if sku not in seen_skus:
                seen_skus.add(sku)
                # For configurable products, fetch children & options
                if p.get("type_id") == "configurable":
                    p["_configurable_children"] = client.get_configurable_children(sku)
                    p["_configurable_options"] = client.get_configurable_options(sku)
                new_items.append(p)

        all_products.extend(new_items)
        print(f" ({len(new_items)} new, total cached: {len(all_products)}/{total_count})")

        # Incrementally persist after every page
        with open(products_file, "w", encoding="utf-8") as f:
            json.dump(all_products, f, indent=2, ensure_ascii=False)

        if len(all_products) >= total_count:
            break

        page += 1
        time.sleep(0.2)

    print(f"\n✅ Catalog Extraction Complete! All {len(all_products)} products cached in {products_file}")

if __name__ == "__main__":
    extract_catalog()
