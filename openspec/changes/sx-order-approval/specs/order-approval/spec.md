## ADDED Requirements

### Requirement: Automatic approval threshold

The system SHALL automatically approve a newly received order, without administrator review, only when the order locale is en_US and the order total is strictly less than 500, or the order locale is ja_JP and the order total is strictly less than 50000. The comparison MUST use the order total in the order's own currency with no conversion.

#### Scenario: Small US order is auto-approved

- **GIVEN** an en_US order totalling 499.99
- **WHEN** the order is received for processing
- **THEN** its status becomes APPROVED without administrator action and it does not appear among pending orders

#### Scenario: US order at the threshold is not auto-approved

- **GIVEN** an en_US order totalling exactly 500
- **WHEN** the order is received for processing
- **THEN** it remains PENDING for administrator review

#### Scenario: Small Japanese order is auto-approved

- **GIVEN** a ja_JP order totalling 49999
- **WHEN** the order is received for processing
- **THEN** its status becomes APPROVED without administrator action

#### Scenario: Japanese order at the threshold is not auto-approved

- **GIVEN** a ja_JP order totalling 50000
- **WHEN** the order is received for processing
- **THEN** it remains PENDING for administrator review

### Requirement: Orders in other locales await review

The system SHALL NOT auto-approve an order whose locale is neither en_US nor ja_JP, regardless of its total, and SHALL leave it PENDING until an administrator approves or denies it.

#### Scenario: Chinese-locale order of any value

- **GIVEN** a zh_CN order totalling 1
- **WHEN** the order is received for processing
- **THEN** it remains PENDING and is listed among pending orders

### Requirement: Order summary for administrator review

The system SHALL represent an order for administrator review with an order identifier, the customer user identifier, the order date, the order amount and the order status, where the status MUST be one of PENDING, APPROVED, DENIED or COMPLETED.

#### Scenario: Order summary fields

- **GIVEN** a stored order placed by user "j2ee" on 3 February 2002 for 612.50
- **WHEN** its administrator summary is produced
- **THEN** the summary carries the order identifier, user "j2ee", the order date, amount 612.50 and the current status

#### Scenario: Unrecognised status value

- **GIVEN** an order summary whose status value is not PENDING, APPROVED, DENIED or COMPLETED
- **WHEN** the administrator client reads it
- **THEN** the status is treated as absent rather than mapped to one of the four values

### Requirement: List orders by status

The system SHALL let an administrator retrieve every order whose current status equals a given status, each order appearing at most once, together with the total count of matching orders. The request MUST fail as a whole with an error stating that orders of that status could not be found when a matching order's details cannot be loaded.

#### Scenario: Pending orders requested

- **GIVEN** three orders with status PENDING and two with status APPROVED
- **WHEN** the administrator requests orders with status PENDING
- **THEN** exactly the three pending orders are returned, each once, with a total count of 3

#### Scenario: No orders in the status

- **GIVEN** no order with status DENIED
- **WHEN** the administrator requests orders with status DENIED
- **THEN** an empty list is returned with a total count of 0

#### Scenario: Order details missing

- **GIVEN** an order recorded as PENDING whose order details cannot be found
- **WHEN** the administrator requests orders with status PENDING
- **THEN** the request fails with an error stating the PENDING orders could not be found

### Requirement: Order data loaded on start and refresh

The administrator order-management client SHALL load the orders in every status (PENDING, APPROVED, DENIED and COMPLETED) and the current sales chart data when it starts and each time the administrator refreshes.

#### Scenario: Client start

- **GIVEN** orders exist in all four statuses
- **WHEN** the administrator opens the order-management client
- **THEN** orders of all four statuses and the sales chart data are loaded without any further action

### Requirement: Decisions take effect only on commit

The system SHALL apply administrator approve or deny decisions only when the administrator commits them. On commit it MUST submit all orders marked APPROVED as one approval batch and all orders marked DENIED as a separate denial batch, and SHALL then reload the order lists. When no pending order has been marked APPROVED or DENIED, a commit MUST send nothing.

#### Scenario: Mixed commit

- **GIVEN** pending orders 1001 and 1002 marked APPROVED and 1003 marked DENIED
- **WHEN** the administrator commits
- **THEN** one approval batch containing 1001 and 1002 and one denial batch containing 1003 are submitted, and the order lists are reloaded

#### Scenario: Commit with no changes

- **GIVEN** every pending order still marked PENDING
- **WHEN** the administrator commits
- **THEN** nothing is submitted to the server

#### Scenario: Uncommitted changes are not applied

- **GIVEN** pending order 1001 marked APPROVED but not committed
- **WHEN** the administrator closes the client
- **THEN** order 1001 remains PENDING

### Requirement: Asynchronous delivery of approval decisions

The system SHALL deliver submitted administrator decisions to order processing asynchronously, as one approval document listing each order identifier with its new status placed on the order-approval queue, and SHALL report success to the administrator once the document is queued rather than once the orders are updated. A submitted entry lacking an order identifier or a status MUST be omitted while the remaining entries are still delivered.

#### Scenario: Decisions queued

- **GIVEN** a status-update submission for orders 1001 APPROVED and 1002 DENIED
- **WHEN** the server receives it
- **THEN** one approval document with both entries is queued and success is returned before either order's status changes

#### Scenario: Entry missing an identifier

- **GIVEN** a status-update submission with one entry lacking an order identifier and one valid entry for order 1002
- **WHEN** the server receives it
- **THEN** the queued approval document contains only order 1002

### Requirement: Approval document structure

The system SHALL exchange approval decisions as a batch document containing one or more orders, each carrying an order identifier followed by an order status, and MUST validate the document against its declared structure when reading it.

#### Scenario: Wrong root

- **GIVEN** a document whose root is not an order-approval batch
- **WHEN** it is read as an approval document
- **THEN** reading fails

#### Scenario: Empty batch

- **GIVEN** an order-approval batch containing no orders
- **WHEN** it is read
- **THEN** reading fails

#### Scenario: Order missing its status

- **GIVEN** an order-approval batch in which an order has an identifier but an empty or missing status
- **WHEN** it is read
- **THEN** reading fails with an error naming the missing status element

### Requirement: Decisions apply only to pending orders

The system SHALL apply an approval decision only to an order whose current status is PENDING, evaluating each order in a batch independently. A decision for an order already APPROVED, DENIED, partially shipped or COMPLETED MUST be ignored silently: no status change, no supplier purchase order and no customer notification.

#### Scenario: Duplicate decision

- **GIVEN** order 1001 already APPROVED and order 1002 PENDING
- **WHEN** a batch approving both is processed
- **THEN** only order 1002 changes status and is notified, and order 1001 is left unchanged with no new supplier purchase order or notification

### Requirement: Applying an approval decision

WHEN a decision for a PENDING order is processed, the system SHALL set the order status to the decided status, SHALL generate and dispatch a supplier purchase order for each order approved, and after the whole batch SHALL send one notice listing every order whose status changed so that each customer is emailed. Automatic approvals MUST follow this same path.

#### Scenario: Approval batch processed

- **GIVEN** a batch approving PENDING order 1001 and denying PENDING order 1002
- **WHEN** it is processed
- **THEN** order 1001 becomes APPROVED and a supplier purchase order is dispatched for it, order 1002 becomes DENIED with no supplier purchase order, and one notice listing both orders is sent for customer email

#### Scenario: Automatic approval

- **GIVEN** an en_US order of 120 that is auto-approved on receipt
- **WHEN** its approval is processed
- **THEN** a supplier purchase order is dispatched and the customer is notified exactly as for an administrator approval

### Requirement: Warning on refresh with uncommitted changes

The system SHALL warn "Data is not committed. Are you sure you want to refresh?" when the administrator requests a refresh while any pending order carries an uncommitted status change, and MUST discard the changes and reload only if the administrator confirms.

#### Scenario: Refresh cancelled

- **GIVEN** pending order 1001 marked DENIED but not committed
- **WHEN** the administrator requests a refresh and cancels the warning
- **THEN** no data is reloaded and order 1001 is still marked DENIED

#### Scenario: Refresh confirmed

- **GIVEN** pending order 1001 marked DENIED but not committed
- **WHEN** the administrator requests a refresh and confirms the warning
- **THEN** the order lists are reloaded and order 1001 is shown as PENDING

### Requirement: Busy state during server requests

WHILE a request to the server is in progress the administrator client SHALL disable the Approve, Deny, Commit, Refresh, report, About and Exit actions and SHALL show "Retrieving data from the server..." when loading or "Updating data on the server..." when submitting, re-enabling the actions when the response arrives.

#### Scenario: Commit in progress

- **GIVEN** the administrator has committed decisions
- **WHEN** the submission is still awaiting the server
- **THEN** the status message reads "Updating data on the server..." and Approve, Deny, Commit and Refresh are disabled until the response arrives

### Requirement: Server failure in the administrator client

WHEN any administrator client request to the server fails, the system SHALL display a dialog titled "Fatal Error!" carrying the error message and SHALL end the order-management session.

#### Scenario: Server unreachable

- **GIVEN** the order data service is unavailable
- **WHEN** the administrator refreshes
- **THEN** a "Fatal Error!" dialog shows the error and the client session ends

### Requirement: Invalid administrator data requests

The administrator order-data service SHALL accept only order-listing, status-update, revenue-report and order-count-report requests. It MUST reply with an error naming the request type for any other type, and with an error asking the caller to try again when the request cannot be parsed.

#### Scenario: Unknown request type

- **GIVEN** a request of type "DELETE"
- **WHEN** the service receives it
- **THEN** it replies with an error stating it is unable to process an unknown request type "DELETE"

#### Scenario: Malformed request

- **GIVEN** a request body that is not well-formed
- **WHEN** the service receives it
- **THEN** it replies with an error describing the failure and asking the caller to try again

### Requirement: Sales revenue report

The system SHALL report sales revenue over an order-date window as the sum of quantity multiplied by unit price across order lines, grouped by product category, together with the total revenue across groups. WHEN a category is given, the report MUST include only that category's lines, grouped by item.

#### Scenario: Revenue by category

- **GIVEN** in the window 2 Fish lines of 3 x 10.00 and 1 Dogs line of 1 x 500.00
- **WHEN** a revenue report is requested with no category
- **THEN** Fish shows 60.00, Dogs shows 500.00 and the total is 560.00

#### Scenario: Revenue within one category

- **GIVEN** in the window a Fish line for item EST-1 of 2 x 10.00 and a Fish line for item EST-2 of 1 x 15.00
- **WHEN** a revenue report is requested for category Fish
- **THEN** EST-1 shows 20.00, EST-2 shows 15.00 and the total is 35.00

### Requirement: Order-count report

The system SHALL report, over an order-date window, the summed line quantities grouped by product category (or by item within a given category) together with the total across groups.

#### Scenario: Quantities by category

- **GIVEN** in the window Fish lines with quantities 3 and 2 and a Dogs line with quantity 1
- **WHEN** an order-count report is requested with no category
- **THEN** Fish shows 5, Dogs shows 1 and the total is 6

### Requirement: Report window and status coverage

The system SHALL include in a sales report every order whose order date falls between the start and end instants, both inclusive, regardless of the order's approval or fulfilment status.

#### Scenario: Order on the boundary

- **GIVEN** an order dated exactly at the report end instant
- **WHEN** a report for that window is requested
- **THEN** the order is included

#### Scenario: Denied order in the window

- **GIVEN** a DENIED order dated inside the window
- **WHEN** a report for that window is requested
- **THEN** the order's lines are included in the totals

### Requirement: Report date entry validation

The system SHALL accept report start and end dates only in month/day/year form (MM/dd/yyyy). WHEN either date cannot be parsed the system MUST show "Dates must be in the format of MM/dd/yyyy" and MUST NOT request report data.

#### Scenario: Invalid date entered

- **GIVEN** the start date field contains "2001-01-01"
- **WHEN** the administrator requests the report
- **THEN** the message "Dates must be in the format of MM/dd/yyyy" is shown and no report data is requested

### Requirement: Default report date range

The system SHALL default the sales report date range to 01/01/2001 through 12/31/2002.

#### Scenario: First display of the sales charts

- **GIVEN** the administrator has not entered report dates
- **WHEN** the sales charts are first displayed
- **THEN** the start date shows 01/01/2001 and the end date shows 12/31/2002

### Requirement: Invalid report groups omitted

The administrator client SHALL omit from a chart any report group that has no name or a negative or unparseable value.

#### Scenario: Group without a name

- **GIVEN** a report response containing one unnamed group and a Fish group of 60.00
- **WHEN** the chart is drawn
- **THEN** only the Fish group appears

### Requirement: Administrator landing page

The administrator landing page SHALL be shown only to authenticated administrators and SHALL state that the administrator can view sales, revenue and orders by status and approve or deny pending orders. It MUST offer exactly two controls: one that launches the order-management client and one that signs the administrator out.

#### Scenario: Landing page displayed

- **GIVEN** a signed-in administrator
- **WHEN** the landing page is displayed
- **THEN** it shows the explanatory text, a "Launch Rich Client" control and a "logout" control

#### Scenario: Launch control used

- **GIVEN** the landing page is displayed
- **WHEN** the administrator activates the launch control
- **THEN** the order-management client opens

#### Scenario: Logout control used

- **GIVEN** the landing page is displayed
- **WHEN** the administrator activates the logout control
- **THEN** the administrator is signed out

### Requirement: Order-management client workspace

The order-management client, titled "Pet Store Administration", SHALL present separate views for pending orders ("Process Pending Orders"), non-pending orders ("View Non-Pending Orders") and sales charts, and MUST offer Refresh, About and Exit actions available from every view. Refresh SHALL reload every view so that changes the administrator has just committed become visible.

#### Scenario: Workspace opened

- **GIVEN** the administrator launches the client
- **WHEN** it finishes loading
- **THEN** the pending-orders, non-pending-orders and sales views are available and Refresh, About and Exit can be used

#### Scenario: Committed change visible after refresh

- **GIVEN** the administrator committed an approval for order 1001
- **WHEN** they refresh
- **THEN** order 1001 no longer appears among pending orders and appears in the non-pending view once processed

### Requirement: Process Pending Orders display

The "Process Pending Orders" view SHALL list only orders with status PENDING in a table with columns ID, User ID, Date, Amount and Status, sortable by clicking a column heading, and MUST show each row's status with a colour cue: APPROVED green, DENIED red, PENDING yellow. When there are no pending orders the table SHALL be empty.

#### Scenario: Pending orders listed

- **GIVEN** two PENDING orders and one APPROVED order
- **WHEN** the view is displayed
- **THEN** exactly the two pending orders appear with their ID, User ID, Date, Amount and a yellow PENDING status

#### Scenario: Sort by amount

- **GIVEN** pending orders of 900.00 and 650.00
- **WHEN** the administrator clicks the Amount heading
- **THEN** the rows are reordered by amount

#### Scenario: No pending orders

- **GIVEN** no order has status PENDING
- **WHEN** the view is displayed
- **THEN** the table shows no rows

### Requirement: Process Pending Orders decisions

The "Process Pending Orders" view SHALL allow only the Status of a row to be edited, choosing among PENDING, APPROVED and DENIED, and MUST keep ID, User ID, Date and Amount read-only. It SHALL offer an Approve control that marks every selected row APPROVED, a Deny control that marks every selected row DENIED, and a Commit control that submits the marked decisions.

#### Scenario: Bulk approve

- **GIVEN** three pending rows selected
- **WHEN** the administrator activates Approve
- **THEN** all three rows show status APPROVED in green and nothing is submitted yet

#### Scenario: Single-row edit

- **GIVEN** a pending row
- **WHEN** the administrator edits its Status cell and chooses DENIED
- **THEN** the row shows DENIED in red

#### Scenario: Read-only fields

- **GIVEN** a pending row
- **WHEN** the administrator tries to edit its Amount
- **THEN** the amount cannot be changed

#### Scenario: Commit

- **GIVEN** one row marked APPROVED
- **WHEN** the administrator activates Commit
- **THEN** the decision is submitted and the view reloads

### Requirement: View Non-Pending Orders display

The "View Non-Pending Orders" view SHALL list orders with status APPROVED, DENIED or COMPLETED using the same columns as the pending-orders view, sortable by column heading, and MUST NOT allow any field of any order to be changed from it.

#### Scenario: Non-pending orders listed

- **GIVEN** one APPROVED, one DENIED, one COMPLETED and one PENDING order
- **WHEN** the view is displayed
- **THEN** the approved, denied and completed orders appear and the pending order does not

#### Scenario: Editing refused

- **GIVEN** an APPROVED order in the view
- **WHEN** the administrator tries to edit its Status
- **THEN** the status cannot be changed

### Requirement: Sales charts view

The sales view SHALL let the administrator choose between a pie chart titled "Pie Chart" showing each category's percentage share of revenue ("Showing total % of sales per category") and a bar chart titled "Bar Chart" showing the number of orders per category ("Showing total # of sales per category"). Each chart MUST display editable Start Date and End Date fields and a "Get Data" control that reloads that chart for the entered range.

#### Scenario: Pie chart percentages

- **GIVEN** revenue of 60.00 for Fish and 140.00 for Dogs in the range
- **WHEN** the pie chart is displayed
- **THEN** Fish is shown as 30% and Dogs as 70% of revenue

#### Scenario: New range requested

- **GIVEN** the bar chart with valid dates 01/01/2002 and 06/30/2002 entered
- **WHEN** the administrator activates "Get Data"
- **THEN** the bar chart is redrawn with order counts per category for that range

### Requirement: Order row date and amount display

Each order row shown to the administrator SHALL display the order identifier, the customer user identifier, the order date as month/day/year without zero padding, the order total value and the status.

#### Scenario: Date shown without padding

- **GIVEN** an order placed on 3 February 2002 for 612.50
- **WHEN** it is listed for the administrator
- **THEN** its date is shown as 2/3/2002 and its amount as 612.50
