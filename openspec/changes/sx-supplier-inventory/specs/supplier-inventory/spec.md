## ADDED Requirements

### Requirement: Supplier stock record

The system SHALL hold exactly one supplier stock record per catalogue item, identified uniquely by the item identifier, and each record MUST carry a whole-number on-hand quantity that is never absent.

#### Scenario: Stock record created for an item

- **GIVEN** no stock record exists for item EST-1
- **WHEN** a stock record for EST-1 with quantity 10000 is created
- **THEN** exactly one stock record for EST-1 exists with quantity 10000

#### Scenario: Duplicate item identifier refused

- **GIVEN** a stock record for item EST-1 exists
- **WHEN** a second stock record for EST-1 is created
- **THEN** the creation is refused and the existing record is unchanged

#### Scenario: Missing quantity refused

- **GIVEN** no stock record exists for item EST-2
- **WHEN** a stock record for EST-2 is created without a quantity
- **THEN** the creation is refused

### Requirement: Stock update applies only to selected rows

WHEN supplier staff submit a batch of inventory changes, the system SHALL change an item's quantity only when that item is selected for update AND a non-empty new quantity is supplied for it, and the supplied value SHALL replace the existing quantity rather than be added to it.

#### Scenario: Selected row with a new quantity is replaced

- **GIVEN** item EST-3 has quantity 40
- **WHEN** staff select EST-3, enter 25 and submit
- **THEN** EST-3 has quantity 25

#### Scenario: Unselected row with a new quantity is unchanged

- **GIVEN** item EST-4 has quantity 40
- **WHEN** staff enter 100 for EST-4 without selecting it and submit
- **THEN** EST-4 still has quantity 40

#### Scenario: Selected row with a blank quantity is unchanged

- **GIVEN** item EST-5 has quantity 40
- **WHEN** staff select EST-5, leave its new quantity blank and submit
- **THEN** EST-5 still has quantity 40

#### Scenario: Zero is accepted

- **GIVEN** item EST-6 has quantity 40
- **WHEN** staff select EST-6, enter 0 and submit
- **THEN** EST-6 has quantity 0

### Requirement: Negative stock quantity is ignored per row

The system MUST NOT set an item's quantity to a negative value through the inventory update; a selected row with a negative new quantity SHALL be left unchanged while the other rows in the same batch are still applied, and no error SHALL be shown for that row.

#### Scenario: Negative value skipped, rest of batch applied

- **GIVEN** item EST-7 has quantity 40 and item EST-8 has quantity 10
- **WHEN** staff select EST-7 with new quantity -5 and EST-8 with new quantity 30 and submit
- **THEN** EST-7 still has quantity 40, EST-8 has quantity 30, and the update confirmation is shown

### Requirement: Stock update re-attempts pending supplier orders

WHEN supplier staff submit inventory changes, the system SHALL, as one unit of work, apply the stock changes, then re-attempt fulfilment of every supplier order still in PENDING status against the new stock, then send an invoice for each order from which anything was shipped in that attempt; if any step fails the stock changes MUST NOT be committed on their own.

#### Scenario: Back-ordered order ships after restock

- **GIVEN** a PENDING supplier order for 5 units of EST-9 and EST-9 has quantity 0
- **WHEN** staff set EST-9 to 20 and submit
- **THEN** the order's EST-9 line is shipped, EST-9 has quantity 15, and one invoice is sent for that order

#### Scenario: Restock insufficient for pending order

- **GIVEN** a PENDING supplier order for 50 units of EST-10 and EST-10 has quantity 0
- **WHEN** staff set EST-10 to 20 and submit
- **THEN** EST-10 has quantity 20, the order remains PENDING, and no invoice is sent for it

#### Scenario: Failure inside the unit of work

- **GIVEN** a PENDING supplier order that can be filled by the submitted stock change
- **WHEN** re-fulfilment of that order fails
- **THEN** neither the stock change nor the order change is committed and no success confirmation is shown

### Requirement: Initial stock load

The system SHALL provide an initial-load operation that creates stock records from a seed data set; it SHALL skip the load when any stock record already exists unless the load is explicitly forced, and when forced each seeded item SHALL be replaced with its seed quantity. The shipped seed data SHALL set items EST-1 through EST-29 to a quantity of 10000 each.

#### Scenario: Load into empty inventory

- **GIVEN** no stock records exist
- **WHEN** the initial load runs without forcing
- **THEN** stock records EST-1 through EST-29 exist, each with quantity 10000

#### Scenario: Load skipped when inventory exists

- **GIVEN** a stock record for EST-1 with quantity 3 exists
- **WHEN** the initial load runs without forcing
- **THEN** no stock record is created or changed and EST-1 still has quantity 3

#### Scenario: Forced load replaces seeded items

- **GIVEN** a stock record for EST-1 with quantity 3 exists
- **WHEN** the initial load runs with forcing
- **THEN** EST-1 has quantity 10000 and EST-2 through EST-29 exist with quantity 10000

### Requirement: Supplier home screen

The supplier home screen SHALL explain that updating inventory lets the supplier fill items marked "Back Ordered", and SHALL offer exactly two actions: Display Inventory, which opens the inventory update screen, and Logout, which signs the user out. A plain visit to the supplier application entry point, with no action submitted, SHALL show this screen.

#### Scenario: Entry point shows the home screen

- **GIVEN** signed-in supplier staff
- **WHEN** they open the supplier application entry point without submitting an action
- **THEN** the home screen is shown with the back-order explanation and the Display Inventory and Logout actions

#### Scenario: Display Inventory action

- **GIVEN** the supplier home screen is shown
- **WHEN** the user activates Display Inventory
- **THEN** the inventory update screen is shown

#### Scenario: Logout action

- **GIVEN** the supplier home screen is shown
- **WHEN** the user activates Logout
- **THEN** the user's session is ended and a signed-out page offering re-entry to the supplier application is shown

### Requirement: Inventory update screen

The inventory update screen SHALL show an instruction to enter new quantities, tick the adjacent box and submit, followed by one row per stock record with the columns Item Id, Existing Quantity, New Quantity and Update. Each row MUST show the item identifier and its current quantity, an empty New Quantity text input, and an unticked Update checkbox. The screen SHALL offer a single Submit control that sends every row's entries as one batch, applied according to the stock update rules.

#### Scenario: Every stock record is listed

- **GIVEN** stock records EST-1 with quantity 10000 and EST-2 with quantity 7
- **WHEN** authorised supplier staff open the inventory update screen
- **THEN** two rows are shown, EST-1 with existing quantity 10000 and EST-2 with existing quantity 7, each with an empty New Quantity input and an unticked Update checkbox, and one Submit control is offered

#### Scenario: Submit sends only ticked rows' changes

- **GIVEN** the inventory update screen listing EST-1 and EST-2, each with quantity 10
- **WHEN** the user enters 50 for EST-1 and ticks its Update box, enters 60 for EST-2 without ticking it, and activates Submit
- **THEN** EST-1 becomes 50, EST-2 remains 10, and the update confirmation screen is shown

### Requirement: Inventory unavailable state

WHEN there are no stock records, or the stock list cannot be retrieved, the inventory update screen SHALL show a message that there are no items in inventory in place of the table and the Submit control.

#### Scenario: Empty inventory

- **GIVEN** no stock records exist
- **WHEN** authorised supplier staff open the inventory update screen
- **THEN** the message that there are no items in inventory is shown and no table or Submit control is shown

#### Scenario: Stock list cannot be retrieved

- **GIVEN** the stock list lookup fails
- **WHEN** authorised supplier staff open the inventory update screen
- **THEN** the message that there are no items in inventory is shown and no table or Submit control is shown

### Requirement: Inventory update confirmation screen

After a successful inventory update the system SHALL show a confirmation screen stating that the inventory was updated successfully, and SHALL offer the same two actions as the home screen: Display Inventory and Logout.

#### Scenario: Confirmation after update

- **GIVEN** the inventory update screen with one ticked row carrying a valid new quantity
- **WHEN** the user activates Submit and the update commits
- **THEN** a screen stating that the inventory was updated successfully is shown with Display Inventory and Logout actions

#### Scenario: View inventory from confirmation

- **GIVEN** the update confirmation screen after EST-1 was set to 50
- **WHEN** the user activates Display Inventory
- **THEN** the inventory update screen is shown with EST-1 at existing quantity 50
