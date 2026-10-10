import os
import time
import json
import base64
import hmac
import hashlib
import urllib.request
import urllib.parse
from urllib.error import HTTPError, URLError

class MagentoClient:
    def __init__(self, config):
        self.base_url = config["base_url"]
        self.consumer_key = config["consumer_key"]
        self.consumer_secret = config["consumer_secret"]
        self.access_token = config["access_token"]
        self.access_token_secret = config["access_token_secret"]

    def _generate_oauth_header(self, method, url_str, query_params):
        parsed = urllib.parse.urlparse(url_str)
        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

        # Generate strictly unique nonce
        nonce = f"{int(time.time() * 1000)}_{os.urandom(12).hex()}"
        timestamp = str(int(time.time()))

        oauth_params = {
            'oauth_consumer_key': self.consumer_key,
            'oauth_nonce': nonce,
            'oauth_signature_method': 'HMAC-SHA256',
            'oauth_timestamp': timestamp,
            'oauth_token': self.access_token,
            'oauth_version': '1.0'
        }

        all_params = {}
        if parsed.query:
            for k, v in urllib.parse.parse_qsl(parsed.query, keep_blank_values=True):
                all_params[k] = v
        all_params.update(query_params)
        all_params.update(oauth_params)

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

        signing_key = f"{urllib.parse.quote(self.consumer_secret, safe='')}&{urllib.parse.quote(self.access_token_secret, safe='')}"
        signature = base64.b64encode(
            hmac.new(signing_key.encode('utf-8'), base_string.encode('utf-8'), hashlib.sha256).digest()
        ).decode('utf-8')

        oauth_params['oauth_signature'] = signature

        header_parts = [
            f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(v, safe="")}"'
            for k, v in sorted(oauth_params.items())
        ]
        return f"OAuth {', '.join(header_parts)}"

    def request(self, endpoint, query_params=None, method="GET", retries=3, backoff=2):
        if query_params is None:
            query_params = {}

        url = f"{self.base_url}/rest/V1/{endpoint.lstrip('/')}"
        if query_params:
            query_str = urllib.parse.urlencode(query_params)
            full_url = f"{url}?{query_str}"
        else:
            full_url = url

        for attempt in range(1, retries + 1):
            # Regenerate OAuth header per attempt with fresh timestamp & nonce
            auth_header = self._generate_oauth_header(method, full_url, query_params)
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) BDGY-Migration/1.0',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': auth_header
            }

            try:
                req = urllib.request.Request(full_url, headers=headers, method=method)
                with urllib.request.urlopen(req, timeout=45) as resp:
                    data = resp.read().decode('utf-8')
                    return json.loads(data)
            except HTTPError as e:
                body = e.read().decode('utf-8')
                # Retry on nonce collisions or transient errors
                if (e.code in (429, 500, 502, 503, 504) or "nonce" in body.lower()) and attempt < retries:
                    time.sleep(backoff * attempt)
                    continue
                raise RuntimeError(f"HTTP {e.code} for {full_url}: {body[:300]}")
            except (URLError, TimeoutError, Exception) as e:
                if attempt < retries:
                    time.sleep(backoff * attempt)
                    continue
                raise RuntimeError(f"Network error for {full_url}: {e}")

    def get_categories_tree(self):
        return self.request("categories")

    def get_attribute_sets(self):
        res = self.request("products/attribute-sets/sets/list", {"searchCriteria[pageSize]": "100"})
        return res.get("items", [])

    def get_attributes(self, page_size=200):
        res = self.request("products/attributes", {
            "searchCriteria[pageSize]": str(page_size),
            "searchCriteria[currentPage]": "1"
        })
        return res.get("items", [])

    def get_configurable_children(self, sku):
        quoted_sku = urllib.parse.quote(str(sku), safe='')
        try:
            return self.request(f"configurable-products/{quoted_sku}/children")
        except Exception:
            return []

    def get_configurable_options(self, sku):
        quoted_sku = urllib.parse.quote(str(sku), safe='')
        try:
            return self.request(f"configurable-products/{quoted_sku}/options/all")
        except Exception:
            return []

    def fetch_products_page(self, page=1, page_size=50):
        return self.request("products", {
            "searchCriteria[pageSize]": str(page_size),
            "searchCriteria[currentPage]": str(page)
        })

    def fetch_customers_page(self, page=1, page_size=100):
        return self.request("customers/search", {
            "searchCriteria[pageSize]": str(page_size),
            "searchCriteria[currentPage]": str(page)
        })
