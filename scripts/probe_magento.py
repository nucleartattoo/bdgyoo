#!/usr/bin/env python3
import os
import sys
import json
import time
import hmac
import hashlib
import base64
import urllib.request
import urllib.parse
from urllib.error import HTTPError, URLError

def load_config():
    home = os.environ.get('HOME', '')
    env_path = os.path.join(home, '.ssh', '.env.bdgy')
    if not os.path.exists(env_path):
        raise FileNotFoundError(f"Config file not found at {env_path}")

    with open(env_path, 'r', encoding='utf-8') as f:
        lines = [line.strip() for line in f if line.strip()]

    base_url = "https://www.bdgyoo.com"
    consumer_key = ""
    consumer_secret = ""
    access_token = ""
    access_token_secret = ""

    for i, line in enumerate(lines):
        if line.startswith("url "):
            base_url = line.replace("url ", "").strip()
        elif line.lower() == "consumer key" and i + 1 < len(lines):
            consumer_key = lines[i + 1]
        elif line.lower() == "consumer secret" and i + 1 < len(lines):
            consumer_secret = lines[i + 1]
        elif line.lower() == "access token" and i + 1 < len(lines):
            access_token = lines[i + 1]
        elif line.lower() == "access token secret" and i + 1 < len(lines):
            access_token_secret = lines[i + 1]

    base_url = base_url.rstrip('/')
    return {
        "base_url": base_url,
        "consumer_key": consumer_key,
        "consumer_secret": consumer_secret,
        "access_token": access_token,
        "access_token_secret": access_token_secret
    }

def generate_oauth1_header(method, url_str, query_params, config):
    parsed = urllib.parse.urlparse(url_str)
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

    nonce = os.urandom(16).hex()
    timestamp = str(int(time.time()))

    oauth_params = {
        'oauth_consumer_key': config['consumer_key'],
        'oauth_nonce': nonce,
        'oauth_signature_method': 'HMAC-SHA256',
        'oauth_timestamp': timestamp,
        'oauth_token': config['access_token'],
        'oauth_version': '1.0'
    }

    # Combine query params and oauth params
    all_params = {}
    if parsed.query:
        for k, v in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True):
            all_params[k] = v
    all_params.update(query_params)
    all_params.update(oauth_params)

    # Sort & encode
    encoded_pairs = []
    for k in sorted(all_params.keys()):
        encoded_k = urllib.parse.quote(str(k), safe='')
        encoded_v = urllib.parse.quote(str(all_params[k]), safe='')
        encoded_pairs.append(f"{encoded_k}={encoded_v}")
    param_string = '&'.join(encoded_pairs)

    base_string = '&'.join([
        method.upper(),
        urllib.parse.quote(clean_url, safe=''),
        urllib.parse.quote(param_string, safe='')
    ])

    signing_key = f"{urllib.parse.quote(config['consumer_secret'], safe='')}&{urllib.parse.quote(config['access_token_secret'], safe='')}"
    signature = base64.b64encode(
        hmac.new(signing_key.encode('utf-8'), base_string.encode('utf-8'), hashlib.sha256).digest()
    ).decode('utf-8')

    oauth_params['oauth_signature'] = signature

    header_parts = [
        f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(v, safe="")}"'
        for k, v in sorted(oauth_params.items())
    ]
    return f"OAuth {', '.join(header_parts)}"

def api_request(endpoint, query_params=None, config=None, auth_mode="bearer"):
    if query_params is None:
        query_params = {}

    url = f"{config['base_url']}/rest/V1/{endpoint.lstrip('/')}"
    if query_params:
        query_str = urllib.parse.urlencode(query_params)
        full_url = f"{url}?{query_str}"
    else:
        full_url = url

    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    if auth_mode == "bearer":
        headers['Authorization'] = f"Bearer {config['access_token']}"
    else:
        headers['Authorization'] = generate_oauth1_header('GET', full_url, query_params, config)

    req = urllib.request.Request(full_url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read().decode('utf-8')
            return resp.status, json.loads(data)
    except HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            parsed_err = json.loads(body)
        except Exception:
            parsed_err = body
        return e.code, parsed_err
    except URLError as e:
        return 0, str(e.reason)

def check_auth_mode(config):
    print("Testing Bearer Token authentication...")
    status, res = api_request("store/websites", config=config, auth_mode="bearer")
    if status == 200:
        print("  -> Bearer Token authentication succeeded!")
        return "bearer"

    print(f"  -> Bearer Token returned HTTP {status}. Testing OAuth 1.0a (HMAC-SHA256)...")
    status_oauth, res_oauth = api_request("store/websites", config=config, auth_mode="oauth")
    if status_oauth == 200:
        print("  -> OAuth 1.0a authentication succeeded!")
        return "oauth"

    raise RuntimeError(
        f"Authentication failed. Bearer returned {status} ({res}), OAuth returned {status_oauth} ({res_oauth})"
    )

def main():
    print("=========================================================")
    print("      Magento 2 (bdgyoo.com) Data Audit & Inspection     ")
    print("=========================================================\n")

    config = load_config()
    print(f"Target Store URL : {config['base_url']}")
    print("Loaded credentials from ~/.ssh/.env.bdgy\n")

    auth_mode = check_auth_mode(config)

    report = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "store_url": config["base_url"],
        "auth_mode": auth_mode,
        "store_info": {},
        "categories": {},
        "products": {},
        "attribute_sets": [],
        "sample_products": []
    }

    # 1. Store configs
    print("\n[1/5] Fetching Store & Currency Configuration...")
    status, websites = api_request("store/websites", config=config, auth_mode=auth_mode)
    if status == 200:
        print(f"  Websites count: {len(websites)}")
        for w in websites:
            print(f"    - ID: {w.get('id')}, Code: {w.get('code')}, Name: {w.get('name')}")
        report["store_info"]["websites"] = websites

    status, store_views = api_request("store/storeViews", config=config, auth_mode=auth_mode)
    if status == 200:
        print(f"  Store Views count: {len(store_views)}")
        for sv in store_views:
            print(f"    - ID: {sv.get('id')}, Code: {sv.get('code')}, Name: {sv.get('name')}, Active: {sv.get('is_active')}")
        report["store_info"]["store_views"] = store_views

    status, configs = api_request("store/storeConfigs", config=config, auth_mode=auth_mode)
    if status == 200 and configs:
        c = configs[0]
        print(f"  Default Currency: {c.get('base_currency_code')}")
        print(f"  Timezone        : {c.get('timezone')}")
        print(f"  Weight Unit     : {c.get('weight_unit')}")
        report["store_info"]["store_configs"] = configs

    # 2. Categories
    print("\n[2/5] Fetching Category Hierarchy...")
    status, cat_tree = api_request("categories", config=config, auth_mode=auth_mode)
    if status == 200:
        total_cats = 0
        max_depth = 0
        cat_flat = []

        def walk_cat(cat, depth=0):
            nonlocal total_cats, max_depth
            total_cats += 1
            if depth > max_depth:
                max_depth = depth
            cat_flat.append({
                "id": cat.get("id"),
                "name": cat.get("name"),
                "is_active": cat.get("is_active"),
                "level": cat.get("level"),
                "product_count": cat.get("product_count"),
                "children_count": len(cat.get("children_data", []))
            })
            for ch in cat.get("children_data", []):
                walk_cat(ch, depth + 1)

        walk_cat(cat_tree)
        print(f"  Total Categories: {total_cats}")
        print(f"  Max Tree Depth  : {max_depth}")

        report["categories"] = {
            "total_count": total_cats,
            "max_depth": max_depth,
            "root_category": {
                "id": cat_tree.get("id"),
                "name": cat_tree.get("name")
            },
            "top_level": [
                {
                    "id": c.get("id"),
                    "name": c.get("name"),
                    "is_active": c.get("is_active"),
                    "product_count": c.get("product_count"),
                    "children": [
                        {"id": sub.get("id"), "name": sub.get("name"), "is_active": sub.get("is_active"), "product_count": sub.get("product_count")}
                        for sub in c.get("children_data", [])
                    ]
                }
                for c in cat_tree.get("children_data", [])
            ]
        }

        print("  Top-Level Categories:")
        for top_c in report["categories"]["top_level"]:
            print(f"    📁 [ID: {top_c['id']}] {top_c['name']} (Active: {top_c['is_active']}, Products: {top_c['product_count']}, Subcategories: {len(top_c['children'])})")
            for sub in top_c["children"][:4]:
                print(f"       └─ [ID: {sub['id']}] {sub['name']} (Active: {sub['is_active']}, Products: {sub['product_count']})")
            if len(top_c["children"]) > 4:
                print(f"       └─ ... and {len(top_c['children']) - 4} more")

    # 3. Product Catalog Statistics
    print("\n[3/5] Analyzing Product Catalog & Types...")
    status, all_prods = api_request("products", query_params={
        "searchCriteria[pageSize]": "1",
        "searchCriteria[currentPage]": "1"
    }, config=config, auth_mode=auth_mode)

    total_prods = all_prods.get("total_count", 0) if status == 200 else 0
    print(f"  Total Products Count: {total_prods}")

    prod_types = ["simple", "configurable", "bundle", "grouped", "virtual", "downloadable"]
    type_counts = {}
    for p_type in prod_types:
        st, res = api_request("products", query_params={
            "searchCriteria[filterGroups][0][filters][0][field]": "type_id",
            "searchCriteria[filterGroups][0][filters][0][value]": p_type,
            "searchCriteria[pageSize]": "1"
        }, config=config, auth_mode=auth_mode)
        count = res.get("total_count", 0) if st == 200 else 0
        type_counts[p_type] = count
        if count > 0:
            print(f"    - {p_type.capitalize():14}: {count}")

    st_en, res_en = api_request("products", query_params={
        "searchCriteria[filterGroups][0][filters][0][field]": "status",
        "searchCriteria[filterGroups][0][filters][0][value]": "1",
        "searchCriteria[pageSize]": "1"
    }, config=config, auth_mode=auth_mode)
    enabled_count = res_en.get("total_count", 0) if st_en == 200 else 0
    disabled_count = total_prods - enabled_count
    print(f"  Status Breakdown: Enabled = {enabled_count}, Disabled = {disabled_count}")

    report["products"] = {
        "total_count": total_prods,
        "type_counts": type_counts,
        "status": {
            "enabled": enabled_count,
            "disabled": disabled_count
        }
    }

    # 4. Attribute Sets
    print("\n[4/5] Inspecting Attribute Sets...")
    status, attr_sets = api_request("products/attribute-sets/sets/list", query_params={
        "searchCriteria[pageSize]": "50"
    }, config=config, auth_mode=auth_mode)

    if status == 200:
        sets_list = attr_sets.get("items", [])
        print(f"  Attribute Sets count: {len(sets_list)}")
        for s in sets_list:
            print(f"    - [ID: {s.get('attribute_set_id')}] {s.get('attribute_set_name')}")
        report["attribute_sets"] = sets_list

    # 5. Sample Products Analysis (PDP Structure, Media Gallery, Configurable Attributes)
    print("\n[5/5] Sampling Products for Variant & Media Structure...")
    # Sample 5 configurable products
    st_conf, conf_prods = api_request("products", query_params={
        "searchCriteria[filterGroups][0][filters][0][field]": "type_id",
        "searchCriteria[filterGroups][0][filters][0][value]": "configurable",
        "searchCriteria[pageSize]": "3"
    }, config=config, auth_mode=auth_mode)

    sample_items = []
    if st_conf == 200 and conf_prods.get("items"):
        for cp in conf_prods.get("items", []):
            sku = cp.get("sku")
            # Fetch configurable options
            st_opt, opts = api_request(f"configurable-products/{urllib.parse.quote(sku, safe='')}/options/all", config=config, auth_mode=auth_mode)
            # Fetch configurable children
            st_child, children = api_request(f"configurable-products/{urllib.parse.quote(sku, safe='')}/children", config=config, auth_mode=auth_mode)

            sample_items.append({
                "id": cp.get("id"),
                "sku": sku,
                "name": cp.get("name"),
                "price": cp.get("price"),
                "type": "configurable",
                "media_count": len(cp.get("media_gallery_entries", [])),
                "options": opts if st_opt == 200 else [],
                "children_count": len(children) if st_child == 200 else 0
            })

    # Sample 2 simple products
    st_simp, simp_prods = api_request("products", query_params={
        "searchCriteria[filterGroups][0][filters][0][field]": "type_id",
        "searchCriteria[filterGroups][0][filters][0][value]": "simple",
        "searchCriteria[pageSize]": "2"
    }, config=config, auth_mode=auth_mode)

    if st_simp == 200 and simp_prods.get("items"):
        for sp in simp_prods.get("items", []):
            sample_items.append({
                "id": sp.get("id"),
                "sku": sp.get("sku"),
                "name": sp.get("name"),
                "price": sp.get("price"),
                "type": "simple",
                "media_count": len(sp.get("media_gallery_entries", [])),
                "custom_attributes_count": len(sp.get("custom_attributes", []))
            })

    report["sample_products"] = sample_items
    if sample_items:
        print("  Sample Configurable & Simple Items analyzed:")
        for item in sample_items:
            if item.get("type") == "configurable":
                print(f"    📦 [Configurable] SKU: {item['sku']} | Name: {item['name']} | Media: {item['media_count']} | Variants: {item['children_count']}")
            else:
                print(f"    📄 [Simple]       SKU: {item['sku']} | Name: {item['name']} | Price: {item['price']} | Media: {item['media_count']}")

    # Save output artifacts
    os.makedirs("artifacts", exist_ok=True)
    report_json_path = os.path.join("artifacts", "magento2-audit-report.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Full Audit Report saved to: {report_json_path}")

    # Generate Markdown Summary
    summary_md_path = os.path.join("artifacts", "audit-summary.md")
    with open(summary_md_path, "w", encoding="utf-8") as f:
        f.write("# BDGY (bdgyoo.com) 原站数据普查总结\n\n")
        f.write(f"- **探测时间** : {report['generated_at']}\n")
        f.write(f"- **源站地址** : {report['store_url']}\n")
        f.write(f"- **认证模式** : {report['auth_mode']}\n\n")

        f.write("## 1. 站点与店铺视图\n\n")
        f.write(f"- Websites 数量: `{len(report['store_info'].get('websites', []))}`\n")
        f.write(f"- Store Views 数量: `{len(report['store_info'].get('store_views', []))}`\n")
        if report['store_info'].get('store_configs'):
            cfg = report['store_info']['store_configs'][0]
            f.write(f"- 默认基础货币: `{cfg.get('base_currency_code')}`\n")
            f.write(f"- 时区: `{cfg.get('timezone')}`\n")
            f.write(f"- 重量单位: `{cfg.get('weight_unit')}`\n\n")

        f.write("## 2. 商品分类统计\n\n")
        f.write(f"- **分类总节点数** : `{report['categories'].get('total_count', 0)}`\n")
        f.write(f"- **最大层级深度** : `{report['categories'].get('max_depth', 0)}`\n\n")
        f.write("| 分类 ID | 分类名称 | 启用状态 | 商品数 | 子分类数 |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for c in report['categories'].get('top_level', []):
            f.write(f"| {c['id']} | {c['name']} | {'是' if c['is_active'] else '否'} | {c['product_count']} | {len(c['children'])} |\n")
        f.write("\n")

        f.write("## 3. 商品目录与结构分布\n\n")
        f.write(f"- **商品总量 (Total Products)** : `{report['products'].get('total_count', 0)}`\n")
        f.write(f"- **已上架 (Enabled)** : `{report['products'].get('status', {}).get('enabled', 0)}`\n")
        f.write(f"- **已下架 (Disabled)** : `{report['products'].get('status', {}).get('disabled', 0)}`\n\n")
        f.write("| 商品类型 | 数量 | 占比 | 对应 Saleor 建模方案 |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        total_p = report['products'].get('total_count', 1) or 1
        for p_t, cnt in report['products'].get('type_counts', {}).items():
            if cnt > 0:
                pct = f"{(cnt / total_p) * 100:.1f}%"
                saleor_map = "Product + ProductVariants (多规格变体)" if p_t == "configurable" else "Product + 单一 Variant"
                f.write(f"| {p_t.capitalize()} | {cnt} | {pct} | {saleor_map} |\n")
        f.write("\n")

        f.write("## 4. 属性集 (Attribute Sets)\n\n")
        for s in report['attribute_sets']:
            f.write(f"- ID `{s.get('attribute_set_id')}`: **{s.get('attribute_set_name')}**\n")

    print(f"✅ Markdown Summary saved to: {summary_md_path}\n")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Audit Execution Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
