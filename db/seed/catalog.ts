import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

import { category, categoryDetails, item, itemDetails, product, productDetails } from "../schema";

interface DetailsSeed {
  locale: string;
  name: string;
  description: string;
  image?: string;
}

interface ItemDetailsSeed extends DetailsSeed {
  listPrice: number;
  unitCost: number;
  attr1?: string;
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

// SD10: every image reference in a category is that category's own picture,
// shipped by SWHR-T-0060 under public/images/.
const CATEGORY_IMAGE: Record<string, string> = {
  BIRDS: "birds.svg",
  CATS: "cats.svg",
  DOGS: "dogs.svg",
  FISH: "fish.svg",
  REPTILES: "reptiles.svg",
};

// The legacy five categories (src/constants/navigation.ts PET_CATEGORIES).
const CATEGORIES: CategorySeed[] = [
  {
    id: "BIRDS",
    details: [
      { locale: "en_US", name: "Birds", description: "Feathered companions.", image: "birds.svg" },
      { locale: "ja_JP", name: "鳥", description: "羽を持つ仲間たち。", image: "birds.svg" },
      { locale: "zh_CN", name: "鸟类", description: "羽毛伙伴。", image: "birds.svg" },
    ],
  },
  {
    id: "CATS",
    details: [
      {
        locale: "en_US",
        name: "Cats",
        description: "Independent, affectionate cats.",
        image: "cats.svg",
      },
      { locale: "ja_JP", name: "猫", description: "自立心があり愛情深い猫。", image: "cats.svg" },
      { locale: "zh_CN", name: "猫", description: "独立而深情的猫。", image: "cats.svg" },
    ],
  },
  {
    id: "DOGS",
    details: [
      { locale: "en_US", name: "Dogs", description: "Loyal family dogs.", image: "dogs.svg" },
      { locale: "ja_JP", name: "犬", description: "忠実な家族の一員。", image: "dogs.svg" },
      { locale: "zh_CN", name: "狗", description: "忠诚的家庭犬。", image: "dogs.svg" },
    ],
  },
  {
    id: "FISH",
    details: [
      { locale: "en_US", name: "Fish", description: "Calming aquarium fish.", image: "fish.svg" },
      { locale: "ja_JP", name: "魚", description: "癒やしの観賞魚。", image: "fish.svg" },
      { locale: "zh_CN", name: "鱼类", description: "令人放松的观赏鱼。", image: "fish.svg" },
    ],
  },
  {
    id: "REPTILES",
    details: [
      {
        locale: "en_US",
        name: "Reptiles",
        description: "Low-maintenance reptiles.",
        image: "reptiles.svg",
      },
      {
        locale: "ja_JP",
        name: "爬虫類",
        description: "手間のかからない爬虫類。",
        image: "reptiles.svg",
      },
      {
        locale: "zh_CN",
        name: "爬行动物",
        description: "易于打理的爬行动物。",
        image: "reptiles.svg",
      },
    ],
  },
];

/**
 * Legacy Java Pet Store / JPetStore catalog (SD1) — the populate XML itself
 * isn't in this repository, so ids, products and items are reconstructed
 * from the public dataset and the design mockups (`mockup-item-detail.html`,
 * `mockup-category-product-listing-first-page.html`), which fix EST-6/EST-7
 * (Bulldog) and the Bulldog/Chihuahua listing order and copy.
 *
 * Every product and item image is its category's picture (SD10); every
 * en_US/ja_JP/zh_CN triple is present except the three deliberate gaps
 * called out below (Q10, SWHR-R-0014.02, SWHR-R-0014.03).
 */

// FISH
const FI_SW_01: ProductSeed = {
  id: "FI-SW-01",
  categoryId: "FISH",
  details: [
    { locale: "en_US", name: "Angelfish", description: "Colorful freshwater angelfish." },
    { locale: "ja_JP", name: "エンゼルフィッシュ", description: "色鮮やかな淡水魚。" },
    { locale: "zh_CN", name: "神仙鱼", description: "色彩缤纷的淡水鱼。" },
  ],
};
const FI_SW_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-1",
    productId: "FI-SW-01",
    details: [
      {
        locale: "en_US",
        name: "Large Angelfish",
        description: "A large, colorful angelfish.",
        listPrice: 1650,
        unitCost: 1000,
        attr1: "Large",
      },
      {
        locale: "ja_JP",
        name: "大型エンゼルフィッシュ",
        description: "大きくて色鮮やかなエンゼルフィッシュ。",
        listPrice: 1800,
        unitCost: 1100,
        attr1: "大型",
      },
      {
        locale: "zh_CN",
        name: "大号神仙鱼",
        description: "体型较大、色彩缤纷的神仙鱼。",
        listPrice: 10500,
        unitCost: 6500,
        attr1: "大号",
      },
    ],
  },
  {
    id: "EST-2",
    productId: "FI-SW-01",
    details: [
      {
        locale: "en_US",
        name: "Small Angelfish",
        description: "A small, colorful angelfish.",
        listPrice: 1650,
        unitCost: 1000,
        attr1: "Small",
      },
      {
        locale: "ja_JP",
        name: "小型エンゼルフィッシュ",
        description: "小さくて色鮮やかなエンゼルフィッシュ。",
        listPrice: 1800,
        unitCost: 1100,
        attr1: "小型",
      },
      {
        locale: "zh_CN",
        name: "小号神仙鱼",
        description: "体型较小、色彩缤纷的神仙鱼。",
        listPrice: 10500,
        unitCost: 6500,
        attr1: "小号",
      },
    ],
  },
];

const FI_SW_02: ProductSeed = {
  id: "FI-SW-02",
  categoryId: "FISH",
  details: [
    { locale: "en_US", name: "Tiger Shark", description: "Saltwater aquarium shark." },
    { locale: "ja_JP", name: "タイガーシャーク", description: "海水水槽で飼えるサメ。" },
    { locale: "zh_CN", name: "虎鲨", description: "适合海水缸的鲨鱼。" },
  ],
};
const FI_SW_02_ITEMS: ItemSeed[] = [
  {
    id: "EST-3",
    productId: "FI-SW-02",
    details: [
      {
        locale: "en_US",
        name: "Toothless Tiger Shark",
        description: "A toothless tiger shark for the home aquarium.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Toothless",
      },
      {
        locale: "ja_JP",
        name: "歯のないタイガーシャーク",
        description: "家庭用水槽向けの歯のないタイガーシャーク。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "歯のない",
      },
      {
        locale: "zh_CN",
        name: "无齿虎鲨",
        description: "适合家庭水族箱的无齿虎鲨。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "无齿",
      },
    ],
  },
];

const FI_FW_01: ProductSeed = {
  id: "FI-FW-01",
  categoryId: "FISH",
  details: [
    { locale: "en_US", name: "Koi", description: "Ornamental pond koi." },
    { locale: "ja_JP", name: "鯉", description: "観賞用の池の鯉。" },
    { locale: "zh_CN", name: "锦鲤", description: "观赏池塘锦鲤。" },
  ],
};
const FI_FW_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-4",
    productId: "FI-FW-01",
    details: [
      {
        locale: "en_US",
        name: "Spotted Koi",
        description: "A spotted ornamental koi.",
        listPrice: 1650,
        unitCost: 1000,
        attr1: "Spotted",
      },
      {
        locale: "ja_JP",
        name: "斑点のある鯉",
        description: "斑点模様の観賞用の鯉。",
        listPrice: 1800,
        unitCost: 1100,
        attr1: "斑点のある",
      },
      {
        locale: "zh_CN",
        name: "斑点锦鲤",
        description: "带斑点的观赏锦鲤。",
        listPrice: 10500,
        unitCost: 6500,
        attr1: "斑点",
      },
    ],
  },
];

const FI_FW_02: ProductSeed = {
  id: "FI-FW-02",
  categoryId: "FISH",
  details: [
    { locale: "en_US", name: "Goldfish", description: "Classic freshwater goldfish." },
    { locale: "ja_JP", name: "金魚", description: "定番の淡水金魚。" },
    { locale: "zh_CN", name: "金鱼", description: "经典的淡水金鱼。" },
  ],
};
const FI_FW_02_ITEMS: ItemSeed[] = [
  {
    id: "EST-5",
    productId: "FI-FW-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Goldfish",
        description: "A fully grown freshwater goldfish.",
        listPrice: 550,
        unitCost: 200,
        attr1: "Adult",
      },
      {
        locale: "ja_JP",
        name: "成魚金魚",
        description: "成長した淡水金魚。",
        listPrice: 600,
        unitCost: 250,
        attr1: "成魚",
      },
      {
        locale: "zh_CN",
        name: "成年金鱼",
        description: "已经成年的淡水金鱼。",
        listPrice: 3500,
        unitCost: 1300,
        attr1: "成年",
      },
    ],
  },
];

// DOGS
// Bulldog is fully localized in all three locales and fixed by the design
// mockups (item-detail: EST-6, $18.50 list / $12.00 unit cost; the DOGS
// category listing's first page: Bulldog, then Chihuahua).
const K9_BD_01: ProductSeed = {
  id: "K9-BD-01",
  categoryId: "DOGS",
  details: [
    { locale: "en_US", name: "Bulldog", description: "Friendly dog from England" },
    { locale: "ja_JP", name: "ブルドッグ", description: "人懐っこく忠実な家庭犬。" },
    { locale: "zh_CN", name: "斗牛犬", description: "友好忠诚的家庭犬。" },
  ],
};
const K9_BD_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-6",
    productId: "K9-BD-01",
    details: [
      {
        locale: "en_US",
        name: "Male Adult Bulldog",
        description: "Friendly dog from England.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Male Adult",
      },
      {
        // Q10/localization SWHR-R-0015.01: the ja_JP list price for EST-6 is
        // pinned at 2000 yen rather than a converted amount.
        locale: "ja_JP",
        name: "オス成犬ブルドッグ",
        description: "イギリス原産のフレンドリーな犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成犬",
      },
      {
        locale: "zh_CN",
        name: "成年雄性斗牛犬",
        description: "来自英国的友好犬种。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    id: "EST-7",
    productId: "K9-BD-01",
    details: [
      {
        locale: "en_US",
        name: "Female Puppy Bulldog",
        description: "Friendly dog from England.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Female Puppy",
      },
      {
        locale: "ja_JP",
        name: "メス子犬ブルドッグ",
        description: "イギリス原産のフレンドリーな子犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "メス子犬",
      },
      {
        locale: "zh_CN",
        name: "幼年雌性斗牛犬",
        description: "来自英国的友好幼犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "幼年雌性",
      },
    ],
  },
];

// Poodle is en_US only, product and items (SWHR-R-0014.02).
const K9_PO_02: ProductSeed = {
  id: "K9-PO-02",
  categoryId: "DOGS",
  details: [{ locale: "en_US", name: "Poodle", description: "Active, intelligent dog breed." }],
};
const K9_PO_02_ITEMS: ItemSeed[] = [
  {
    id: "EST-8",
    productId: "K9-PO-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Poodle",
        description: "An active, intelligent adult poodle.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult",
      },
    ],
  },
];

// Dalmation has product details in en_US and zh_CN but deliberately NOT
// ja_JP, while its item EST-9 has ja_JP item details anyway — exercises
// "item whose product lacks the locale" (SWHR-R-0014.03): EST-9 must not be
// listed in ja_JP even though it has its own ja_JP row. "Dalmation" keeps
// the legacy catalog's spelling (src/constants/navigation.ts already uses it).
const K9_DL_01: ProductSeed = {
  id: "K9-DL-01",
  categoryId: "DOGS",
  details: [
    { locale: "en_US", name: "Dalmation", description: "Energetic, spotted companion." },
    { locale: "zh_CN", name: "斑点狗", description: "精力充沛的斑点犬。" },
  ],
};
const K9_DL_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-9",
    productId: "K9-DL-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Dalmation",
        description: "An energetic, spotted adult dog.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult",
      },
      {
        locale: "ja_JP",
        name: "成犬ダルメシアン",
        description: "斑点模様の活発な犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "成犬",
      },
      {
        locale: "zh_CN",
        name: "成年斑点狗",
        description: "精力充沛的斑点犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年",
      },
    ],
  },
];

const K9_RT_01: ProductSeed = {
  id: "K9-RT-01",
  categoryId: "DOGS",
  details: [
    { locale: "en_US", name: "Golden Retriever", description: "Gentle, loyal family retriever." },
    { locale: "ja_JP", name: "ゴールデンレトリバー", description: "穏やかで忠実な家庭犬。" },
    { locale: "zh_CN", name: "金毛猎犬", description: "温顺忠诚的家庭犬。" },
  ],
};
const K9_RT_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-10",
    productId: "K9-RT-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Male Golden Retriever",
        description: "A gentle, loyal adult male retriever.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Male",
      },
      {
        locale: "ja_JP",
        name: "オス成犬ゴールデンレトリバー",
        description: "穏やかで忠実なオスの成犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成犬",
      },
      {
        locale: "zh_CN",
        name: "成年雄性金毛猎犬",
        description: "温顺忠诚的成年雄性猎犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    id: "EST-11",
    productId: "K9-RT-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Female Golden Retriever",
        description: "A gentle, loyal adult female retriever.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Female",
      },
      {
        locale: "ja_JP",
        name: "メス成犬ゴールデンレトリバー",
        description: "穏やかで忠実なメスの成犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "メス成犬",
      },
      {
        locale: "zh_CN",
        name: "成年雌性金毛猎犬",
        description: "温顺忠诚的成年雌性猎犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雌性",
      },
    ],
  },
];

const K9_RT_02: ProductSeed = {
  id: "K9-RT-02",
  categoryId: "DOGS",
  details: [
    { locale: "en_US", name: "Labrador Retriever", description: "Great hunting dog" },
    { locale: "ja_JP", name: "ラブラドールレトリバー", description: "優れた狩猟犬。" },
    { locale: "zh_CN", name: "拉布拉多猎犬", description: "优秀的猎犬。" },
  ],
};
const K9_RT_02_ITEMS: ItemSeed[] = [
  {
    id: "EST-12",
    productId: "K9-RT-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Male Labrador Retriever",
        description: "A steady, strong-swimming adult male retriever.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Male",
      },
      {
        locale: "ja_JP",
        name: "オス成犬ラブラドールレトリバー",
        description: "落ち着いた泳ぎの得意なオスの成犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成犬",
      },
      {
        locale: "zh_CN",
        name: "成年雄性拉布拉多猎犬",
        description: "沉稳且擅长游泳的成年雄性猎犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    id: "EST-13",
    productId: "K9-RT-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Female Labrador Retriever",
        description: "Gentle with children and quick to train.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Female",
      },
      {
        locale: "ja_JP",
        name: "メス成犬ラブラドールレトリバー",
        description: "子供に優しく、しつけやすいメスの成犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "メス成犬",
      },
      {
        locale: "zh_CN",
        name: "成年雌性拉布拉多猎犬",
        description: "对孩子友善且容易训练的成年雌性猎犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雌性",
      },
    ],
  },
];

const K9_CW_01: ProductSeed = {
  id: "K9-CW-01",
  categoryId: "DOGS",
  details: [
    { locale: "en_US", name: "Chihuahua", description: "Great companion dog" },
    { locale: "ja_JP", name: "チワワ", description: "優れた愛玩犬。" },
    { locale: "zh_CN", name: "吉娃娃", description: "优秀的伴侣犬。" },
  ],
};
const K9_CW_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-14",
    productId: "K9-CW-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Male Chihuahua",
        description: "A tiny, alert adult male companion dog.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Male",
      },
      {
        locale: "ja_JP",
        name: "オス成犬チワワ",
        description: "小柄で機敏なオスの成犬。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成犬",
      },
      {
        locale: "zh_CN",
        name: "成年雄性吉娃娃",
        description: "体型娇小、机警的成年雄性伴侣犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    // Q10: EST-15 has no ja_JP details, so it is invisible in the Japanese
    // store under the locale-visibility requirement.
    id: "EST-15",
    productId: "K9-CW-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Female Chihuahua",
        description: "A tiny, alert adult female companion dog.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Female",
      },
      {
        locale: "zh_CN",
        name: "成年雌性吉娃娃",
        description: "体型娇小、机警的成年雌性伴侣犬。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雌性",
      },
    ],
  },
];

// REPTILES
const RP_SN_01: ProductSeed = {
  id: "RP-SN-01",
  categoryId: "REPTILES",
  details: [
    { locale: "en_US", name: "Rattlesnake", description: "Low-maintenance venomous reptile." },
    { locale: "ja_JP", name: "ガラガラヘビ", description: "手間のかからない毒蛇。" },
    { locale: "zh_CN", name: "响尾蛇", description: "易于饲养的毒蛇。" },
  ],
};
const RP_SN_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-16",
    productId: "RP-SN-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Rattlesnake",
        description: "A fully grown, low-maintenance rattlesnake.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult",
      },
      {
        locale: "ja_JP",
        name: "成体ガラガラヘビ",
        description: "手間のかからない成体のガラガラヘビ。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "成体",
      },
      {
        locale: "zh_CN",
        name: "成年响尾蛇",
        description: "易于饲养的成年响尾蛇。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年",
      },
    ],
  },
  {
    id: "EST-17",
    productId: "RP-SN-01",
    details: [
      {
        locale: "en_US",
        name: "Juvenile Rattlesnake",
        description: "A young, low-maintenance rattlesnake.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Juvenile",
      },
      {
        locale: "ja_JP",
        name: "幼体ガラガラヘビ",
        description: "手間のかからない幼体のガラガラヘビ。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "幼体",
      },
      {
        locale: "zh_CN",
        name: "幼年响尾蛇",
        description: "易于饲养的幼年响尾蛇。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "幼年",
      },
    ],
  },
];

const RP_LI_02: ProductSeed = {
  id: "RP-LI-02",
  categoryId: "REPTILES",
  details: [
    { locale: "en_US", name: "Iguana", description: "Docile green iguana." },
    { locale: "ja_JP", name: "イグアナ", description: "おとなしい緑色のイグアナ。" },
    { locale: "zh_CN", name: "鬣蜥", description: "温顺的绿鬣蜥。" },
  ],
};
const RP_LI_02_ITEMS: ItemSeed[] = [
  {
    id: "EST-18",
    productId: "RP-LI-02",
    details: [
      {
        locale: "en_US",
        name: "Green Adult Iguana",
        description: "A docile, fully grown green iguana.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Green Adult",
      },
      {
        locale: "ja_JP",
        name: "緑成体イグアナ",
        description: "おとなしい成体の緑色のイグアナ。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "緑成体",
      },
      {
        locale: "zh_CN",
        name: "成年绿鬣蜥",
        description: "温顺的成年绿鬣蜥。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年绿色",
      },
    ],
  },
  {
    id: "EST-19",
    productId: "RP-LI-02",
    details: [
      {
        locale: "en_US",
        name: "Green Juvenile Iguana",
        description: "A docile, young green iguana.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Green Juvenile",
      },
      {
        locale: "ja_JP",
        name: "緑幼体イグアナ",
        description: "おとなしい幼体の緑色のイグアナ。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "緑幼体",
      },
      {
        locale: "zh_CN",
        name: "幼年绿鬣蜥",
        description: "温顺的幼年绿鬣蜥。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "幼年绿色",
      },
    ],
  },
];

// CATS
const FL_DSH_01: ProductSeed = {
  id: "FL-DSH-01",
  categoryId: "CATS",
  details: [
    { locale: "en_US", name: "Manx", description: "Tailless, affectionate cat." },
    { locale: "ja_JP", name: "マンクス", description: "尻尾のない愛情深い猫。" },
    { locale: "zh_CN", name: "曼岛猫", description: "无尾且深情的猫。" },
  ],
};
const FL_DSH_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-20",
    productId: "FL-DSH-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Male Manx",
        description: "A tailless, affectionate adult male cat.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Male",
      },
      {
        locale: "ja_JP",
        name: "オス成猫マンクス",
        description: "尻尾のない愛情深いオスの成猫。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成猫",
      },
      {
        locale: "zh_CN",
        name: "成年雄性曼岛猫",
        description: "无尾且深情的成年雄性猫。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    id: "EST-21",
    productId: "FL-DSH-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Female Manx",
        description: "A tailless, affectionate adult female cat.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Female",
      },
      {
        locale: "ja_JP",
        name: "メス成猫マンクス",
        description: "尻尾のない愛情深いメスの成猫。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "メス成猫",
      },
      {
        locale: "zh_CN",
        name: "成年雌性曼岛猫",
        description: "无尾且深情的成年雌性猫。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雌性",
      },
    ],
  },
];

const FL_DLH_02: ProductSeed = {
  id: "FL-DLH-02",
  categoryId: "CATS",
  details: [
    { locale: "en_US", name: "Persian", description: "Long-haired, calm cat." },
    { locale: "ja_JP", name: "ペルシャ猫", description: "長毛で穏やかな猫。" },
    { locale: "zh_CN", name: "波斯猫", description: "长毛且温顺的猫。" },
  ],
};
const FL_DLH_02_ITEMS: ItemSeed[] = [
  {
    id: "EST-22",
    productId: "FL-DLH-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Male Persian",
        description: "A long-haired, calm adult male cat.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Male",
      },
      {
        locale: "ja_JP",
        name: "オス成猫ペルシャ猫",
        description: "長毛で穏やかなオスの成猫。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成猫",
      },
      {
        locale: "zh_CN",
        name: "成年雄性波斯猫",
        description: "长毛且温顺的成年雄性猫。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    id: "EST-23",
    productId: "FL-DLH-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Female Persian",
        description: "A long-haired, calm adult female cat.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Female",
      },
      {
        locale: "ja_JP",
        name: "メス成猫ペルシャ猫",
        description: "長毛で穏やかなメスの成猫。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "メス成猫",
      },
      {
        locale: "zh_CN",
        name: "成年雌性波斯猫",
        description: "长毛且温顺的成年雌性猫。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雌性",
      },
    ],
  },
];

// BIRDS
const AV_CB_01: ProductSeed = {
  id: "AV-CB-01",
  categoryId: "BIRDS",
  details: [
    { locale: "en_US", name: "Amazon Parrot", description: "Colorful talking parrot." },
    { locale: "ja_JP", name: "アマゾンオウム", description: "色鮮やかで話す鳥。" },
    { locale: "zh_CN", name: "亚马逊鹦鹉", description: "色彩鲜艳会说话的鹦鹉。" },
  ],
};
const AV_CB_01_ITEMS: ItemSeed[] = [
  {
    id: "EST-24",
    productId: "AV-CB-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Male Amazon Parrot",
        description: "A colorful, talking adult male parrot.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Male",
      },
      {
        locale: "ja_JP",
        name: "オス成鳥アマゾンオウム",
        description: "色鮮やかで話すオスの成鳥。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成鳥",
      },
      {
        locale: "zh_CN",
        name: "成年雄性亚马逊鹦鹉",
        description: "色彩鲜艳、会说话的成年雄性鹦鹉。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    id: "EST-25",
    productId: "AV-CB-01",
    details: [
      {
        locale: "en_US",
        name: "Adult Female Amazon Parrot",
        description: "A colorful, talking adult female parrot.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Female",
      },
      {
        locale: "ja_JP",
        name: "メス成鳥アマゾンオウム",
        description: "色鮮やかで話すメスの成鳥。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "メス成鳥",
      },
      {
        locale: "zh_CN",
        name: "成年雌性亚马逊鹦鹉",
        description: "色彩鲜艳、会说话的成年雌性鹦鹉。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雌性",
      },
    ],
  },
];

const AV_SB_02: ProductSeed = {
  id: "AV-SB-02",
  categoryId: "BIRDS",
  details: [
    { locale: "en_US", name: "Finch", description: "Small, cheerful songbird." },
    { locale: "ja_JP", name: "フィンチ", description: "小さくて陽気な鳴き鳥。" },
    { locale: "zh_CN", name: "雀", description: "活泼的小型鸣禽。" },
  ],
};
const AV_SB_02_ITEMS: ItemSeed[] = [
  {
    id: "EST-26",
    productId: "AV-SB-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Male Finch",
        description: "A small, cheerful adult male songbird.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Male",
      },
      {
        locale: "ja_JP",
        name: "オス成鳥フィンチ",
        description: "小さくて陽気なオスの成鳥。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "オス成鳥",
      },
      {
        locale: "zh_CN",
        name: "成年雄性雀",
        description: "活泼的小型成年雄性鸣禽。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雄性",
      },
    ],
  },
  {
    id: "EST-27",
    productId: "AV-SB-02",
    details: [
      {
        locale: "en_US",
        name: "Adult Female Finch",
        description: "A small, cheerful adult female songbird.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Adult Female",
      },
      {
        locale: "ja_JP",
        name: "メス成鳥フィンチ",
        description: "小さくて陽気なメスの成鳥。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "メス成鳥",
      },
      {
        locale: "zh_CN",
        name: "成年雌性雀",
        description: "活泼的小型成年雌性鸣禽。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "成年雌性",
      },
    ],
  },
  {
    id: "EST-28",
    productId: "AV-SB-02",
    details: [
      {
        locale: "en_US",
        name: "Juvenile Finch",
        description: "A small, cheerful young songbird.",
        listPrice: 1850,
        unitCost: 1200,
        attr1: "Juvenile",
      },
      {
        locale: "ja_JP",
        name: "幼鳥フィンチ",
        description: "小さくて陽気な幼鳥。",
        listPrice: 2000,
        unitCost: 1300,
        attr1: "幼鳥",
      },
      {
        locale: "zh_CN",
        name: "幼年雀",
        description: "活泼的小型幼年鸣禽。",
        listPrice: 12000,
        unitCost: 7500,
        attr1: "幼年",
      },
    ],
  },
];

const PRODUCTS: ProductSeed[] = [
  FI_SW_01,
  FI_SW_02,
  FI_FW_01,
  FI_FW_02,
  K9_BD_01,
  K9_PO_02,
  K9_DL_01,
  K9_RT_01,
  K9_RT_02,
  K9_CW_01,
  RP_SN_01,
  RP_LI_02,
  FL_DSH_01,
  FL_DLH_02,
  AV_CB_01,
  AV_SB_02,
];

const ITEMS: ItemSeed[] = [
  ...FI_SW_01_ITEMS,
  ...FI_SW_02_ITEMS,
  ...FI_FW_01_ITEMS,
  ...FI_FW_02_ITEMS,
  ...K9_BD_01_ITEMS,
  ...K9_PO_02_ITEMS,
  ...K9_DL_01_ITEMS,
  ...K9_RT_01_ITEMS,
  ...K9_RT_02_ITEMS,
  ...K9_CW_01_ITEMS,
  ...RP_SN_01_ITEMS,
  ...RP_LI_02_ITEMS,
  ...FL_DSH_01_ITEMS,
  ...FL_DLH_02_ITEMS,
  ...AV_CB_01_ITEMS,
  ...AV_SB_02_ITEMS,
];

/**
 * Seeds the locale-keyed catalog (design D4, P4) if it is empty. Idempotent
 * per process — `db/client.ts` only calls this once, guarded by the same
 * "table is empty" check the users seed already uses.
 */
export function seedCatalog<TSchema extends Record<string, unknown>>(
  db: BunSQLiteDatabase<TSchema>,
): void {
  for (const { id, details } of CATEGORIES) {
    const categoryImage = CATEGORY_IMAGE[id];
    db.insert(category).values({ id }).run();
    db.insert(categoryDetails)
      .values(
        details.map((d) => ({
          categoryId: id,
          ...d,
          name: d.name.trim(),
          description: d.description.trim(),
          image: (d.image ?? categoryImage).trim(),
        })),
      )
      .run();
  }

  for (const { id, categoryId, details } of PRODUCTS) {
    const productImage = CATEGORY_IMAGE[categoryId];
    db.insert(product).values({ id, categoryId }).run();
    db.insert(productDetails)
      .values(
        details.map((d) => ({
          productId: id,
          ...d,
          name: d.name.trim(),
          description: d.description.trim(),
          image: (d.image ?? productImage).trim(),
        })),
      )
      .run();
  }

  for (const { id, productId, details } of ITEMS) {
    const categoryId = PRODUCTS.find((p) => p.id === productId)!.categoryId;
    const itemImage = CATEGORY_IMAGE[categoryId];
    db.insert(item).values({ id, productId }).run();
    db.insert(itemDetails)
      .values(
        details.map((d) => ({
          itemId: id,
          ...d,
          name: d.name.trim(),
          description: d.description.trim(),
          image: (d.image ?? itemImage).trim(),
          attr1: d.attr1?.trim(),
        })),
      )
      .run();
  }
}
