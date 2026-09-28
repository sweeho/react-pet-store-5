import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import { category, categoryDetails, item, itemDetails, product, productDetails } from "../schema";

interface DetailsSeed {
  locale: string;
  name: string;
  description: string;
  image?: string;
}

interface ItemDetailsSeed extends DetailsSeed {
  image: string;
  listPrice: number;
  unitCost: number;
}

interface CategorySeed {
  id: string;
  details: DetailsSeed[];
}

interface ProductSeed {
  id: string;
  categoryId: string;
  details: DetailsSeed[];
}

interface ItemSeed {
  id: string;
  productId: string;
  details: ItemDetailsSeed[];
}

// The legacy five categories (src/constants/navigation.ts PET_CATEGORIES).
const CATEGORIES: CategorySeed[] = [
  {
    id: "BIRDS",
    details: [
      { locale: "en_US", name: "Birds", description: "Feathered companions." },
      { locale: "ja_JP", name: "鳥", description: "羽を持つ仲間たち。" },
      { locale: "zh_CN", name: "鸟类", description: "羽毛伙伴。" },
    ],
  },
  {
    id: "CATS",
    details: [
      { locale: "en_US", name: "Cats", description: "Independent, affectionate cats." },
      { locale: "ja_JP", name: "猫", description: "自立心があり愛情深い猫。" },
      { locale: "zh_CN", name: "猫", description: "独立而深情的猫。" },
    ],
  },
  {
    id: "DOGS",
    details: [
      { locale: "en_US", name: "Dogs", description: "Loyal family dogs." },
      { locale: "ja_JP", name: "犬", description: "忠実な家族の一員。" },
      { locale: "zh_CN", name: "狗", description: "忠诚的家庭犬。" },
    ],
  },
  {
    id: "FISH",
    details: [
      { locale: "en_US", name: "Fish", description: "Calming aquarium fish." },
      { locale: "ja_JP", name: "魚", description: "癒やしの観賞魚。" },
      { locale: "zh_CN", name: "鱼类", description: "令人放松的观赏鱼。" },
    ],
  },
  {
    id: "REPTILES",
    details: [
      { locale: "en_US", name: "Reptiles", description: "Low-maintenance reptiles." },
      { locale: "ja_JP", name: "爬虫類", description: "手間のかからない爬虫類。" },
      { locale: "zh_CN", name: "爬行动物", description: "易于打理的爬行动物。" },
    ],
  },
];

// BULLDOG is fully localized in all three locales (PLAN step 2).
const BULLDOG: ProductSeed = {
  id: "BULLDOG",
  categoryId: "DOGS",
  details: [
    { locale: "en_US", name: "Bulldog", description: "Friendly, loyal family dog." },
    { locale: "ja_JP", name: "ブルドッグ", description: "人懐っこく忠実な家庭犬。" },
    { locale: "zh_CN", name: "斗牛犬", description: "友好忠诚的家庭犬。" },
  ],
};

const BULLDOG_ITEMS: ItemSeed[] = [
  {
    id: "EST-6",
    productId: "BULLDOG",
    details: [
      {
        locale: "en_US",
        name: "Male Adult Bulldog",
        description: "Friendly dog from England",
        image: "bulldog.gif",
        listPrice: 1850,
        unitCost: 1850,
      },
      {
        locale: "ja_JP",
        name: "オス成犬ブルドッグ",
        description: "イギリス原産のフレンドリーな犬",
        image: "bulldog.gif",
        listPrice: 2000,
        unitCost: 2000,
      },
      {
        locale: "zh_CN",
        name: "成年雄性斗牛犬",
        description: "来自英国的友好犬种",
        image: "bulldog.gif",
        listPrice: 12000,
        unitCost: 12000,
      },
    ],
  },
  {
    id: "EST-7",
    productId: "BULLDOG",
    details: [
      {
        locale: "en_US",
        name: "Female Puppy Bulldog",
        description: "Friendly puppy from England",
        image: "bulldog.gif",
        listPrice: 1850,
        unitCost: 1850,
      },
      {
        locale: "ja_JP",
        name: "メス子犬ブルドッグ",
        description: "イギリス原産のフレンドリーな子犬",
        image: "bulldog.gif",
        listPrice: 2000,
        unitCost: 2000,
      },
      {
        locale: "zh_CN",
        name: "幼年雌性斗牛犬",
        description: "来自英国的友好幼犬",
        image: "bulldog.gif",
        listPrice: 12000,
        unitCost: 12000,
      },
    ],
  },
];

// POODLE has details ONLY in en_US (no ja_JP, no zh_CN row at all) — exercises
// "no details in the requested locale" (SWHR-R-0014.02) at the product level.
const POODLE: ProductSeed = {
  id: "POODLE",
  categoryId: "DOGS",
  details: [{ locale: "en_US", name: "Poodle", description: "Active, intelligent dog breed." }],
};

const POODLE_ITEMS: ItemSeed[] = [
  {
    id: "EST-8",
    productId: "POODLE",
    details: [
      {
        locale: "en_US",
        name: "Adult Poodle",
        description: "Smart, active companion",
        image: "poodle.gif",
        listPrice: 1850,
        unitCost: 1850,
      },
    ],
  },
];

// DALMATIAN has product details in en_US and zh_CN but deliberately NOT
// ja_JP, while its item EST-9 has ja_JP item details anyway — exercises
// "item whose product lacks the locale" (SWHR-R-0014.03): EST-9 must not be
// listed in ja_JP even though it has its own ja_JP row.
const DALMATIAN: ProductSeed = {
  id: "DALMATIAN",
  categoryId: "DOGS",
  details: [
    { locale: "en_US", name: "Dalmatian", description: "Energetic, spotted companion." },
    { locale: "zh_CN", name: "斑点狗", description: "精力充沛的斑点犬。" },
  ],
};

const DALMATIAN_ITEMS: ItemSeed[] = [
  {
    id: "EST-9",
    productId: "DALMATIAN",
    details: [
      {
        locale: "en_US",
        name: "Adult Dalmatian",
        description: "Energetic, spotted dog",
        image: "dalmatian.gif",
        listPrice: 1850,
        unitCost: 1850,
      },
      {
        locale: "ja_JP",
        name: "成犬ダルメシアン",
        description: "斑点模様の活発な犬",
        image: "dalmatian.gif",
        listPrice: 2000,
        unitCost: 2000,
      },
      {
        locale: "zh_CN",
        name: "成年斑点狗",
        description: "精力充沛的斑点犬",
        image: "dalmatian.gif",
        listPrice: 12000,
        unitCost: 12000,
      },
    ],
  },
];

const PRODUCTS: ProductSeed[] = [BULLDOG, POODLE, DALMATIAN];
const ITEMS: ItemSeed[] = [...BULLDOG_ITEMS, ...POODLE_ITEMS, ...DALMATIAN_ITEMS];

/**
 * Seeds the locale-keyed catalog (design D4, P4) if it is empty. Idempotent
 * per process — `db/client.ts` only calls this once, guarded by the same
 * "table is empty" check the users seed already uses.
 */
export function seedCatalog<TSchema extends Record<string, unknown>>(
  db: BunSQLiteDatabase<TSchema>,
): void {
  for (const { id, details } of CATEGORIES) {
    db.insert(category).values({ id }).run();
    db.insert(categoryDetails)
      .values(details.map((d) => ({ categoryId: id, ...d })))
      .run();
  }

  for (const { id, categoryId, details } of PRODUCTS) {
    db.insert(product).values({ id, categoryId }).run();
    db.insert(productDetails)
      .values(details.map((d) => ({ productId: id, ...d })))
      .run();
  }

  for (const { id, productId, details } of ITEMS) {
    db.insert(item).values({ id, productId }).run();
    db.insert(itemDetails)
      .values(details.map((d) => ({ itemId: id, ...d })))
      .run();
  }
}
