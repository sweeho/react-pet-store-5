## ADDED Requirements

### Requirement: One customer per user id
ID: SWHR-R-0108

The system SHALL keep exactly one customer record per user id, the user id SHALL be the customer's unique identifier, and each customer MUST own exactly one account and exactly one profile.

#### Scenario: Customer created for a new user id
ID: SWHR-R-0108.01

- **GIVEN** no customer exists for user id "j2ee"
- **WHEN** a customer is created for user id "j2ee"
- **THEN** one customer record exists for "j2ee" with exactly one account and exactly one profile

#### Scenario: Second customer for the same user id
ID: SWHR-R-0108.02

- **GIVEN** a customer already exists for user id "j2ee"
- **WHEN** another customer is created for user id "j2ee"
- **THEN** the creation is refused and the existing customer is unchanged

### Requirement: Account composition and status
ID: SWHR-R-0109

Each account SHALL hold a status value, exactly one contact-information record and exactly one credit card on file. The recognised status values SHALL be "active" and "disabled".

#### Scenario: Account read after creation
ID: SWHR-R-0109.01

- **GIVEN** a customer has been created
- **WHEN** the customer's account is read
- **THEN** it carries a status of "active", one contact-information record and one credit-card record

### Requirement: Contact information record
ID: SWHR-R-0110

The system SHALL store, as a customer's contact information, a given name, a family name, a telephone number, an email address and exactly one postal address owned by that contact-information record.

#### Scenario: Contact information stored with its address
ID: SWHR-R-0110.01

- **GIVEN** contact details with given name "ABC", family name "XYZ", telephone "555-555-5555", email "abc@xyz.com" and a postal address
- **WHEN** the contact information is stored
- **THEN** reading it back returns the same four values and the same postal address

### Requirement: Postal address record
ID: SWHR-R-0111

The system SHALL store a postal address as six text fields (street line 1, street line 2, city, state or province, postal code, country) and SHALL give each address a system-generated identity with no business key. The storage layer SHALL store address values exactly as supplied, without trimming, case normalisation or format checks.

#### Scenario: Two identical addresses
ID: SWHR-R-0111.01

- **GIVEN** two addresses are stored with identical values in all six fields
- **WHEN** both are read back
- **THEN** they are two distinct records with different identities

#### Scenario: Address stored with an empty field
ID: SWHR-R-0111.02

- **GIVEN** an address whose second street line is absent
- **WHEN** the address is stored
- **THEN** the record is created with the second street line absent and no error is raised by the storage layer

### Requirement: Credit card on file
ID: SWHR-R-0112

The system SHALL store a credit card as exactly three text values (card number, card type, expiry date), SHALL identify each card record by a system-generated key, and MUST NOT use the card number as the record identity.

#### Scenario: Same card number on two records
ID: SWHR-R-0112.01

- **GIVEN** a card record with number "4111-1111-1111-1111" already exists
- **WHEN** a second card record with the same number is stored
- **THEN** both records exist with different identities

### Requirement: Card expiry month and year
ID: SWHR-R-0113

The system SHALL hold a card expiry as a single "month/year" value; the expiry month SHALL be the text before the first "/" and the expiry year SHALL be all text after the first "/". When a card is entered through the account form, the stored expiry MUST be composed as the selected month, "/", and the selected four-digit year.

#### Scenario: Expiry split into month and year
ID: SWHR-R-0113.01

- **GIVEN** a card whose stored expiry is "07/2004"
- **WHEN** its expiry month and year are read
- **THEN** the month is "07" and the year is "2004"

#### Scenario: Expiry composed from the form
ID: SWHR-R-0113.02

- **GIVEN** a customer selects expiry month "03" and expiry year "2005" on the account form
- **WHEN** the form is saved
- **THEN** the stored expiry is "03/2005"

### Requirement: Malformed expiry fallback
ID: SWHR-R-0114

GIVEN a stored card expiry that is absent or contains no "/", the system SHALL report the expiry month as "01" and the expiry year as "2010".

#### Scenario: Expiry without a separator
ID: SWHR-R-0114.01

- **GIVEN** a card whose stored expiry is "0704"
- **WHEN** its expiry month and year are read
- **THEN** the month is reported as "01" and the year as "2010"

#### Scenario: Expiry absent
ID: SWHR-R-0114.02

- **GIVEN** a card with no stored expiry
- **WHEN** its expiry month and year are read
- **THEN** the month is reported as "01" and the year as "2010"

### Requirement: Account initialised on customer creation
ID: SWHR-R-0115

WHEN a customer is created, the system SHALL create that customer's account with status "active", and the new account MUST start with an empty contact-information record, which itself carries an empty postal address, and an empty credit-card record.

#### Scenario: New customer's account
ID: SWHR-R-0115.01

- **GIVEN** no customer exists for user id "newbie"
- **WHEN** a customer is created for "newbie"
- **THEN** the account status is "active", the contact information, its postal address and the credit card all exist with every field empty

### Requirement: Profile defaults on customer creation
ID: SWHR-R-0116

WHEN a customer is created, the system SHALL create that customer's profile with preferred language "en_US", no favourite category, the My List preference on and the banner preference on.

#### Scenario: New customer's profile
ID: SWHR-R-0116.01

- **GIVEN** a customer has just been created for user id "newbie"
- **WHEN** the profile is read before any edit
- **THEN** preferred language is "en_US", favourite category is empty, My List is on and banner is on

### Requirement: Atomic customer creation
ID: SWHR-R-0117

The system SHALL create a customer, its account (with contact information, postal address and credit card) and its profile as one all-or-nothing unit; if any part cannot be created, customer creation MUST fail and leave no partial customer.

#### Scenario: Profile creation fails
ID: SWHR-R-0117.01

- **GIVEN** the profile for a new customer cannot be created
- **WHEN** customer creation is attempted for user id "newbie"
- **THEN** creation fails and no customer, account, contact information, address, credit card or profile exists for "newbie"

### Requirement: Cascading deletion of customer data
ID: SWHR-R-0118

WHEN a customer is deleted the system SHALL delete its account and profile; WHEN an account is deleted it SHALL delete its contact information and credit card; WHEN contact information is deleted it SHALL delete its postal address.

#### Scenario: Customer deleted
ID: SWHR-R-0118.01

- **GIVEN** a customer with an account, profile, contact information, postal address and credit card
- **WHEN** the customer is deleted
- **THEN** none of those six records remain

### Requirement: Customer lookup
ID: SWHR-R-0119

The system SHALL allow a customer to be looked up by user id and SHALL allow all customers to be listed.

#### Scenario: Lookup by user id
ID: SWHR-R-0119.01

- **GIVEN** customers exist for user ids "j2ee" and "ACID"
- **WHEN** the customer for "ACID" is requested
- **THEN** the "ACID" customer is returned

#### Scenario: List all customers
ID: SWHR-R-0119.02

- **GIVEN** customers exist for user ids "j2ee" and "ACID"
- **WHEN** all customers are listed
- **THEN** both customers are returned

### Requirement: Account created with supplied details
ID: SWHR-R-0120

The system SHALL support creating an account with a given status, contact information and credit card supplied at creation time, as an alternative to creating it with empty contact and card records.

#### Scenario: Seeded account
ID: SWHR-R-0120.01

- **GIVEN** a status "active", complete contact information and a credit card
- **WHEN** an account is created from them
- **THEN** the account carries exactly the supplied status, contact information and card

### Requirement: Contact information creation paths
ID: SWHR-R-0121

The system SHALL support three ways to create contact information: from no data, which MUST attach a new empty postal address; from a complete contact value, which MUST create a new postal address copied from the supplied one; and from separate field values plus an existing postal address, which MUST link that existing address rather than a copy.

#### Scenario: Created from a complete value
ID: SWHR-R-0121.01

- **GIVEN** a complete contact value including a postal address
- **WHEN** contact information is created from it
- **THEN** the names, telephone and email are copied and a new postal address record is created with the supplied address values

#### Scenario: Created from separate values and an existing address
ID: SWHR-R-0121.02

- **GIVEN** an existing stored postal address A
- **WHEN** contact information is created from separate name, telephone and email values and address A
- **THEN** the new contact information is linked to address A itself

#### Scenario: Created empty
ID: SWHR-R-0121.03

- **GIVEN** no contact details
- **WHEN** contact information is created
- **THEN** it has empty names, telephone and email and is linked to a new empty postal address

### Requirement: Field-level read and update of account data
ID: SWHR-R-0122

The system SHALL allow each contact field (given name, family name, telephone, email, postal address), each credit-card field, each profile preference and the account status to be read and updated individually after creation, and SHALL return the whole contact information, including its postal address, or the whole credit card as a single detached value on request.

#### Scenario: Update a single contact field
ID: SWHR-R-0122.01

- **GIVEN** stored contact information with telephone "555-555-5555"
- **WHEN** only the telephone is updated to "555-000-0000"
- **THEN** the telephone reads "555-000-0000" and every other contact field is unchanged

#### Scenario: Whole-value read is detached
ID: SWHR-R-0122.02

- **GIVEN** stored contact information
- **WHEN** its whole value is read and the returned copy is modified
- **THEN** the stored contact information is unchanged

### Requirement: Account data access is enforced by the caller
ID: SWHR-R-0123

The account data store SHALL NOT itself restrict which caller may read or change customer, account, profile, contact, address or credit-card data; access control MUST be applied by the calling layer that owns the request.

#### Scenario: Internal read without a role
ID: SWHR-R-0123.01

- **GIVEN** an internal service with no role assigned
- **WHEN** it reads a customer's contact information through the data store
- **THEN** the data store returns the record and any access decision is the calling layer's

### Requirement: Account registration and update
ID: SWHR-R-0124

The system SHALL let a signed-on customer create an account once, at registration, and later update it; the account comprises contact information, postal address, credit card and profile preferences. WHEN an update is submitted, the system SHALL replace the stored contact information, postal address, credit card and profile preferences with the submitted values.

#### Scenario: Account created at registration
ID: SWHR-R-0124.01

- **GIVEN** a newly signed-on user with no customer record
- **WHEN** they submit the account creation form with complete details
- **THEN** a customer is created and every submitted contact, address, card and profile value is stored on it

#### Scenario: Account updated
ID: SWHR-R-0124.02

- **GIVEN** a signed-on customer whose stored city is "Palo Alto"
- **WHEN** they submit the account edit form with city "San Jose" and the other fields unchanged
- **THEN** the stored city is "San Jose" and the other stored values equal the submitted ones

### Requirement: Required contact fields on the account form
ID: SWHR-R-0125

WHEN an account is created or updated, the system SHALL require, after trimming whitespace, a non-blank last name, first name, street address line 1, city, state or province, postal code and telephone number. Street address line 2 and email SHALL be optional, and a blank street address line 2 MUST be stored as absent.

#### Scenario: Required field missing
ID: SWHR-R-0125.01

- **GIVEN** an account form whose city contains only spaces
- **WHEN** the form is submitted
- **THEN** the submission is rejected and city is reported as missing

#### Scenario: Optional fields blank
ID: SWHR-R-0125.02

- **GIVEN** an account form with all required fields filled, a blank street address line 2 and no email
- **WHEN** the form is submitted
- **THEN** the account is saved with street address line 2 absent and no email

### Requirement: Profile preferences on the account form
ID: SWHR-R-0126

WHEN an account is created or updated, the system SHALL require a preferred language and a favourite category, and SHALL store the My List and banner preferences as off unless their options are explicitly ticked.

#### Scenario: Preferences unticked
ID: SWHR-R-0126.01

- **GIVEN** an account form with the My List and banner options unticked
- **WHEN** the form is submitted
- **THEN** both preferences are stored as off

#### Scenario: Favourite category missing
ID: SWHR-R-0126.02

- **GIVEN** an account form with no favourite category selected
- **WHEN** the form is submitted
- **THEN** the submission is rejected and favourite category is reported as missing

### Requirement: Account form reference choices
ID: SWHR-R-0127

The account creation and edit forms SHALL offer these fixed choices: state or province California, New York, Texas; country United States, Canada, Japan, China; card type Java(TM) Card, Duke Express, Meow Card; expiry month 01 through 12; a four-year range of expiry years; language English (en_US), Japanese (ja_JP), Chinese (zh_CN); favourite category Birds, Cats, Dogs, Fish, Reptiles. On the creation form English and Birds MUST be preselected; on the edit form the customer's stored values MUST be preselected.

#### Scenario: Creation form defaults
ID: SWHR-R-0127.01

- **GIVEN** a signed-on user opening the account creation form
- **WHEN** the form is shown
- **THEN** language defaults to English, favourite category defaults to Birds and every choice list above is offered

#### Scenario: Edit form preselection
ID: SWHR-R-0127.02

- **GIVEN** a customer whose stored card type is "Duke Express" and favourite category is "Cats"
- **WHEN** the account edit form is shown
- **THEN** card type "Duke Express" and favourite category "Cats" are preselected

### Requirement: Empty-field check before submission
ID: SWHR-R-0128

GIVEN a form field marked as validated, the system SHALL block submission of the form while that field is empty and MUST tell the user "<field name> is empty." for each empty validated field.

#### Scenario: Validated field left empty
ID: SWHR-R-0128.01

- **GIVEN** an account form whose validated field "First Name" is empty
- **WHEN** the user submits the form
- **THEN** submission is blocked and the message "First Name is empty." is shown

### Requirement: My List panel
ID: SWHR-R-0129

GIVEN a signed-on customer whose My List preference is on, the storefront screens that carry the My List panel SHALL show up to 10 products from the customer's favourite category, each linking to that product's page. The panel MUST NOT be shown when the preference is off.

#### Scenario: My List on
ID: SWHR-R-0129.01

- **GIVEN** a signed-on customer with My List on and favourite category Fish containing 12 products
- **WHEN** they view a screen that carries the My List panel
- **THEN** the panel lists the first 10 Fish products, each linking to its product page

#### Scenario: My List off
ID: SWHR-R-0129.02

- **GIVEN** a signed-on customer with My List off
- **WHEN** they view a screen that carries the My List panel
- **THEN** no My List panel is shown

### Requirement: Pet-tips banner
ID: SWHR-R-0130

GIVEN a signed-on customer whose banner preference is on, the home and cart screens SHALL show a pet-tips banner chosen by the customer's favourite category, matched case-insensitively against dogs, cats, reptiles, birds and fish, and MUST show the dogs banner for any other category. No banner SHALL be shown when the preference is off.

#### Scenario: Banner for a matching category
ID: SWHR-R-0130.01

- **GIVEN** a signed-on customer with banner on and favourite category "CATS"
- **WHEN** they view the home screen
- **THEN** the cats pet-tips banner is shown

#### Scenario: Banner for an unmatched category
ID: SWHR-R-0130.02

- **GIVEN** a signed-on customer with banner on and no favourite category matching the five banners
- **WHEN** they view the cart screen
- **THEN** the dogs pet-tips banner is shown

### Requirement: Account information page
ID: SWHR-R-0131

The account information page SHALL show the signed-on customer their contact information (first name, last name, street address lines, city, state or province, postal code, country, telephone, email), credit card type, card number and expiry month and year, preferred language, favourite category, and Yes or No for each of the My List and pet-tips banner preferences, and MUST offer a control that opens the account edit form.

#### Scenario: Account page displayed
ID: SWHR-R-0131.01

- **GIVEN** a signed-on customer with a stored account, credit card expiry "07/2004", My List on and banner off
- **WHEN** they open the account information page
- **THEN** the page shows each stored contact field, the card type and card number, expiry month "07" and year "2004", the preferred language, the favourite category, "Yes" for My List and "No" for banners

#### Scenario: Edit control
ID: SWHR-R-0131.02

- **GIVEN** a signed-on customer on the account information page
- **WHEN** they activate the edit control
- **THEN** the account edit form opens preselected with their stored values
