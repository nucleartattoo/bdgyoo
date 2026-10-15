import json
import urllib.request
import urllib.parse
from urllib.error import HTTPError

class SaleorClient:
    def __init__(self, config, dry_run=False):
        self.endpoint = config["api_endpoint"]
        self.token = config["app_token"]
        self.channel = config["channel"]
        self.currency = config["currency"]
        self.dry_run = dry_run

    def execute(self, query, variables=None):
        if variables is None:
            variables = {}

        if self.dry_run:
            print(f"[DRY-RUN GraphQL Mutation]\nQuery: {query.strip().splitlines()[0]}...\nVariables: {json.dumps(variables, indent=2)[:200]}")
            return {"data": {}}

        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if "kubernetes" in self.endpoint:
            headers["Host"] = "api.saleor.kubernetes.nucleartattoosupply.com"
            headers["X-Forwarded-Proto"] = "https"
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
        req = urllib.request.Request(self.endpoint, data=payload, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=40) as resp:
                result = json.loads(resp.read().decode("utf-8"))
                if "errors" in result and result["errors"]:
                    raise RuntimeError(f"GraphQL Errors: {result['errors']}")
                return result
        except HTTPError as e:
            err_text = e.read().decode("utf-8")
            raise RuntimeError(f"HTTP {e.code} for Saleor {self.endpoint}: {err_text[:300]}")

    def create_category(self, name, slug, parent_id=None, description=""):
        mutation = """
        mutation CreateCategory($input: CategoryInput!, $parent: ID) {
          categoryCreate(input: $input, parent: $parent) {
            category {
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
        input_data = {"name": name, "slug": slug}
        if description:
            # Saleor rich text or description json
            input_data["description"] = json.dumps({
                "time": 1600000000000,
                "blocks": [{"type": "paragraph", "data": {"text": description[:500]}}],
                "version": "2.20.0"
            })
        variables = {"input": input_data, "parent": parent_id}
        res = self.execute(mutation, variables)
        cat_data = res.get("data", {}).get("categoryCreate", {})
        errors = cat_data.get("errors", [])
        if errors:
            raise RuntimeError(f"categoryCreate errors for {name}: {errors}")
        return cat_data.get("category")

    def create_attribute(self, name, slug, input_type="DROPDOWN", values=None):
        mutation = """
        mutation CreateAttribute($input: AttributeCreateInput!) {
          attributeCreate(input: $input) {
            attribute {
              id
              name
              slug
              choices(first: 100) {
                edges {
                  node {
                    id
                    name
                    slug
                  }
                }
              }
            }
            errors {
              field
              message
              code
            }
          }
        }
        """
        input_data = {
            "name": name,
            "slug": slug,
            "type": "PRODUCT_TYPE",
            "inputType": input_type,
        }
        if values:
            input_data["values"] = [{"name": str(v)} for v in values]

        res = self.execute(mutation, {"input": input_data})
        attr_data = res.get("data", {}).get("attributeCreate", {})
        errors = attr_data.get("errors", [])
        if errors:
            # If slug already exists, fetch or ignore
            print(f"[SaleorClient] attributeCreate notice for {name}: {errors}")
        return attr_data.get("attribute")

    def create_product_type(self, name, slug, has_variants=True, product_attributes=None, variant_attributes=None):
        mutation = """
        mutation CreateProductType($input: ProductTypeInput!) {
          productTypeCreate(input: $input) {
            productType {
              id
              name
              slug
              hasVariants
            }
            errors {
              field
              message
              code
            }
          }
        }
        """
        input_data = {
            "name": name,
            "slug": slug,
            "hasVariants": has_variants,
            "productAttributes": product_attributes or [],
            "variantAttributes": variant_attributes or [],
        }
        res = self.execute(mutation, {"input": input_data})
        pt_data = res.get("data", {}).get("productTypeCreate", {})
        errors = pt_data.get("errors", [])
        if errors:
            print(f"[SaleorClient] productTypeCreate notice for {name}: {errors}")
        return pt_data.get("productType")

    def create_product(self, name, slug, product_type_id, category_id=None, description=""):
        mutation = """
        mutation CreateProduct($input: ProductCreateInput!) {
          productCreate(input: $input) {
            product {
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
        input_data = {
            "name": name,
            "slug": slug,
            "productType": product_type_id,
        }
        if category_id:
            input_data["category"] = category_id
        if description:
            input_data["description"] = json.dumps({
                "time": 1600000000000,
                "blocks": [{"type": "paragraph", "data": {"text": description[:1000]}}],
                "version": "2.20.0"
            })

        res = self.execute(mutation, {"input": input_data})
        prod_data = res.get("data", {}).get("productCreate", {})
        errors = prod_data.get("errors", [])
        if errors:
            raise RuntimeError(f"productCreate errors for {name}: {errors}")
        return prod_data.get("product")

    def create_variant_bulk(self, product_id, variants_input):
        mutation = """
        mutation BulkCreateVariants($productId: ID!, $variants: [ProductVariantBulkCreateInput!]!) {
          productVariantBulkCreate(product: $productId, variants: $variants) {
            count
            productVariants {
              id
              sku
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
        res = self.execute(mutation, {"productId": product_id, "variants": variants_input})
        bulk_data = res.get("data", {}).get("productVariantBulkCreate", {})
        errors = bulk_data.get("errors", [])
        if errors:
            print(f"[SaleorClient] productVariantBulkCreate notice: {errors}")
        return bulk_data.get("productVariants", [])

    def update_product_channel_listing(self, product_id, channel_id, is_published=True):
        mutation = """
        mutation UpdateProductChannelListing($id: ID!, $input: ProductChannelListingUpdateInput!) {
          productChannelListingUpdate(id: $id, input: $input) {
            product {
              id
            }
            errors {
              field
              message
              code
            }
          }
        }
        """
        input_data = {
            "updateChannels": [{
                "channelId": channel_id,
                "isPublished": is_published,
                "visibleInListings": is_published,
                "isAvailableForPurchase": is_published,
            }]
        }
        res = self.execute(mutation, {"id": product_id, "input": input_data})
        errors = res.get("data", {}).get("productChannelListingUpdate", {}).get("errors", [])
        if errors:
            print(f"[SaleorClient] productChannelListingUpdate notice: {errors}")
        return res

    def create_product_media(self, product_id, image_url, alt=""):
        mutation = """
        mutation CreateProductMedia($productId: ID!, $mediaUrl: String, $alt: String) {
          productMediaCreate(input: {product: $productId, mediaUrl: $mediaUrl, alt: $alt}) {
            media {
              id
              url
            }
            errors {
              field
              message
            }
          }
        }
        """
        res = self.execute(mutation, {"productId": product_id, "mediaUrl": image_url, "alt": alt})
        media_data = res.get("data", {}).get("productMediaCreate", {})
        return media_data.get("media")
