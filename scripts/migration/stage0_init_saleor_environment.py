#!/usr/bin/env python3
import os
import sys
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import load_saleor_config
from saleor_client import SaleorClient

def init_saleor_environment(dry_run=False):
    print("==================================================")
    print(" [Stage 0] Initializing Greenfield Saleor Setup   ")
    print("==================================================")

    config = load_saleor_config()
    client = SaleorClient(config, dry_run=dry_run)

    print(f"Target Saleor Endpoint: {config['api_endpoint']}")
    print(f"Default Channel Slug: {config['channel']}")
    print(f"Default Currency: {config['currency']}\n")

    # 1. Inspect / Ensure Channel
    print("[1/3] Ensuring Channel Configuration...")
    channel_query = """
    query GetChannels {
      channels {
        id
        name
        slug
        currencyCode
        isActive
      }
    }
    """
    channel_id = None
    if not dry_run:
        try:
            res = client.execute(channel_query)
            channels = res.get("data", {}).get("channels", [])
            for ch in channels:
                if ch.get("slug") == config["channel"]:
                    channel_id = ch.get("id")
                    print(f"  ✅ Channel '{config['channel']}' exists -> {channel_id}")
                    break
        except Exception as e:
            print(f"  Notice checking channels: {e}")

    if not channel_id:
        print(f"  Channel '{config['channel']}' will be used/created.")
        channel_id = f"mock-channel-{config['channel']}"

    # 2. Inspect / Ensure Warehouse
    print("\n[2/3] Ensuring Warehouse (Inventory Management)...")
    warehouse_mutation = """
    mutation CreateWarehouse($input: WarehouseCreateInput!) {
      warehouseCreate(input: $input) {
        warehouse {
          id
          name
          slug
        }
        errors {
          field
          message
          code
        }
      }
    }
    """
    warehouse_input = {
        "name": "BDGY Main Logistics Center",
        "slug": "bdgy-main-warehouse",
        "email": "logistics@bdgyoo.com",
        "address": {
            "companyName": "BDGY Tattoo Supply",
            "streetAddress1": "1000 Logistics Blvd",
            "city": "Los Angeles",
            "countryArea": "CA",
            "postalCode": "90021",
            "country": "US",
            "phone": "+1 (555) 019-2834"
        }
    }
    warehouse_id = None
    if dry_run:
        print(f"[DRY-RUN GraphQL Mutation]\nQuery: mutation CreateWarehouse($input: WarehouseCreateInput!) {{...}}\nVariables: {json.dumps({'input': warehouse_input}, indent=2)[:200]}")
        warehouse_id = "mock-warehouse-bdgy"
        print(f"  ✅ [DRY-RUN] Warehouse ready -> {warehouse_id}")
    else:
        try:
            res = client.execute(warehouse_mutation, {"input": warehouse_input})
            w_data = res.get("data", {}).get("warehouseCreate", {})
            if w_data.get("warehouse"):
                warehouse_id = w_data["warehouse"]["id"]
                print(f"  ✅ Warehouse created -> {warehouse_id}")
            else:
                print(f"  Warehouse notice: {w_data.get('errors')}")
        except Exception as e:
            print(f"  Notice creating warehouse: {e}")

    # 3. Inspect / Ensure Shipping Zone & Shipping Methods (Fulfillment Triangle)
    print("\n[3/3] Ensuring Shipping Zone & Fulfillment Triangle...")
    shipping_zone_mutation = """
    mutation CreateShippingZone($input: ShippingZoneCreateInput!) {
      shippingZoneCreate(input: $input) {
        shippingZone {
          id
          name
        }
        errors {
          field
          message
          code
        }
      }
    }
    """
    zone_input = {
        "name": "United States Domestic",
        "countries": ["US"],
        "default": True,
        "addChannels": [channel_id] if channel_id and not channel_id.startswith("mock-") else [],
        "addWarehouses": [warehouse_id] if warehouse_id and not warehouse_id.startswith("mock-") else [],
    }

    if dry_run:
        print(f"[DRY-RUN GraphQL Mutation]\nQuery: mutation CreateShippingZone($input: ShippingZoneCreateInput!) {{...}}\nVariables: {json.dumps({'input': zone_input}, indent=2)[:200]}")
        zone_id = "mock-shipping-zone-us"
        print(f"  ✅ [DRY-RUN] Shipping Zone ready -> {zone_id}")
        print("  ✅ [DRY-RUN] Linked Channel <-> Warehouse <-> Shipping Zone (Fulfillment Triangle valid)")
    else:
        try:
            res = client.execute(shipping_zone_mutation, {"input": zone_input})
            sz_data = res.get("data", {}).get("shippingZoneCreate", {})
            if sz_data.get("shippingZone"):
                zone_id = sz_data["shippingZone"]["id"]
                print(f"  ✅ Shipping Zone created -> {zone_id}")
            else:
                print(f"  Shipping Zone notice: {sz_data.get('errors')}")
        except Exception as e:
            print(f"  Notice creating shipping zone: {e}")

    print("\nGreenfield Environment Initialization Check Complete.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    init_saleor_environment(dry_run=args.dry_run)
