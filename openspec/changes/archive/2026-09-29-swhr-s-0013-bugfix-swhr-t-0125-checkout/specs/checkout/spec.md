## MODIFIED Requirements

### Requirement: Required billing and shipping contact fields

ID: SWHR-R-0147

The system SHALL require these fields for both the billing contact and the shipping contact, each non-blank after trimming whitespace: last name, first name, street address line 1, city, state/province, postal code and telephone number. Street address line 2 and e-mail SHALL be optional in each section. A blank street address line 2 MUST be stored as absent. An order MUST NOT be placed without a contact e-mail: when the billing e-mail is blank and the customer's account holds no e-mail either, the system SHALL place no order and SHALL report the billing e-mail as missing.

#### Scenario: A required shipping field is blank

ID: SWHR-R-0147.01

- **GIVEN** the order information form with the shipping telephone number left blank
- **WHEN** the form is submitted
- **THEN** no order is placed and the telephone number is reported as missing

#### Scenario: Optional fields are blank

ID: SWHR-R-0147.02

- **GIVEN** the order information form with every required field filled and street address line 2 and e-mail blank in the shipping section
- **WHEN** the form is submitted
- **THEN** the submission passes contact validation

#### Scenario: No contact e-mail anywhere
ID: SWHR-R-0147.03

- **GIVEN** a signed-in customer whose account holds no e-mail and a non-empty cart, and the order information form with every required field filled and the billing and shipping e-mail blank
- **WHEN** the form is submitted
- **THEN** no order is placed, nothing is handed to order processing, the cart is unchanged, the billing e-mail is reported as missing and the general error screen is shown
