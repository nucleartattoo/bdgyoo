#!/usr/bin/env python3
"""
End-to-End Checkout to Order Generation Test Script for Saleor GraphQL.

Executes the complete lifecycle:
1. Query published purchasable variant from default-channel
2. checkoutCreate (initialize checkout session)
3. checkoutShippingAddressUpdate (set US delivery address)
4. checkoutBillingAddressUpdate (set billing address)
5. checkoutDeliveryMethodUpdate (select shipping method e.g. UPS Ground)
6. transactionCreate (record payment transaction)
7. checkoutComplete (convert checkout to official Saleor Order)
"""

import sys
import json
from scripts.migration.config import load_saleor_config
from scripts.migration.saleor_client import SaleorClient

def run_e2e_checkout():
    print("=" * 60)
    print(" 🚀 SALEOR END-TO-END CHECKOUT & ORDER GENERATION PIPELINE")
    print("=" * 60)

    cfg = load_saleor_config()
    client = SaleorClient(cfg)
    channel = cfg.get("channel", "default-channel")

    print(f"Connecting to: {cfg['api_endpoint']}")
    print(f"Channel: {channel}\n")

    # Step 1: Query an available product variant
    print("[Step 1/7] Discovering purchasable variant in channel...")
    find_query = """
    query GetAvailableVariants($channel: String!) {
      products(first: 10, channel: $channel) {
        edges {
          node {
            id
            name
            isAvailableForPurchase
            variants {
              id
              name
              sku
              quantityAvailable
              pricing {
                price {
                  gross {
                    amount
                    currency
                  }
                }
              }
            }
          }
        }
      }
    }
    """
    res = client.execute(find_query, {"channel": channel})
    products = res.get("data", {}).get("products", {}).get("edges", [])

    target_variant = None
    target_product_name = ""
    for p in products:
        node = p["node"]
        for v in node.get("variants", []):
            qty = v.get("quantityAvailable")
            if qty is not None and qty > 0:
                target_variant = v
                target_product_name = node["name"]
                break
        if target_variant:
            break

    if not target_variant:
        print("❌ No in-stock variant found in channel.")
        sys.exit(1)

    price_info = target_variant.get("pricing", {}).get("price", {}).get("gross", {})
    unit_price = price_info.get("amount", 0.0)
    currency = price_info.get("currency", "USD")

    print(f"  Selected Product: {target_product_name}")
    print(f"  Variant: {target_variant['name']} ({target_variant['sku']})")
    print(f"  Variant ID: {target_variant['id']}")
    print(f"  Unit Price: {unit_price} {currency}")
    print(f"  Available Stock: {target_variant['quantityAvailable']} units\n")

    # Step 2: Create Checkout
    print("[Step 2/7] Dispatching checkoutCreate mutation...")
    create_mutation = """
    mutation CreateCheckout($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          token
          totalPrice {
            gross {
              amount
              currency
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
    create_res = client.execute(create_mutation, {
        "input": {
            "channel": channel,
            "email": "test-buyer@bdgyoo.com",
            "lines": [
                {"variantId": target_variant["id"], "quantity": 1}
            ]
        }
    })
    c_data = create_res.get("data", {}).get("checkoutCreate", {})
    if c_data.get("errors"):
        print(f"❌ checkoutCreate failed: {c_data['errors']}")
        sys.exit(1)

    checkout = c_data["checkout"]
    checkout_id = checkout["id"]
    checkout_token = checkout["token"]
    print(f"  ✅ Checkout Created! ID: {checkout_id}")
    print(f"     Token: {checkout_token}")
    print(f"     Subtotal: {checkout['totalPrice']['gross']['amount']} {currency}\n")

    # Step 3: Set Shipping Address
    print("[Step 3/7] Setting Shipping Address (checkoutShippingAddressUpdate)...")
    ship_addr_mutation = """
    mutation SetShippingAddress($id: ID!, $shippingAddress: AddressInput!) {
      checkoutShippingAddressUpdate(id: $id, shippingAddress: $shippingAddress) {
        checkout {
          id
          shippingAddress {
            streetAddress1
            city
            countryArea
            postalCode
            country {
              code
            }
          }
          availableShippingMethods {
            id
            name
            price {
              amount
              currency
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
    ship_addr_res = client.execute(ship_addr_mutation, {
        "id": checkout_id,
        "shippingAddress": {
            "firstName": "Austin",
            "lastName": "Tattooist",
            "streetAddress1": "742 Evergreen Terrace",
            "city": "Los Angeles",
            "countryArea": "CA",
            "postalCode": "90001",
            "country": "US",
            "phone": "+12135550199"
        }
    })
    s_data = ship_addr_res.get("data", {}).get("checkoutShippingAddressUpdate", {})
    if s_data.get("errors"):
        print(f"❌ Setting shipping address failed: {s_data['errors']}")
        sys.exit(1)

    avail_methods = s_data["checkout"].get("availableShippingMethods", [])
    print(f"  ✅ Shipping Address Saved.")
    print(f"     Available Shipping Methods: {len(avail_methods)} option(s) found.")
    for m in avail_methods:
        print(f"       - [{m['id']}] {m['name']} ({m['price']['amount']} {m['price']['currency']})")
    print()

    # Step 4: Set Billing Address
    print("[Step 4/7] Setting Billing Address (checkoutBillingAddressUpdate)...")
    bill_addr_mutation = """
    mutation SetBillingAddress($id: ID!, $billingAddress: AddressInput!) {
      checkoutBillingAddressUpdate(id: $id, billingAddress: $billingAddress) {
        checkout {
          id
          billingAddress {
            streetAddress1
            city
            postalCode
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
    bill_addr_res = client.execute(bill_addr_mutation, {
        "id": checkout_id,
        "billingAddress": {
            "firstName": "Austin",
            "lastName": "Tattooist",
            "streetAddress1": "742 Evergreen Terrace",
            "city": "Los Angeles",
            "countryArea": "CA",
            "postalCode": "90001",
            "country": "US",
            "phone": "+12135550199"
        }
    })
    b_data = bill_addr_res.get("data", {}).get("checkoutBillingAddressUpdate", {})
    if b_data.get("errors"):
        print(f"❌ Setting billing address failed: {b_data['errors']}")
        sys.exit(1)
    print("  ✅ Billing Address Saved.\n")

    # Step 5: Select Shipping Delivery Method
    if not avail_methods:
        print("❌ No shipping methods available for this address.")
        sys.exit(1)

    selected_method = avail_methods[0]
    print(f"[Step 5/7] Selecting Delivery Method '{selected_method['name']}'...")
    delivery_mutation = """
    mutation SetDeliveryMethod($id: ID!, $deliveryMethodId: ID!) {
      checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $deliveryMethodId) {
        checkout {
          id
          deliveryMethod {
            ... on ShippingMethod {
              id
              name
              price {
                amount
                currency
              }
            }
          }
          totalPrice {
            gross {
              amount
              currency
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
    deliv_res = client.execute(delivery_mutation, {
        "id": checkout_id,
        "deliveryMethodId": selected_method["id"]
    })
    d_data = deliv_res.get("data", {}).get("checkoutDeliveryMethodUpdate", {})
    if d_data.get("errors"):
        print(f"❌ Setting delivery method failed: {d_data['errors']}")
        sys.exit(1)

    total_amount = d_data["checkout"]["totalPrice"]["gross"]["amount"]
    print(f"  ✅ Delivery Method Bound: {selected_method['name']}")
    print(f"     Grand Total: {total_amount} {currency}\n")

    # Step 6: Process Payment Transaction
    print(f"[Step 6/7] Authorizing & Charging Payment for {total_amount} {currency}...")
    trans_mutation = """
    mutation CreateTransaction($id: ID!, $transaction: TransactionCreateInput!) {
      transactionCreate(id: $id, transaction: $transaction) {
        transaction {
          id
          pspReference
          chargedAmount {
            amount
            currency
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
    trans_res = client.execute(trans_mutation, {
        "id": checkout_id,
        "transaction": {
            "name": "BDGY Credit Card Payment",
            "message": "Approved test authorization",
            "pspReference": f"tx_{checkout_token[:12]}",
            "amountCharged": {
                "amount": total_amount,
                "currency": currency
            }
        }
    })
    t_data = trans_res.get("data", {}).get("transactionCreate", {})
    if t_data.get("errors"):
        print(f"❌ Payment transaction failed: {t_data['errors']}")
        sys.exit(1)

    tx = t_data["transaction"]
    print(f"  ✅ Payment Settled! Transaction ID: {tx['id']}")
    print(f"     PSP Reference: {tx['pspReference']}")
    print(f"     Charged: {tx['chargedAmount']['amount']} {tx['chargedAmount']['currency']}\n")

    # Step 7: Complete Checkout & Create Order
    print("[Step 7/7] Completing Checkout (checkoutComplete)...")
    complete_mutation = """
    mutation CompleteCheckout($id: ID!) {
      checkoutComplete(id: $id) {
        order {
          id
          number
          status
          created
          total {
            gross {
              amount
              currency
            }
          }
          lines {
            id
            productName
            variantName
            quantity
            totalPrice {
              gross {
                amount
                currency
              }
            }
          }
          shippingAddress {
            streetAddress1
            city
            postalCode
            country {
              code
            }
          }
          deliveryMethod {
            ... on ShippingMethod {
              id
              name
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
    comp_res = client.execute(complete_mutation, {"id": checkout_id})
    comp_data = comp_res.get("data", {}).get("checkoutComplete", {})
    if comp_data.get("errors"):
        print(f"❌ checkoutComplete failed: {comp_data['errors']}")
        sys.exit(1)

    order = comp_data.get("order")
    if not order:
        print("❌ Order was not returned by Saleor.")
        sys.exit(1)

    print("=" * 60)
    print(" 🎉 SUCCESS! OFFICIAL SALEOR ORDER GENERATED")
    print("=" * 60)
    print(f"  Order Number:    #{order['number']}")
    print(f"  Order ID:        {order['id']}")
    print(f"  Order Status:    {order['status']}")
    print(f"  Total Amount:    {order['total']['gross']['amount']} {order['total']['gross']['currency']}")
    print(f"  Ship To:         {order['shippingAddress']['streetAddress1']}, {order['shippingAddress']['city']} {order['shippingAddress']['postalCode']}")
    print(f"  Shipping Method: {order['deliveryMethod']['name']}")
    print("  Line Items:")
    for item in order["lines"]:
        print(f"    - {item['quantity']}x {item['productName']} ({item['variantName']}) -> {item['totalPrice']['gross']['amount']} {item['totalPrice']['gross']['currency']}")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_checkout()
