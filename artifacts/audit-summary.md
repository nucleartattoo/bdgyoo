# BDGY (bdgyoo.com) 原站数据全景普查报告

- **探测时间** : 2026-10-10 UTC
- **源站架构** : Magento 2.4.x (Kubemage Cluster)
- **API 端点** : `https://www.bdgyoo.com/rest/V1/`
- **认证方式** : OAuth 1.0a (HMAC-SHA256)
- **媒体存储** : MinIO (`https://minio.k8s.bdgyoo.com/bdgy-media/media/`)

---

## 一、核心资产统计概览

| 实体类型 | 数量 / 规模 | 关键说明 | 对应 Saleor 迁移方案 |
| :--- | :--- | :--- | :--- |
| **商品总数** | **1,049** 件 | 已启用: 1009 / 禁用: 40 | 需先建 ProductType 与 Attributes |
| ├─ **Simple 单品** | 966 件 | 绝大多数为独立单品或变体子品 | 独立单品 -> Product + 单一 Variant；作为子品则并入主商品 |
| ├─ **Configurable 变体主商品** | 81 件 | 变体数量从 2 到 72 个不等 | 映射为 Saleor Product，下挂 ProductVariants |
| └─ **Bundle 组合商品** | 2 件 | 极少数套组 | 可通过 Saleor Collections 或特定套组产品处理 |
| **商品分类** | **72** 个 | 最大树深 4 层，7 个一级大类 | Saleor Categories 树结构同步 |
| **属性集 (Attribute Sets)** | **17** 套 | Pen, Rotary Machine, Needles 等 | 映射为 Saleor Product Types |
| **媒体图片** | 依托 MinIO 存储 | 平均每件商品 3~11 张主图/变体图 | S3/MinIO 直接互通或 GraphQL 媒体导入 |
| **注册客户 (Customers)** | **9,320** 位 | 包含注册邮箱、姓名、收货地址 | Saleor Customer 账号与地址批量导入 |
| **历史订单 (Orders)** | **3,351** 单 | 历史交易记录 | 可选归档或导入 Saleor 历史订单 |

---

## 二、基础店铺配置

- **Websites** : 2 (ID 1: Main Website, ID 0: Admin)
- **Store Views** : 2 (ID 1: English - active, ID 0: Admin)
- **默认基准货币** : **USD** (建议 Saleor 默认 Channel: `channel-usd`)
- **店铺时区** : `America/Los_Angeles`
- **重量单位** : `lbs`

---

## 三、商品分类层级 (前台导航骨架)

原站共有 **7** 个核心一级类目，构成了前台的主导航体系：

1. **Tattoo Machines** (40 件商品，子分类: Wireless Tattoo Machines [33], Rotary Tattoo Machines [7])
2. **Tattoo Needles** (8 件商品，以墨囊针 Cartridge Needles 为主)
3. **Tattoo Power Supplies** (22 件商品，子分类: Wireless Tattoo Battery [15], Tattoo Power Supply [7], Foot Pedal [17])
4. **Tattoo Kits** (15 件商品，子分类: Wireless Machine Kits [14], Complete Tattoo Kits [5], Xnet Kits [3], Kit Parts [15])
5. **Tattoo Grips** (4 件商品，手柄配件，含 Metal, Disposable 等)
6. **Tattoo Medical** (6 件商品，医疗防护耗材，含 Bibs, Wraps, Barrier Film, Wipes)
7. **Tattoo Accessories** (11 件商品，配件类，含 Cables, Cases, Studio Accessories)

---

## 四、商品属性集与变体结构特征

抽样分析代表性 Configurable 商品：

- **WPS-HELLO3 (电源类)**: 4 个变体，依赖属性: `Color` (颜色), `Clip Cord Type` (接口类型: RCA/DC)
- **AB-JL (纹身笔类)**: 6 个变体，依赖属性: `Machine Size` (尺寸), `Colors` (颜色)
- **AB-JPZ (纹身针类)**: **72 个变体**，依赖多重属性矩阵:
  - `Size` (如 1003RL, 1205RS, 1209M1 等，13 个取值)
  - `Style` (5 个取值)
  - `Gauge` (针粗细: 10, 12 等，3 个取值)

**Saleor 建模对齐策略**：
- 在 Saleor 中创建对应的 `ProductType`（例如：`Tattoo Machine`, `Cartridge Needles`, `Power Supply`）。
- 将 `Color`, `Size`, `Style`, `Gauge` 等定义为 `Variant Selection` 属性，并预设允许值。
- 在前台 TanStack Storefront 中，PDP 变体选择器需支持**多属性级联筛选**与**库存联动**。
