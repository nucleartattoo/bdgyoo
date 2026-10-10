# BDGY (Magento 2) 到 Saleor 迁移工程指南

本工程包含完整的 ETL 自动化迁移流水线，将原 Magento 2 电商站点（`bdgyoo.com`）全量迁移至 Saleor Headless 后台，并配套 TanStack Start 全栈前台。

---

## 一、迁移流水线架构

```
┌────────────────────────────────────────────────────────┐
│             Stage 1: Extract Catalog                   │
│   • 导出 Categories 完整分类树 (72 个节点)             │
│   • 导出 Attribute Sets (17套) 与 自定义销售属性字典    │
│   • 导出 1,049 件全量商品及其变体子品与 MinIO 媒体图片 │
│   => 落地缓存至 artifacts/extracted/*.json             │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Stage 2: Migrate Categories                │
│   • 按 Level 拓扑排序 (Parent 优先创建)               │
│   • 递归建立 Saleor Category 树                        │
│   • 记录 magento_category_id <-> saleor_category_id    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Stage 3: Migrate Attributes & Types        │
│   • 创建 Variant Selection 属性 (Color, Stroke, Size)  │
│   • 17 套 Attribute Sets 转为 Saleor ProductTypes      │
│   • 绑定变体决定属性 (hasVariants = True)              │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│             Stage 4: Migrate Products & Variants       │
│   • Configurable: 主商品 -> Saleor Product             │
│     关联子单品 -> ProductVariants (多规格变体矩阵)     │
│   • Simple: 独立单品 -> Product + 单一 Variant         │
│   • 挂载 MinIO 图片与价格/渠道                         │
└────────────────────────────────────────────────────────┘
```

---

## 二、状态管理与断点续传机制 (`artifacts/migration_state.json`)

迁移脚本内置 `StateManager`，对以下映射关系进行持久化：
- `categories`: `{ magento_id: saleor_category_id }`
- `product_types`: `{ magento_set_id: saleor_product_type_id }`
- `attributes`: `{ attr_code: saleor_attribute_id }`
- `products`: `{ magento_product_id: saleor_product_id }`
- `variants`: `{ magento_variant_id: saleor_variant_id }`

**优势**：
- **幂等性**：重复执行脚本时，已迁移的类目与商品自动跳过，无需担心数据重复。
- **容错恢复**：若遭遇网络中断或达到 API 频率限制，直接重新执行即可从断点无缝继续。

---

## 三、CLI 执行命令参考

```bash
# 1. 抽取源站数据并缓存至本地 (只读安全，不影响源站与目标站)
python3 scripts/migration/run_migration.py --extract

# 2. 模拟运行 (Dry-Run: 打印 GraphQL 变更，不实际写入 Saleor)
python3 scripts/migration/run_migration.py --migrate-categories --dry-run
python3 scripts/migration/run_migration.py --migrate-attributes --dry-run
python3 scripts/migration/run_migration.py --migrate-products --limit 5 --dry-run

# 3. 分阶段执行写入
python3 scripts/migration/run_migration.py --migrate-categories
python3 scripts/migration/run_migration.py --migrate-attributes
python3 scripts/migration/run_migration.py --migrate-products

# 4. 一键全量流水线执行
python3 scripts/migration/run_migration.py --all
```

---

## 四、目标 Saleor 环境变量配置 (`.env`)

在项目根目录创建 `.env`，填入目标 Saleor 凭据：

```bash
# 目标 Saleor GraphQL 端点
SALEOR_API_ENDPOINT=https://your-saleor-instance.com/graphql/

# Saleor App 或 Admin Token (需要 MANAGE_PRODUCTS, MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES 权限)
SALEOR_APP_TOKEN=your-saleor-app-token

# 默认销售渠道与基准货币
SALEOR_CHANNEL=channel-usd
SALEOR_CURRENCY=USD

# 默认发货仓库 ID (用于初始库存上架)
SALEOR_WAREHOUSE_ID=your-warehouse-id
```
