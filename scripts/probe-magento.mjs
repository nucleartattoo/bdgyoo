import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// 1. Read configuration safely from ~/.ssh/.env.bdgy
function loadConfig() {
  const envPath = path.resolve(process.env.HOME, '.ssh/.env.bdgy');
  if (!fs.existsSync(envPath)) {
    throw new Error(`Config file not found at ${envPath}`);
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);

  let baseUrl = 'https://www.bdgyoo.com';
  let consumerKey = '';
  let consumerSecret = '';
  let accessToken = '';
  let accessTokenSecret = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('url ')) {
      baseUrl = line.replace('url ', '').trim();
    } else if (line.toLowerCase() === 'consumer key' && lines[i + 1]) {
      consumerKey = lines[i + 1];
    } else if (line.toLowerCase() === 'consumer secret' && lines[i + 1]) {
      consumerSecret = lines[i + 1];
    } else if (line.toLowerCase() === 'access token' && lines[i + 1]) {
      accessToken = lines[i + 1];
    } else if (line.toLowerCase() === 'access token secret' && lines[i + 1]) {
      accessTokenSecret = lines[i + 1];
    }
  }

  // Ensure trailing slash removed
  baseUrl = baseUrl.replace(/\/+$/, '');

  return { baseUrl, consumerKey, consumerSecret, accessToken, accessTokenSecret };
}

// OAuth 1.0a helper for Magento 2
function generateOAuthHeader(method, urlStr, params = {}, { consumerKey, consumerSecret, accessToken, accessTokenSecret }) {
  const urlObj = new URL(urlStr);
  const cleanUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_version: '1.0'
  };

  // Combine query params and oauth params
  const allParams = { ...oauthParams };
  urlObj.searchParams.forEach((val, key) => {
    allParams[key] = val;
  });
  Object.assign(allParams, params);

  // Encode & sort
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(allParams[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(cleanUrl),
    encodeURIComponent(paramString)
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(accessTokenSecret)}`;
  const signature = crypto.createHmac('sha256', signingKey).update(baseString).digest('base64');

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`);

  return `OAuth ${headerParts.join(', ')}`;
}

async function request(endpoint, query = {}, config, authMode = 'bearer') {
  const fullUrl = new URL(`${config.baseUrl}/rest/V1/${endpoint.replace(/^\/+/, '')}`);
  for (const [k, v] of Object.entries(query)) {
    fullUrl.searchParams.set(k, v);
  }

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (authMode === 'bearer') {
    headers['Authorization'] = `Bearer ${config.accessToken}`;
  } else {
    headers['Authorization'] = generateOAuthHeader('GET', fullUrl.toString(), {}, config);
  }

  const res = await fetch(fullUrl.toString(), {
    method: 'GET',
    headers
  });

  return { res, status: res.status, url: fullUrl.toString() };
}

async function determineAuthMode(config) {
  process.stdout.write('Checking Bearer token authentication... ');
  let { res, status } = await request('store/websites', {}, config, 'bearer');
  if (res.ok) {
    console.log('✅ Success (Bearer token supported)');
    return 'bearer';
  }

  console.log(`❌ Failed with HTTP ${status}. Trying OAuth 1.0a...`);
  const oauthTest = await request('store/websites', {}, config, 'oauth');
  if (oauthTest.res.ok) {
    console.log('✅ Success (OAuth 1.0a supported)');
    return 'oauth';
  }

  throw new Error(`Both Bearer (HTTP ${status}) and OAuth 1.0a (HTTP ${oauthTest.status}) failed.`);
}

async function fetchJson(endpoint, query = {}, config, authMode) {
  const { res, status, url } = await request(endpoint, query, config, authMode);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request to ${url} failed with status ${status}: ${text.slice(0, 200)}`);
  }
  return await res.json();
}

async function main() {
  console.log('=== Magento 2 (bdgyoo.com) Data Audit & Probe ===\n');

  const config = loadConfig();
  console.log(`Target URL: ${config.baseUrl}`);
  console.log(`Loaded credentials from ~/.ssh/.env.bdgy\n`);

  const authMode = await determineAuthMode(config);
  console.log(`Using Auth Mode: ${authMode}\n`);

  const auditReport = {
    generatedAt: new Date().toISOString(),
    sourceUrl: config.baseUrl,
    authMode,
    websites: [],
    stores: [],
    storeConfigs: [],
    categories: {},
    products: {},
    attributeSets: [],
    sampleAttributes: [],
    summary: {}
  };

  // 1. Store configs & Websites
  console.log('--- 1. Store & Currency Configuration ---');
  try {
    const websites = await fetchJson('store/websites', {}, config, authMode);
    auditReport.websites = websites;
    console.log(`Websites count: ${websites.length}`);
    websites.forEach(w => console.log(`  - [ID: ${w.id}] Code: ${w.code}, Name: ${w.name}`));

    const storeViews = await fetchJson('store/storeViews', {}, config, authMode);
    auditReport.stores = storeViews;
    console.log(`Store Views count: ${storeViews.length}`);
    storeViews.forEach(s => console.log(`  - [ID: ${s.id}] Code: ${s.code}, Name: ${s.name}, Active: ${s.is_active}`));

    const storeConfigs = await fetchJson('store/storeConfigs', {}, config, authMode);
    auditReport.storeConfigs = storeConfigs;
    if (storeConfigs.length > 0) {
      const primary = storeConfigs[0];
      console.log(`Default Base Currency: ${primary.base_currency_code}`);
      console.log(`Default Timezone: ${primary.timezone}`);
      console.log(`Weight Unit: ${primary.weight_unit}`);
      console.log(`Base Media URL: ${primary.base_media_url || 'Default'}`);
    }
  } catch (err) {
    console.error(`Store config fetch error: ${err.message}`);
  }

  // 2. Category Tree
  console.log('\n--- 2. Category Hierarchy ---');
  try {
    const categoryTree = await fetchJson('categories', {}, config, authMode);

    let totalCategories = 0;
    let maxDepth = 0;
    const categoryList = [];

    function traverseCategory(cat, depth = 0) {
      totalCategories++;
      if (depth > maxDepth) maxDepth = depth;
      categoryList.push({
        id: cat.id,
        name: cat.name,
        isActive: cat.is_active,
        level: cat.level,
        productCount: cat.product_count,
        childrenCount: cat.children_data?.length || 0
      });
      if (cat.children_data && cat.children_data.length > 0) {
        cat.children_data.forEach(child => traverseCategory(child, depth + 1));
      }
    }

    traverseCategory(categoryTree);
    console.log(`Total Categories in Tree: ${totalCategories}`);
    console.log(`Max Category Depth: ${maxDepth}`);
    console.log('Root & Top-level Categories:');
    if (categoryTree.children_data) {
      categoryTree.children_data.forEach(c => {
        console.log(`  📁 [ID: ${c.id}] ${c.name} (Active: ${c.is_active}, Products: ${c.product_count}, Subcategories: ${c.children_data?.length || 0})`);
        if (c.children_data) {
          c.children_data.slice(0, 5).forEach(sub => {
            console.log(`     └─ [ID: ${sub.id}] ${sub.name} (Active: ${sub.is_active}, Products: ${sub.product_count})`);
          });
          if (c.children_data.length > 5) {
            console.log(`     └─ ... and ${c.children_data.length - 5} more`);
          }
        }
      });
    }

    auditReport.categories = {
      total: totalCategories,
      maxDepth,
      rootName: categoryTree.name,
      rootId: categoryTree.id,
      tree: categoryTree
    };
  } catch (err) {
    console.error(`Category fetch error: ${err.message}`);
  }

  // 3. Products Audit & Distribution
  console.log('\n--- 3. Product Catalog & Types Breakdown ---');
  try {
    // Total Products
    const allProducts = await fetchJson('products', {
      'searchCriteria[pageSize]': '1',
      'searchCriteria[currentPage]': '1'
    }, config, authMode);

    const totalProducts = allProducts.total_count || 0;
    console.log(`Total Products Count: ${totalProducts}`);

    const typeBreakdown = {};
    const commonTypes = ['simple', 'configurable', 'bundle', 'grouped', 'virtual', 'downloadable'];

    for (const type of commonTypes) {
      const typeRes = await fetchJson('products', {
        'searchCriteria[filterGroups][0][filters][0][field]': 'type_id',
        'searchCriteria[filterGroups][0][filters][0][value]': type,
        'searchCriteria[pageSize]': '1'
      }, config, authMode);
      typeBreakdown[type] = typeRes.total_count || 0;
      console.log(`  - ${type.padEnd(14)}: ${typeBreakdown[type]}`);
    }

    // Status distribution
    const enabledRes = await fetchJson('products', {
      'searchCriteria[filterGroups][0][filters][0][field]': 'status',
      'searchCriteria[filterGroups][0][filters][0][value]': '1', // 1 = Enabled
      'searchCriteria[pageSize]': '1'
    }, config, authMode);
    const disabledCount = totalProducts - (enabledRes.total_count || 0);
    console.log(`Status: Enabled = ${enabledRes.total_count || 0}, Disabled = ${disabledCount}`);

    // Sample 5 products to inspect attributes & media
    const sampleProducts = await fetchJson('products', {
      'searchCriteria[pageSize]': '5',
      'searchCriteria[currentPage]': '1'
    }, config, authMode);

    let sampleMediaCount = 0;
    if (sampleProducts.items) {
      sampleProducts.items.forEach(p => {
        const media = p.media_gallery_entries || [];
        sampleMediaCount += media.length;
      });
    }

    auditReport.products = {
      total: totalProducts,
      typeBreakdown,
      enabled: enabledRes.total_count || 0,
      disabled: disabledCount,
      sampleItems: sampleProducts.items?.map(p => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        price: p.price,
        type_id: p.type_id,
        attribute_set_id: p.attribute_set_id,
        media_count: p.media_gallery_entries?.length || 0,
        custom_attributes_count: p.custom_attributes?.length || 0
      }))
    };
  } catch (err) {
    console.error(`Product catalog fetch error: ${err.message}`);
  }

  // 4. Attribute Sets
  console.log('\n--- 4. Attribute Sets & Key Attributes ---');
  try {
    const attrSets = await fetchJson('products/attribute-sets/sets/list', {
      'searchCriteria[pageSize]': '50'
    }, config, authMode);

    auditReport.attributeSets = attrSets.items || [];
    console.log(`Total Attribute Sets: ${attrSets.total_count || 0}`);
    if (attrSets.items) {
      attrSets.items.forEach(s => {
        console.log(`  - [ID: ${s.attribute_set_id}] ${s.attribute_set_name}`);
      });
    }
  } catch (err) {
    console.error(`Attribute set fetch error: ${err.message}`);
  }

  // 5. Save Audit Results
  const reportPath = path.resolve('artifacts', 'magento2-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log(`\n✅ Detailed Audit JSON saved to: ${reportPath}`);

  // Summary
  console.log('\n================ AUDIT SUMMARY ===============');
  console.log(`Source Store : ${config.baseUrl}`);
  console.log(`Websites     : ${auditReport.websites.length}`);
  console.log(`Store Views  : ${auditReport.stores.length}`);
  console.log(`Categories   : ${auditReport.categories.total || 0} (Max Depth: ${auditReport.categories.maxDepth || 0})`);
  console.log(`Total Products: ${auditReport.products.total || 0}`);
  if (auditReport.products.typeBreakdown) {
    console.log(`  Configurable: ${auditReport.products.typeBreakdown.configurable || 0}`);
    console.log(`  Simple      : ${auditReport.products.typeBreakdown.simple || 0}`);
  }
  console.log(`Attribute Sets: ${auditReport.attributeSets.length || 0}`);
  console.log('==============================================\n');
}

main().catch(err => {
  console.error('\nFatal Audit Error:', err);
  process.exit(1);
});
