# SX-0001 discovery report

**Verdict:** the legacy tree is Sun's Java Pet Store 1.3.2, a J2EE 1.3 blueprint made of 4 deployable applications, 17 shared EJB/web components, 1 in-house web framework (WAF) and product documentation. 580 files are kept (see [excluded.md](excluded.md) for the 67 dropped media/build files). 24 modules are inventoried in `risk-scores.csv`. No requirements were extracted at this stage.

All paths below are relative to `legacy-source/petstore1.3.2/`.

## 1. System shape

| Application         | Role                                                                        | Entry points                                                      | Screens                                                                    |
| ------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/apps/petstore` | Customer storefront                                                         | `*.screen` / `*.do` through the WAF front controller, `/Populate` | 19 (`docroot/WEB-INF/screendefinitions_en_US.xml`), each in en/ja/zh       |
| `src/apps/opc`      | Order Processing Center: order intake, approval, fulfilment tracking, email | 6 message-driven beans, `OPCAdminFacadeEJB`                       | 0                                                                          |
| `src/apps/supplier` | Supplier: fills purchase orders from inventory, issues invoices             | `SupplierOrderMDB`, `/RcvrRequestProcessor`, `/Populate`          | 4 (login, inventory, error, index)                                         |
| `src/apps/admin`    | Administrator console: a Swing rich client plus a small web tier            | `/AdminRequestProcessor`, `/ApplRequestProcessor`                 | 5 (web login/launch/error, client order view/approve panels, sales charts) |

End-to-end order flow (from `sun-j2ee-ri.xml` JNDI bindings and `ejb-jar.xml`):

```
petstore --jms/opc/OrderQueue--> opc.PurchaseOrderMDB
   (auto-approve or leave PENDING) --jms/opc/OrderApprovalQueue--> opc.OrderApprovalMDB
admin (manual approve/deny) ------jms/opc/OrderApprovalQueue--> opc.OrderApprovalMDB
opc.OrderApprovalMDB --jms/supplier/PurchaseOrderQueue--> supplier.SupplierOrderMDB
supplier --jms/opc/InvoiceTopic--> opc.InvoiceMDB (status SHIPPED_PART / COMPLETED)
                                 \-> opc.MailInvoiceMDB
opc.Mail*MDB --jms/opc/MailQueue--> components/mailer MailerMDB
```

Order statuses: `PENDING`, `APPROVED`, `DENIED`, `SHIPPED_PART`, `COMPLETED` (`src/components/processmanager/src/com/sun/j2ee/blueprints/processmanager/ejb/OrderStatusNames.java:51-65`).

## 2. Where the evidence is (playbook order)

1. **DDL**
   - Catalog: `src/apps/petstore/src/docroot/populate/PopulateSQL.xml` (hand-written, PK/FK/NOT NULL, two dialects: `cloudscape` and `oracle`).
   - CMP tables: `sun-j2ee-ri.xml` in petstore (Account, Customer, Profile, User, ContactInfo, Address, CreditCard, Counter), opc (PurchaseOrder, LineItem, Manager, …) and supplier (Inventory, SupplierOrder, …). These are RI-generated and carry weaker constraints than the catalog DDL.
2. **Declarative config**
   - `ejb-jar.xml` per app and component.
   - `web.xml` security constraints: petstore, admin and supplier.
   - `src/apps/petstore/src/docroot/WEB-INF/mappings.xml`: URL → action → screen, plus exception → error screen.
   - `signon-config.xml`: protected screens.
   - `CatalogDAOSQL.xml`: catalog and search SQL.
   - XSD/DTD schemas in `src/components/*/rsrc/schemas` and `src/components/xmldocuments`.
3. **Action/bean classes**
   - `petstore/controller/{web,ejb}/actions`
   - The OPC MDBs and transition delegates
   - `supplier/orderfulfillment`
   - The component EJBs
4. **JSP**
   - 26 storefront JSPs, plus ja/zh copies.
   - The ja/zh copies should be diffed against English, not extracted separately.

## 3. Risk ranking rationale

The score weights business-rule density, money/state handling, externally visible behaviour and undocumented literals.

| Module                                                                                        | Risk   | Score | Why                                                                                                                     |
| --------------------------------------------------------------------------------------------- | ------ | ----- | ----------------------------------------------------------------------------------------------------------------------- |
| apps/opc                                                                                      | high   | 10    | Owns approval thresholds, order state machine, invoice reconciliation and email triggers. Almost entirely asynchronous. |
| apps/petstore                                                                                 | high   | 9     | All 19 customer screens, order total calculation, sign-up and protected-page rules.                                     |
| components/purchaseorder                                                                      | high   | 8     | Order data model, the XML PO contract, and persistence of billing/shipping.                                             |
| apps/supplier                                                                                 | high   | 8     | Inventory decrement and partial-shipment logic (`OrderFulfillmentFacadeEJB.java:129-193`).                              |
| components/processmanager                                                                     | high   | 7     | Status vocabulary and transitions.                                                                                      |
| components/signon                                                                             | high   | 7     | Authentication and user creation for the storefront.                                                                    |
| apps/admin, components/cart, components/catalog                                               | medium | 7     | Manual approval UI, cart subtotal, and catalog/search SQL.                                                              |
| components/customer, supplierpo, creditcard, lineitem, contactinfo, mailer, xmldocuments, waf | medium | 5–6   | Data carriers with some validation. WAF owns locale switching and flow handling.                                        |
| address, uidgen, asyncsender, docs, servicelocator, encodingfilter, util/tracer               | low    | 1–4   | Plumbing or narrative documentation.                                                                                    |

## 4. Discovery findings for later stages

These are flagged here so extraction does not have to rediscover them. None is a requirement yet.

- **F1 Auto-approval thresholds are bare literals.**
  - Location: `src/apps/opc/src/com/sun/j2ee/blueprints/opc/ejb/PurchaseOrderMDB.java:183-191`.
  - US orders under 500 and Japan orders under 50000 are auto-approved.
  - Every other locale, including `zh_CN` (which the storefront supports), is never auto-approved.
  - The code comment calls the method "just a stub … for demonstrating the petstore". Expected confidence: low.
- **F2 Order total and cart subtotal use different arithmetic.**
  - The order total is summed in `float` (`src/apps/petstore/src/com/sun/j2ee/blueprints/petstore/controller/ejb/actions/OrderEJBAction.java:123-146`).
  - The cart subtotal uses `double` (`src/components/cart/src/com/sun/j2ee/blueprints/cart/ejb/ShoppingCartLocalEJB.java:133-141`).
  - Candidate `disputed` record for rounding.
- **F3 Shipping address is overwritten with the billing address on read-back.**
  - Location: `src/components/purchaseorder/src/com/sun/j2ee/blueprints/purchaseorder/ejb/PurchaseOrderEJB.java:268`, marked `// XXX`.
  - At placement, shipping and billing are captured separately (`OrderEJBAction.java:119-120`).
  - Anything downstream that reads the PO entity sees shipping equal to billing.
- **F4 Admin endpoint without an auth constraint.**
  - `/ApplRequestProcessor` is mapped (`src/apps/admin/src/docroot/WEB-INF/web.xml:64`), but only `/AdminRequestProcessor` sits under the `administrator` security constraint (lines 74-87).
  - The Swing client posts to it with a session id (`HttpPostPetStoreProxy.java:78`).
  - The intended access rule is ambiguous.
- **F5 Dead or demo code.**
  - `src/waf/src/docroot` builds a standalone `waf.war` demo (`src/waf/src/build.xml:152-185`) and is not part of the storefront UI.
  - `waf/.../ejb/action/actions/ChangeLocaleEJBAction.java` is superseded in petstore `mappings.xml` by the petstore class of the same name.
  - Rules found only there must be marked `disputed` for reachability.
- **F6 Two SQL dialects.**
  - `CatalogDAOSQL.xml` and `PopulateSQL.xml` carry both `cloudscape` and `oracle` statements.
  - Extraction should diff them. Search semantics may differ.
- **F7 Sample-data loaders are reachable.**
  - `/Populate` is served by both petstore and supplier (`tools/populate`).
  - This is operational seeding, not customer behaviour. File anything found there under `catalog-browsing` or `supplier-inventory`, and flag it.

## 5. Capabilities

`capabilities.csv` defines 11 closed keys:

- `catalog-browsing`
- `shopping-cart`
- `sign-on`
- `customer-account`
- `checkout`
- `order-approval`
- `order-fulfillment`
- `supplier-inventory`
- `customer-notifications`
- `b2b-document-exchange`
- `localization`

Admin sales charts are filed under `order-approval`, because they are part of the administrator's order-review console.

## 6. Exclusion summary

- **At extract time:** 67 files (media, fonts, build output). See [excluded.md](excluded.md).
- **From the module inventory** (kept in the tree, but not sharded for extraction):
  - `src/lib/**`: third-party JSTL TLDs and ant/base64 placeholders, 2,782 lines.
  - Build scripts: `src/build.*`, `src/apps/build.xml`, `setup.*`.
  - Licence and copyright HTML at the root.
  - They carry no product behaviour.
- **ja/zh copies:** localized JSPs (`docroot/ja`, `docroot/zh`), screendefinitions and XSLs stay inside their parent module. They are evidence for `localization`, not separate modules.

## 7. Coverage

- LOC is the raw line count of all kept files per module, including localized copies and populate data. It is not a count of logical source lines.
- Dependency edges come from `com.sun.j2ee.blueprints.*` imports (Java and JSP) plus JMS/EJB bindings in the deployment descriptors.
- Reflection-loaded classes named only in XML (e.g. `mappings.xml` action classes) are covered by the descriptor reading in section 1, not by the import edges.
