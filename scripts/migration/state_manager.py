import os
import json

class StateManager:
    def __init__(self, state_file="artifacts/migration_state.json", dry_run=False):
        self.state_file = state_file
        self.dry_run = dry_run
        self.state = {
            "categories": {},
            "product_types": {},
            "attributes": {},
            "attribute_values": {},
            "products": {},
            "variants": {},
            "customers": {},
            "stats": {
                "categories_migrated": 0,
                "products_migrated": 0,
                "variants_migrated": 0,
                "customers_migrated": 0,
            }
        }
        self.load()

    def load(self):
        if not self.dry_run and os.path.exists(self.state_file):
            try:
                with open(self.state_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.state.update(data)
            except Exception as e:
                print(f"[StateManager] Warning: could not load existing state: {e}")

    def save(self):
        if self.dry_run:
            return  # Do not persist mock state during dry-run
        os.makedirs(os.path.dirname(self.state_file), exist_ok=True)
        with open(self.state_file, "w", encoding="utf-8") as f:
            json.dump(self.state, f, indent=2, ensure_ascii=False)

    def set_category(self, magento_id, saleor_id):
        self.state["categories"][str(magento_id)] = saleor_id
        self.state["stats"]["categories_migrated"] = len(self.state["categories"])
        self.save()

    def get_category(self, magento_id):
        return self.state["categories"].get(str(magento_id))

    def set_product_type(self, magento_set_id, saleor_id):
        self.state["product_types"][str(magento_set_id)] = saleor_id
        self.save()

    def get_product_type(self, magento_set_id):
        return self.state["product_types"].get(str(magento_set_id))

    def set_attribute(self, attr_code, saleor_id):
        self.state["attributes"][str(attr_code)] = saleor_id
        self.save()

    def get_attribute(self, attr_code):
        return self.state["attributes"].get(str(attr_code))

    def set_product(self, magento_id, saleor_id):
        self.state["products"][str(magento_id)] = saleor_id
        self.state["stats"]["products_migrated"] = len(self.state["products"])
        self.save()

    def get_product(self, magento_id):
        return self.state["products"].get(str(magento_id))

    def set_variant(self, magento_id, saleor_id):
        self.state["variants"][str(magento_id)] = saleor_id
        self.state["stats"]["variants_migrated"] = len(self.state["variants"])
        self.save()

    def get_variant(self, magento_id):
        return self.state["variants"].get(str(magento_id))

    def set_customer(self, magento_id, saleor_id):
        self.state["customers"][str(magento_id)] = saleor_id
        self.state["stats"]["customers_migrated"] = len(self.state["customers"])
        self.save()

    def get_customer(self, magento_id):
        return self.state["customers"].get(str(magento_id))
