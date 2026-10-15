#!/usr/bin/env python3
import urllib.request
import json

TOKEN = 'Se9kT7tiDTO9buCbGYxTNhA4tvnuwg'
ENDPOINT = 'http://localhost:8003/graphql/'
CHANNEL = 'bdgy-channel'

def req(query, variables=None):
    r = urllib.request.Request(
        ENDPOINT,
        data=json.dumps({'query': query, 'variables': variables or {}}).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {TOKEN}'}
    )
    try:
        res = urllib.request.urlopen(r)
        return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print("HTTP ERROR:", e.code, e.read().decode('utf-8'))
        raise

def main():
    print("=" * 60)
    print("🚀 TESTING LIVE CHECKOUT PIPELINE ON: bdgy-channel")
    print("=" * 60)

    # 1. Discover variant in bdgy-channel
    disc = req('''
    query Discover($channel: String!) {
      products(first: 1, channel: $channel) {
        edges {
          node {
            name
            variants {
              id
              name
            }
          }
        }
      }
    }
    ''', {'channel': CHANNEL})

    variant = disc['data']['products']['edges'][0]['node']['variants'][0]
    print(f"[1/6] Discovered variant in bdgy-channel: {variant['name']} ({variant['id']})")

    # 2. checkoutCreate
    c_res = req('''
    mutation CreateCheckout($channel: String!, $lines: [CheckoutLineInput!]!) {
      checkoutCreate(input: {
        channel: $channel
        email: "bdgy-studio@bdgyoo.com"
        lines: $lines
      }) {
        checkout {
          id
          totalPrice { gross { amount currency } }
        }
        errors { field message }
      }
    }
    ''', {'channel': CHANNEL, 'lines': [{'variantId': variant['id'], 'quantity': 1}]})

    checkout = c_res['data']['checkoutCreate']['checkout']
    checkout_id = checkout['id']
    subtotal = checkout['totalPrice']['gross']['amount']
    print(f"[2/6] Checkout created: {checkout_id}, Subtotal: ${subtotal}")

    # 3. checkoutShippingAddressUpdate & checkoutBillingAddressUpdate
    addr_payload = {
      'firstName': 'BDGY', 'lastName': 'Tattooist',
      'streetAddress1': '742 Evergreen Terrace', 'city': 'Los Angeles',
      'countryArea': 'CA', 'postalCode': '90001', 'country': 'US', 'phone': '+12135550199'
    }
    ship_res = req('''
    mutation SetShipping($id: ID!, $addr: AddressInput!) {
      checkoutShippingAddressUpdate(id: $id, shippingAddress: $addr) {
        checkout {
          id
          availableShippingMethods { id name price { amount } }
        }
        errors { field message }
      }
    }
    ''', {
      'id': checkout_id,
      'addr': addr_payload
    })

    req('''
    mutation SetBilling($id: ID!, $addr: AddressInput!) {
      checkoutBillingAddressUpdate(id: $id, billingAddress: $addr) {
        checkout { id }
        errors { field message }
      }
    }
    ''', {
      'id': checkout_id,
      'addr': addr_payload
    })

    methods = ship_res['data']['checkoutShippingAddressUpdate']['checkout']['availableShippingMethods']
    print(f"[3/6] Available Shipping Methods in bdgy-channel: {[m['name'] for m in methods]}")
    chosen_method = methods[0]

    # 4. Delivery method
    deliv_res = req('''
    mutation SetDelivery($id: ID!, $methodId: ID!) {
      checkoutDeliveryMethodUpdate(id: $id, deliveryMethodId: $methodId) {
        checkout {
          id
          totalPrice { gross { amount currency } }
        }
        errors { field message }
      }
    }
    ''', {'id': checkout_id, 'methodId': chosen_method['id']})
    total_amount = deliv_res['data']['checkoutDeliveryMethodUpdate']['checkout']['totalPrice']['gross']['amount']
    print(f"[4/6] Delivery bound ({chosen_method['name']}), Total with shipping: ${total_amount}")

    # 5. transactionCreate
    tx_res = req('''
    mutation Pay($id: ID!, $transaction: TransactionCreateInput!) {
      transactionCreate(id: $id, transaction: $transaction) {
        transaction { id pspReference }
        errors { field message code }
      }
    }
    ''', {
      'id': checkout_id,
      'transaction': {
        'name': 'BDGY Studio Credit Card',
        'message': 'Authorized & Charged',
        'pspReference': 'tx_bdgy_channel_test',
        'amountCharged': {
          'amount': total_amount,
          'currency': 'USD'
        }
      }
    })
    print(f"[5/6] Payment transaction settled via Saleor Transaction API")

    # 6. checkoutComplete
    comp_res = req('''
    mutation Complete($id: ID!) {
      checkoutComplete(id: $id) {
        order {
          id
          number
          status
          channel { slug name }
          total { gross { amount currency } }
        }
        errors { field message code }
      }
    }
    ''', {'id': checkout_id})

    payload = comp_res.get('data', {}).get('checkoutComplete', {})
    if payload.get('errors'):
        print(f"❌ checkoutComplete errors: {payload['errors']}")
        return

    order = payload.get('order')
    if not order:
        print(f"❌ No order returned: {comp_res}")
        return

    print(f"[6/6] 🎉 OFFICIAL ORDER GENERATED:")
    print(f"      Order Number: #{order['number']}")
    print(f"      Channel: {order['channel']['name']} ({order['channel']['slug']})")
    print(f"      Status: {order['status']}")
    print(f"      Total Settled: ${order['total']['gross']['amount']} {order['total']['gross']['currency']}")

if __name__ == '__main__':
    main()
