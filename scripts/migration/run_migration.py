#!/usr/bin/env python3
import os
import sys
import argparse

# Ensure project root & migration directory in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from stage0_init_saleor_environment import init_saleor_environment
from stage1_extract_catalog import extract_catalog
from stage2_migrate_categories import migrate_categories
from stage3_migrate_attributes import migrate_attributes
from stage4_migrate_products import migrate_products

def main():
    parser = argparse.ArgumentParser(
        description="BDGY Magento 2 to Saleor Migration Pipeline CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 1. Extract all source data to local JSON cache:
  python3 scripts/migration/run_migration.py --extract

  # 2. Dry-run test category & product migration without mutating Saleor:
  python3 scripts/migration/run_migration.py --migrate-categories --dry-run
  python3 scripts/migration/run_migration.py --migrate-products --limit 5 --dry-run

  # 3. Execute live migration stage by stage:
  python3 scripts/migration/run_migration.py --migrate-categories
  python3 scripts/migration/run_migration.py --migrate-attributes
  python3 scripts/migration/run_migration.py --migrate-products
        """
    )

    parser.add_argument("--init-env", action="store_true", help="Stage 0: Initialize Channel, Warehouse & Shipping Zone on fresh Saleor")
    parser.add_argument("--extract", action="store_true", help="Stage 1: Extract all categories, attributes, and products from Magento 2")
    parser.add_argument("--migrate-categories", action="store_true", help="Stage 2: Migrate 71 categories hierarchy to Saleor")
    parser.add_argument("--migrate-attributes", action="store_true", help="Stage 3: Migrate 17 attribute sets & attributes to Saleor")
    parser.add_argument("--migrate-products", action="store_true", help="Stage 4: Migrate 1,049 products, variants & listings to Saleor")
    parser.add_argument("--all", action="store_true", help="Execute complete migration pipeline end-to-end")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of items to migrate (useful for testing)")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode: print mutations without writing to Saleor")

    args = parser.parse_args()

    if not any([args.init_env, args.extract, args.migrate_categories, args.migrate_attributes, args.migrate_products, args.all]):
        parser.print_help()
        sys.exit(1)

    if args.init_env or args.all:
        init_saleor_environment(dry_run=args.dry_run)

    if args.extract or args.all:
        extract_catalog()

    if args.migrate_categories or args.all:
        migrate_categories(dry_run=args.dry_run)

    if args.migrate_attributes or args.all:
        migrate_attributes(dry_run=args.dry_run)

    if args.migrate_products or args.all:
        migrate_products(limit=args.limit, dry_run=args.dry_run)

if __name__ == "__main__":
    main()
