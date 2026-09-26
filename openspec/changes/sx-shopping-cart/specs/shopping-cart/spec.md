## ADDED Requirements

### Requirement: Cart screen

The cart screen SHALL show an empty-cart message when the cart holds no items. Otherwise it MUST list one row per cart line showing the item attribute and product name linked to that item's detail page, a Remove control, an editable quantity pre-filled with the line quantity and accepting at most 10 characters, and the unit price formatted as currency. Below the rows it MUST show an Update Cart control, the cart total (the subtotal) formatted as currency, and a Check Out control leading to order information entry.

#### Scenario: Empty cart is displayed

- **GIVEN** a shopper whose cart holds no items
- **WHEN** the cart screen is displayed
- **THEN** the message "Your Shopping Cart is Empty." is shown and no item rows, Update Cart, total or Check Out control are shown

#### Scenario: Cart with items is displayed

- **GIVEN** a cart holding 2 of item EST-6 "Adult Male Bulldog" at 18.50 and 1 of item EST-1 "Large Angelfish" at 16.50
- **WHEN** the cart screen is displayed
- **THEN** two rows are shown, each with the attribute and name linked to the item's detail page, a Remove control, a quantity field holding 2 and 1 respectively, and unit prices $18.50 and $16.50
- **AND** an Update Cart control, a total of $53.50 and a Check Out control are shown

#### Scenario: Remove control is used

- **GIVEN** the cart screen listing item EST-6
- **WHEN** the shopper activates Remove on the EST-6 row
- **THEN** EST-6 is removed from the cart and the cart screen is displayed again

#### Scenario: Update Cart is submitted

- **GIVEN** the cart screen listing EST-6 with quantity 2 and EST-1 with quantity 1
- **WHEN** the shopper changes EST-6 to 5 and EST-1 to 0 and activates Update Cart
- **THEN** all quantities are submitted together, EST-6 has quantity 5, EST-1 is removed, and the cart screen is displayed again

#### Scenario: Check Out is used

- **GIVEN** the cart screen listing at least one item
- **WHEN** the shopper activates Check Out
- **THEN** the order information entry step of checkout is started

### Requirement: One cart per shopper session

The system SHALL keep exactly one shopping cart per shopper session. The cart SHALL be created empty when first needed and SHALL be discarded when the shopper signs out. The cart MUST hold at most one line per item identifier, and each line holds an integer quantity.

#### Scenario: First cart access in a session

- **GIVEN** a new shopper session that has not used the cart
- **WHEN** the cart is first read or modified
- **THEN** an empty cart is created for that session

#### Scenario: Shopper signs out

- **GIVEN** a signed-in shopper whose cart holds 3 lines
- **WHEN** the shopper signs out
- **THEN** that cart is discarded and the next cart access in the new session sees an empty cart

#### Scenario: Two sessions do not share a cart

- **GIVEN** two shopper sessions A and B
- **WHEN** session A adds item EST-6
- **THEN** session B's cart does not contain EST-6

### Requirement: Anonymous cart use

The system SHALL allow every cart operation (add, remove, update quantities, view, count, subtotal) without the shopper being signed in.

#### Scenario: Anonymous shopper adds an item

- **GIVEN** a shopper who has not signed in
- **WHEN** the shopper adds item EST-6 to the cart
- **THEN** the item is added and no sign-on is requested

### Requirement: Add item to cart

The system SHALL add a catalog item to the cart by item identifier with a quantity of 1. WHEN the item is already in the cart, the system SHALL keep a single line for it and SHALL set its quantity to 1. It MUST NOT increment the existing quantity.

#### Scenario: Item not yet in the cart

- **GIVEN** a cart that does not contain item EST-6
- **WHEN** the shopper adds EST-6 to the cart
- **THEN** the cart contains one line for EST-6 with quantity 1

#### Scenario: Item already in the cart

- **GIVEN** a cart holding item EST-6 with quantity 4
- **WHEN** the shopper adds EST-6 to the cart again
- **THEN** the cart contains one line for EST-6 with quantity 1

### Requirement: Remove item from cart

The system SHALL remove an item's line from the cart when the shopper removes that item. Removing an item that is not in the cart SHALL leave the cart unchanged and MUST NOT raise an error.

#### Scenario: Item in the cart is removed

- **GIVEN** a cart holding items EST-6 and EST-1
- **WHEN** the shopper removes EST-6
- **THEN** the cart holds only EST-1

#### Scenario: Item not in the cart is removed

- **GIVEN** a cart holding only EST-1
- **WHEN** a remove request for EST-6 is received
- **THEN** the cart still holds only EST-1 and no error is reported

### Requirement: Batch quantity update

The system SHALL accept new quantities for any number of cart items in one submission and apply each one. A new quantity less than or equal to 0 SHALL remove the item's line. A new quantity greater than 0 SHALL set the line to exactly that quantity. It SHALL also add the item with that quantity when the item is not already in the cart.

#### Scenario: Positive quantity

- **GIVEN** a cart holding EST-6 with quantity 1
- **WHEN** an update sets EST-6 to 3
- **THEN** EST-6 has quantity 3

#### Scenario: Zero or negative quantity

- **GIVEN** a cart holding EST-6 with quantity 2 and EST-1 with quantity 1
- **WHEN** an update sets EST-6 to 0 and EST-1 to -2
- **THEN** both lines are removed and the cart is empty

#### Scenario: Positive quantity for an item not in the cart

- **GIVEN** a cart that does not contain EST-1
- **WHEN** an update sets EST-1 to 2
- **THEN** the cart contains EST-1 with quantity 2

### Requirement: Non-numeric quantity treated as zero

WHEN a cart update submission carries a quantity that is not a whole number, the system SHALL treat that item's quantity as 0. The update therefore removes the item from the cart, and the system MUST NOT report an error.

#### Scenario: Letters entered as quantity

- **GIVEN** a cart holding EST-6 with quantity 2
- **WHEN** an update submits "abc" as the quantity for EST-6
- **THEN** EST-6 is removed from the cart and no error is shown

#### Scenario: Decimal entered as quantity

- **GIVEN** a cart holding EST-6 with quantity 2
- **WHEN** an update submits "1.5" as the quantity for EST-6
- **THEN** EST-6 is removed from the cart

### Requirement: Cart item count

The system SHALL report the cart item count as the number of distinct item lines in the cart, not the sum of their quantities.

#### Scenario: Count of a cart with multiple units

- **GIVEN** a cart holding EST-6 with quantity 3 and EST-1 with quantity 2
- **WHEN** the item count is requested
- **THEN** the count is 2

### Requirement: Cart line contents

Each cart line the system presents SHALL carry the item identifier, product identifier, category, product name, item attribute, integer quantity, unit cost, and a line total equal to quantity multiplied by unit cost.

#### Scenario: Line total

- **GIVEN** a cart holding EST-6 with quantity 3 whose catalog list price is 18.50
- **WHEN** the cart lines are read
- **THEN** the EST-6 line carries its item, product, category, name and attribute details, quantity 3, unit cost 18.50 and line total 55.50

### Requirement: Catalog resolution at read time

The system SHALL resolve each cart line's product details and unit price from the catalog each time the cart is read, in the cart's current locale. It MUST NOT store product details or prices in the cart when an item is added.

#### Scenario: Catalog price changes after the item was added

- **GIVEN** EST-6 was added to the cart when its list price was 18.50
- **AND** its catalog list price is now 20.00
- **WHEN** the cart is read
- **THEN** the EST-6 line shows unit cost 20.00

### Requirement: Unresolvable cart items

WHEN a cart line's item cannot be retrieved from the catalog, the system SHALL omit that line from the listed items and from the subtotal, and the cart read SHALL still succeed without showing an error. The item SHALL remain stored in the cart and SHALL still be included in the item count.

#### Scenario: One item cannot be resolved

- **GIVEN** a cart holding EST-6 (quantity 1, price 18.50) and EST-99, which the catalog cannot return
- **WHEN** the cart contents, subtotal and count are read
- **THEN** only EST-6 is listed, the subtotal is 18.50, the count is 2, and no error is shown

### Requirement: Cart subtotal

The system SHALL compute the cart subtotal as the sum, over every resolvable cart line, of the item's current catalog list price multiplied by its quantity. It SHALL apply no discount, tax or shipping. The subtotal of an empty cart SHALL be 0.

#### Scenario: Subtotal of several lines

- **GIVEN** a cart holding EST-6 with quantity 2 at 18.50 and EST-1 with quantity 1 at 16.50
- **WHEN** the subtotal is requested
- **THEN** the subtotal is 53.50

#### Scenario: Subtotal of an empty cart

- **GIVEN** an empty cart
- **WHEN** the subtotal is requested
- **THEN** the subtotal is 0

### Requirement: Empty cart after order placement

The system SHALL be able to remove every line from a cart in one operation, and SHALL empty the shopper's cart after an order is placed from it.

#### Scenario: Order placed

- **GIVEN** a cart holding 3 lines
- **WHEN** the shopper places an order from the cart
- **THEN** the cart holds no lines and the item count is 0
