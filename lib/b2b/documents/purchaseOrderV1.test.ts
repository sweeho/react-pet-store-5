import { describe, expect, it } from "vitest";

import { readPurchaseOrderV1 } from "./purchaseOrderV1";

const V1_XML = `<?xml version="1.0" encoding="UTF-8"?>
<PurchaseOrder>
  <OrderId>1001</OrderId>
  <UserId>j2ee</UserId>
  <EmailId>j2ee@example.com</EmailId>
  <OrderDate>2002-03-15</OrderDate>
  <ShipToAddress>
    <FirstName>Jane</FirstName>
    <LastName>Doe</LastName>
    <Street>1 Main St</Street>
    <City>Springfield</City>
    <State>IL</State>
    <Country>USA</Country>
    <ZipCode>62701</ZipCode>
  </ShipToAddress>
  <BillToAddress>
    <FirstName>John</FirstName>
    <LastName>Doe</LastName>
    <Street>2 Elm St</Street>
    <City>Shelbyville</City>
    <State>IL</State>
    <Country>USA</Country>
    <ZipCode>62565</ZipCode>
  </BillToAddress>
  <TotalPrice>39.98</TotalPrice>
  <CreditCard>
    <CardNumber>4111111111111111</CardNumber>
    <CardType>Visa</CardType>
    <ExpiryDate>12/03</ExpiryDate>
  </CreditCard>
  <LineItem>
    <CategoryId>cat</CategoryId>
    <ProductId>prod</ProductId>
    <ItemId>item1</ItemId>
    <LineNum>1</LineNum>
    <Quantity>1</Quantity>
    <UnitPrice>19.99</UnitPrice>
  </LineItem>
  <LineItem>
    <CategoryId>cat</CategoryId>
    <ProductId>prod</ProductId>
    <ItemId>item2</ItemId>
    <LineNum>2</LineNum>
    <Quantity>1</Quantity>
    <UnitPrice>19.99</UnitPrice>
  </LineItem>
</PurchaseOrder>
`;

describe("readPurchaseOrderV1", () => {
  it("[SWHR-C-0098] reads a version 1.0 purchase order with two line items and default locale", async () => {
    const read = await readPurchaseOrderV1(V1_XML, { log: () => {} });

    expect(read.locale).toBe("en_US");
    expect(read.orderId).toBe("1001");
    expect(read.shippingInfo).toEqual({
      familyName: "Doe",
      givenName: "Jane",
      address: {
        streetName1: "1 Main St",
        streetName2: null,
        city: "Springfield",
        state: "IL",
        zipCode: "62701",
        country: "USA",
      },
      email: "",
      phone: "",
    });
    expect(read.billingInfo).toEqual({
      familyName: "Doe",
      givenName: "John",
      address: {
        streetName1: "2 Elm St",
        streetName2: null,
        city: "Shelbyville",
        state: "IL",
        zipCode: "62565",
        country: "USA",
      },
      email: "",
      phone: "",
    });
    expect(read.creditCard).toEqual({
      cardNumber: "4111111111111111",
      cardType: "Visa",
      expiryDate: "12/03",
    });
    expect(read.lineItems).toHaveLength(2);
    expect(read.lineItems[0]).toEqual({
      categoryId: "cat",
      productId: "prod",
      itemId: "item1",
      lineNum: 1,
      quantity: 1,
      unitPrice: "19.99",
    });
    expect(read.lineItems[1]).toEqual({
      categoryId: "cat",
      productId: "prod",
      itemId: "item2",
      lineNum: 2,
      quantity: 1,
      unitPrice: "19.99",
    });
  });

  it("reads an explicit locale attribute when present", async () => {
    const xml = V1_XML.replace("<PurchaseOrder>", '<PurchaseOrder locale="ja_JP">');
    const read = await readPurchaseOrderV1(xml, { log: () => {} });
    expect(read.locale).toBe("ja_JP");
  });

  it("rejects a node that is not a PurchaseOrder element", async () => {
    const xml = "<SupplierOrder><OrderId>1</OrderId></SupplierOrder>";
    await expect(readPurchaseOrderV1(xml, { log: () => {} })).rejects.toThrow(
      "PurchaseOrder element expected.",
    );
  });

  it("falls back to the current date for a missing OrderDate", async () => {
    const xml = V1_XML.replace(/\s*<OrderDate>2002-03-15<\/OrderDate>/, "");
    const frozen = new Date(2030, 0, 1);
    const read = await readPurchaseOrderV1(xml, { now: () => frozen, log: () => {} });
    expect(read.orderDate).toEqual(frozen);
  });
});
