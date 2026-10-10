#!/usr/bin/env python3
import json
import os
import re

def slugify(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

def generate_catalog():
    print("Generating storefront catalog from extracted Magento data...")

    with open("artifacts/extracted/categories.json", "r", encoding="utf-8") as f:
        cat_tree = json.load(f)

    with open("artifacts/extracted/products.json", "r", encoding="utf-8") as f:
        products_raw = json.load(f)

    with open("artifacts/extracted/attributes.json", "r", encoding="utf-8") as f:
        attrs_raw = json.load(f)

    # 1. Attribute options dictionary: (attribute_id, value_index) -> label
    attr_opts = {}
    for a in attrs_raw.get("attributes", []):
        aid = str(a.get("attribute_id"))
        for opt in a.get("options", []):
            if opt.get("value"):
                attr_opts[(aid, str(opt.get("value")))] = opt.get("label")

    # 2. Process Categories
    # Top 7 root category mappings
    TOP_CATEGORY_SLUG_MAP = {
        "51": "tattoo-machines",
        "118": "tattoo-needles",
        "55": "tattoo-power-supplies",
        "142": "tattoo-kits",
        "54": "tattoo-grips",
        "180": "tattoo-medical",
        "58": "tattoo-accessories"
    }

    categories = {}
    cat_descendants = {} # cid -> set of all descendant cids including self

    def walk_categories(node, parent_id=None):
        cid = str(node.get("id"))
        name = node.get("name")
        slug = TOP_CATEGORY_SLUG_MAP.get(cid) or slugify(name)

        children_data = node.get("children_data", [])
        child_ids = [str(c.get("id")) for c in children_data]

        categories[cid] = {
            "id": cid,
            "name": name,
            "slug": slug,
            "parent_id": str(parent_id) if parent_id else None,
            "product_count": node.get("product_count", 0),
            "is_active": node.get("is_active", True),
            "children_ids": child_ids
        }

        desc = {cid}
        for child in children_data:
            child_desc = walk_categories(child, parent_id=cid)
            desc.update(child_desc)

        cat_descendants[cid] = desc
        return desc

    # Root is category id=2 ("Tattoo")
    walk_categories(cat_tree)

    # Clean slugs collision for categories
    slug_to_cat = {}
    for cid, cat in categories.items():
        if cat["id"] in ("1", "2"): # Skip root system nodes
            continue
        s = cat["slug"]
        if s in slug_to_cat and slug_to_cat[s]["id"] != cid:
            cat["slug"] = f"{s}-{cid}"
        slug_to_cat[cat["slug"]] = cat

    # 3. Process Products
    IMAGE_BASE = "https://www.bdgyoo.com/media/catalog/product"
    products = []
    slug_seen = {}

    for p in products_raw:
        pid = str(p.get("id"))
        sku = p.get("sku", "")
        name = p.get("name", "")
        type_id = p.get("type_id", "simple")
        visibility = p.get("visibility", 4)

        # Extract custom attributes
        attrs = {a.get("attribute_code"): a.get("value") for a in p.get("custom_attributes", []) if "attribute_code" in a}

        # Primary slug
        url_key = attrs.get("url_key")
        if not url_key:
            url_key = slugify(name) or slugify(sku)

        # Slug deduplication
        if url_key in slug_seen:
            slug_seen[url_key] += 1
            final_slug = f"{url_key}-{sku.lower()}"
        else:
            slug_seen[url_key] = 1
            final_slug = url_key

        # Pricing
        price = float(p.get("price") or 0.0)
        special_price = float(attrs.get("special_price") or 0.0)

        # Images & Media Gallery
        raw_img = attrs.get("image") or attrs.get("small_image") or attrs.get("thumbnail")
        main_img = f"{IMAGE_BASE}{raw_img}" if raw_img and raw_img != "no_selection" else ""

        gallery = []
        for entry in p.get("media_gallery_entries", []):
            fpath = entry.get("file")
            if fpath and fpath != "no_selection":
                gallery.append(f"{IMAGE_BASE}{fpath}")

        if not gallery and main_img:
            gallery = [main_img]
        if not main_img and gallery:
            main_img = gallery[0]

        # Category IDs
        raw_cids = attrs.get("category_ids") or []
        cat_ids = [str(c) for c in raw_cids if str(c) in categories]

        # Configurable Options
        conf_options = []
        for opt in p.get("_configurable_options", []):
            aid = str(opt.get("attribute_id"))
            label = opt.get("label") or "Option"
            values = []
            for v in opt.get("values", []):
                v_idx = str(v.get("value_index"))
                val_label = attr_opts.get((aid, v_idx)) or v_idx
                values.append({
                    "index": v_idx,
                    "label": val_label
                })
            conf_options.append({
                "id": str(opt.get("id")),
                "attribute_id": aid,
                "label": label,
                "values": values
            })

        # Configurable Children
        children = []
        for c in p.get("_configurable_children", []):
            c_price = float(c.get("price") or 0.0)
            children.append({
                "id": str(c.get("id")),
                "sku": c.get("sku"),
                "name": c.get("name"),
                "price": c_price
            })

        # Derive price from children if parent price is 0
        if price == 0 and children:
            c_prices = [c["price"] for c in children if c["price"] > 0]
            if c_prices:
                price = min(c_prices)

        # Description
        raw_desc = attrs.get("description") or ""
        raw_short_desc = attrs.get("short_description") or ""
        # Clean HTML tags for short description snippet
        clean_short_desc = re.sub(r"<[^>]+>", " ", raw_short_desc).strip()
        clean_short_desc = re.sub(r"\s+", " ", clean_short_desc)

        products.append({
            "id": pid,
            "sku": sku,
            "name": name,
            "slug": final_slug,
            "price": price,
            "special_price": special_price if special_price > 0 else None,
            "image": main_img,
            "gallery": gallery[:8],
            "category_ids": cat_ids,
            "type": type_id,
            "visibility": visibility,
            "is_visible_individually": visibility in (2, 3, 4, None),
            "options": conf_options,
            "children": children,
            "description": raw_desc,
            "short_description": clean_short_desc[:250],
        })

    # Save to src/data/catalog.json
    out_dir = os.path.join("src", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "catalog.json")

    # Serialize descendants as lists of cids
    descendants_serializable = {k: list(v) for k, v in cat_descendants.items()}

    catalog_data = {
        "categories": {cid: cat for cid, cat in categories.items() if cid not in ("1", "2")},
        "category_descendants": descendants_serializable,
        "products": products
    }

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(catalog_data, f, ensure_ascii=False)

    print(f"✅ Generated {out_file} with {len(catalog_data['categories'])} categories and {len(products)} products ({os.path.getsize(out_file)/1024:.1f} KB)")

if __name__ == "__main__":
    generate_catalog()
