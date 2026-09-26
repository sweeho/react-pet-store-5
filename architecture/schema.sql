-- EXTRACTED FROM LEGACY SOURCE — evidence of what exists, not a build target. Where this disagrees with a capability delta spec, the delta spec wins.
--
-- Legacy schema of Java Pet Store 1.3.2 (legacy-source/petstore1.3.2/), reproduced
-- from the DDL the legacy application ships. This is NOT the rebuild's schema: the
-- rebuild's data model is a Drizzle schema under db/ with migrations in drizzle/,
-- designed per capability in openspec/changes/sx-<capability>/design.md.
-- Do not run this file against the rebuild's SQLite database.
--
-- Two kinds of DDL exist in the legacy tree, with different weight as evidence:
--   1. Hand-written catalog DDL (PopulateSQL.xml). Declares PK, FK and NOT NULL.
--      Highest-confidence evidence.
--   2. Container-generated CMP tables (sun-j2ee-ri.xml, J2EE RI deployment). Only
--      primary keys and a few NOT NULLs, which come from Java primitive types.
--      Relationships between them are container-managed (ejb-jar.xml
--      <relationships>) and are NOT declared as foreign keys in the DDL; they are
--      listed as comments under each table.
--
-- Three separate datasources hold these tables. The CMP table names
-- ContactInfoEJBTable, AddressEJBTable, CreditCardEJBTable and LineItemEJBTable
-- appear in more than one datasource, and each copy is a separate table:
--   jdbc/petstore/PetStoreDB  (catalog + customer + sign-on + counter)
--   jdbc/opc/OPCDB            (purchase orders + order workflow status)
--   jdbc/supplier/SupplierDB  (supplier orders + inventory)
--
-- Types are as written in the legacy DDL (Cloudscape dialect: LONGINT, REAL,
-- BOOLEAN). Paths below are relative to legacy-source/petstore1.3.2/.

-- =====================================================================
-- DATASOURCE jdbc/petstore/PetStoreDB — catalog (hand-written DDL)
-- Source: src/apps/petstore/src/docroot/populate/PopulateSQL.xml
--   cloudscape dialect: lines 45-172; oracle dialect: lines 173-300.
--   The two dialects differ in that cloudscape uses char(10) for ids and locale,
--   and char(255) for item_details.image, where oracle uses varchar. Constraints are
--   identical. The cloudscape text is reproduced here.
-- =====================================================================

-- PopulateSQL.xml:51-52
create table category (
  catid char(10) not null,
  constraint pk_category primary key (catid)
);

-- PopulateSQL.xml:66-71
create table category_details (
  catid  char(10)     not null,
  name   varchar(80)  not null,
  image  varchar(255) null,
  descn  varchar(255) null,
  locale char(10)     not null,
  constraint pk_category_details primary key (catid, locale),
  constraint fk_category_details_1 foreign key (catid) references category (catid)
);

-- PopulateSQL.xml:85-90
create table product (
  productid char(10) not null,
  catid     char(10) not null,
  constraint pk_product primary key (productid),
  constraint fk_product_1 foreign key (catid) references category (catid)
);

-- PopulateSQL.xml:104-112
create table product_details (
  productid char(10)     not null,
  locale    char(10)     not null,
  name      varchar(80)  not null,
  image     varchar(255) null,
  descn     varchar(255) null,
  constraint pk_product_details primary key (productid, locale),
  constraint fk_product_details_1 foreign key (productid) references product (productid)
);

-- PopulateSQL.xml:126-132
create table item (
  itemid    char(10) not null,
  productid char(10) not null,
  constraint pk_item primary key (itemid),
  constraint fk_item_1 foreign key (productid) references product (productid)
);

-- PopulateSQL.xml:146-161
-- Prices are per locale: there is no currency conversion, each locale row carries
-- its own listprice (shown as "List Price") and unitcost (shown as "Your Price", the
-- price charged).
create table item_details (
  itemid    char(10)      not null,
  listprice decimal(10,2) not null,
  unitcost  decimal(10,2) not null,
  locale    char(10)      not null,
  image     char(255)     not null,
  descn     varchar(255)  not null,
  attr1     varchar(80)   null,
  attr2     varchar(80)   null,
  attr3     varchar(80)   null,
  attr4     varchar(80)   null,
  attr5     varchar(80)   null,
  constraint pk_item_details primary key (itemid, locale),
  constraint fk_item_details_1 foreign key (itemid) references item (itemid)
);

-- =====================================================================
-- DATASOURCE jdbc/petstore/PetStoreDB — customer, sign-on, id counter (CMP)
-- Source: src/apps/petstore/src/sun-j2ee-ri.xml
-- Relationships: src/components/customer/src/ejb-jar.xml <relationships>
-- =====================================================================

-- sun-j2ee-ri.xml:418. Sign-on credential. Password stored and compared in plain text
-- (components/signon UserEJB); the rebuild must not repeat that (sign-on design.md).
create table "UserEJBTable" (
  "password" varchar(255),
  "userName" varchar(255),
  constraint "pk_UserEJBTabl" primary key ("userName")
);

-- sun-j2ee-ri.xml:308. One customer per user id.
--   account -> AccountEJBTable   (One-to-One, cascade-delete)
--   profile -> ProfileEJBTable   (One-to-One, cascade-delete)
create table "CustomerEJBTable" (
  "_account___PMPrimaryKey" longint,
  "_profile___PMPrimaryKey" longint,
  "userId" varchar(255),
  constraint "pk_CustomerEJBTabl" primary key ("userId")
);

-- sun-j2ee-ri.xml:267
--   contactInfo -> ContactInfoEJBTable (One-to-One, cascade-delete)
--   creditCard  -> CreditCardEJBTable  (One-to-One, cascade-delete)
create table "AccountEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_account_userId" varchar(255),
  "_contactInfo___PMPrimaryKey" longint,
  "_creditCard___PMPrimaryKey" longint,
  "status" varchar(255),
  constraint "pk_AccountEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:354
create table "ProfileEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_profile_userId" varchar(255),
  "bannerPreference" boolean not null,
  "favoriteCategory" varchar(255),
  "myListPreference" boolean not null,
  "preferredLanguage" varchar(255),
  constraint "pk_ProfileEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:222
--   address -> AddressEJBTable (One-to-One, cascade-delete)
create table "ContactInfoEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_contactInfo___PMPrimaryKey" longint,
  "_address___PMPrimaryKey" longint,
  "email" varchar(255),
  "familyName" varchar(255),
  "givenName" varchar(255),
  "telephone" varchar(255),
  constraint "pk_ContactInfoEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:165
create table "AddressEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_address___PMPrimaryKey" longint,
  "city" varchar(255),
  "country" varchar(255),
  "state" varchar(255),
  "streetName1" varchar(255),
  "streetName2" varchar(255),
  "zipCode" varchar(255),
  constraint "pk_AddressEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:112. Card number stored in plain text.
create table "CreditCardEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_creditCard___PMPrimaryKey" longint,
  "cardNumber" varchar(255),
  "cardType" varchar(255),
  "expiryDate" varchar(255),
  constraint "pk_CreditCardEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:629. Named counters used by components/uidgen to issue ids
-- (order ids are issued from here; see checkout spec "Order identifier").
create table "CounterEJBTable" (
  "counter" integer not null,
  "name" varchar(255),
  constraint "pk_CounterEJBTabl" primary key ("name")
);

-- The shopping cart has NO table: it is a stateful session bean held in memory
-- per HTTP session (components/cart ShoppingCartLocalEJB).

-- =====================================================================
-- DATASOURCE jdbc/opc/OPCDB — purchase orders and workflow status (CMP)
-- Source: src/apps/opc/src/sun-j2ee-ri.xml
-- Relationships: src/components/purchaseorder/src/ejb-jar.xml <relationships>
-- =====================================================================

-- sun-j2ee-ri.xml:653
--   contactInfo -> ContactInfoEJBTable (One-to-One, cascade-delete)
--   creditCard  -> CreditCardEJBTable  (One-to-One, cascade-delete)
--   lineItems   -> LineItemEJBTable    (One-to-Many, cascade-delete, via join table)
-- Only ONE contact is stored, although billing and shipping are captured separately
-- at checkout; read-back returns it as both (discovery finding F3,
-- components/purchaseorder PurchaseOrderEJB.java:268 "XXX").
-- poValue is REAL (float), summed in float by OrderEJBAction (finding F2).
-- poDate is epoch milliseconds.
create table "PurchaseOrderEJBTable" (
  "_contactInfo___PMPrimaryKey" longint,
  "_creditCard___PMPrimaryKey" longint,
  "poDate" longint not null,
  "poEmailId" varchar(255),
  "poId" varchar(255),
  "poLocale" varchar(255),
  "poUserId" varchar(255),
  "poValue" real not null,
  constraint "pk_PurchaseOrderEJBTabl" primary key ("poId")
);

-- sun-j2ee-ri.xml:779. Container-generated join table for PurchaseOrder.lineItems.
create table "PurchaseOrderEJB_lineItems_LineItemEJB_Table" (
  "_LineItemEJB___PMPrimaryKey" longint,
  "_PurchaseOrderEJB_poId" varchar(255),
  constraint "pk_PurchaseOrderEJB_lineItems_LineItemEJB_Tabl" primary key ("_LineItemEJB___PMPrimaryKey")
);

-- sun-j2ee-ri.xml:702
create table "LineItemEJBTable" (
  "__PMPrimaryKey" longint,
  "categoryId" varchar(255),
  "itemId" varchar(255),
  "lineNumber" varchar(255),
  "productId" varchar(255),
  "quantity" integer not null,
  "quantityShipped" integer not null,
  "unitPrice" real not null,
  constraint "pk_LineItemEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:567
--   address -> AddressEJBTable (One-to-One, cascade-delete)
create table "ContactInfoEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_contactInfo_poId" varchar(255),
  "_address___PMPrimaryKey" longint,
  "email" varchar(255),
  "familyName" varchar(255),
  "givenName" varchar(255),
  "telephone" varchar(255),
  constraint "pk_ContactInfoEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:604
create table "AddressEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_address___PMPrimaryKey" longint,
  "city" varchar(255),
  "country" varchar(255),
  "state" varchar(255),
  "streetName1" varchar(255),
  "streetName2" varchar(255),
  "zipCode" varchar(255),
  constraint "pk_AddressEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:739
create table "CreditCardEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_creditCard_poId" varchar(255),
  "cardNumber" varchar(255),
  "cardType" varchar(255),
  "expiryDate" varchar(255),
  constraint "pk_CreditCardEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:471. Per-order workflow status (components/processmanager).
-- Values: PENDING, APPROVED, DENIED, SHIPPED_PART, COMPLETED
-- (src/components/processmanager/src/com/sun/j2ee/blueprints/processmanager/ejb/OrderStatusNames.java:51-65).
-- No CHECK constraint enforces the vocabulary. Keyed by the same id as poId, with no
-- declared relationship to PurchaseOrderEJBTable.
create table "ManagerEJBTable" (
  "orderId" varchar(255),
  "status" varchar(255),
  constraint "pk_ManagerEJBTabl" primary key ("orderId")
);

-- =====================================================================
-- DATASOURCE jdbc/supplier/SupplierDB — supplier orders and inventory (CMP)
-- Source: src/apps/supplier/src/sun-j2ee-ri.xml
-- Relationships: src/components/supplierpo/src/ejb-jar.xml <relationships>
-- =====================================================================

-- sun-j2ee-ri.xml:189
--   contactInfo -> ContactInfoEJBTable (One-to-One, cascade-delete)
--   lineItems   -> LineItemEJBTable    (One-to-Many, cascade-delete, via join table)
-- poId is the same order id the OPC issued; there is no cross-datasource FK.
create table "SupplierOrderEJBTable" (
  "_contactInfo___PMPrimaryKey" longint,
  "poDate" longint not null,
  "poId" varchar(255),
  "poStatus" varchar(255),
  constraint "pk_SupplierOrderEJBTabl" primary key ("poId")
);

-- sun-j2ee-ri.xml:280
create table "SupplierOrderEJB_lineItems_LineItemEJB_Table" (
  "_LineItemEJB___PMPrimaryKey" longint,
  "_SupplierOrderEJB_poId" varchar(255),
  constraint "pk_SupplierOrderEJB_lineItems_LineItemEJB_Tabl" primary key ("_LineItemEJB___PMPrimaryKey")
);

-- sun-j2ee-ri.xml:107
create table "LineItemEJBTable" (
  "__PMPrimaryKey" longint,
  "categoryId" varchar(255),
  "itemId" varchar(255),
  "lineNumber" varchar(255),
  "productId" varchar(255),
  "quantity" integer not null,
  "quantityShipped" integer not null,
  "unitPrice" real not null,
  constraint "pk_LineItemEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:241
--   address -> AddressEJBTable (One-to-One, cascade-delete)
create table "ContactInfoEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_contactInfo_poId" varchar(255),
  "_address___PMPrimaryKey" longint,
  "email" varchar(255),
  "familyName" varchar(255),
  "givenName" varchar(255),
  "telephone" varchar(255),
  constraint "pk_ContactInfoEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:144
create table "AddressEJBTable" (
  "__PMPrimaryKey" longint,
  "__reverse_address___PMPrimaryKey" longint,
  "city" varchar(255),
  "country" varchar(255),
  "state" varchar(255),
  "streetName1" varchar(255),
  "streetName2" varchar(255),
  "zipCode" varchar(255),
  constraint "pk_AddressEJBTabl" primary key ("__PMPrimaryKey")
);

-- sun-j2ee-ri.xml:396. Supplier stock per catalog item id. No CHECK constraint;
-- the non-negative rule lives only in the update handler (supplier-inventory spec).
-- itemId matches catalog item.itemid by value only (different datasource, no FK).
create table "InventoryEJBTable" (
  "itemId" varchar(255),
  "quantity" integer not null,
  constraint "pk_InventoryEJBTabl" primary key ("itemId")
);
