## ADDED Requirements

### Requirement: Sign-in screen
ID: SWHR-R-0053

The sign-in screen SHALL present two side-by-side choices: a returning-customer form and a new-account form. The returning-customer form MUST offer a user name field, a password field, a "Remember My User Name" checkbox and a Sign In control that submits the credentials for sign-on. The new-account form MUST offer a user name field, a password field, a repeated-password field and a Create New Account control that submits them for account creation. The screen SHALL NOT submit either form while any of that form's fields is empty.

#### Scenario: A remembered user name is present
ID: SWHR-R-0053.01

- **GIVEN** the browser holds a remembered user name "alice"
- **WHEN** the sign-in screen is displayed
- **THEN** the returning-customer user name field is pre-filled with "alice", the password field is empty, and the "Remember My User Name" checkbox is checked

#### Scenario: No remembered user name
ID: SWHR-R-0053.02

- **GIVEN** the browser holds no remembered user name
- **WHEN** the sign-in screen is displayed
- **THEN** the "Remember My User Name" checkbox is unchecked and the new-account form's three fields are empty

#### Scenario: Returning-customer form submitted with an empty field
ID: SWHR-R-0053.03

- **GIVEN** the sign-in screen with the returning-customer password field left empty
- **WHEN** the shopper activates Sign In
- **THEN** the form is not submitted and the shopper is told "Password is empty." (one message per empty field)

#### Scenario: Create New Account activated
ID: SWHR-R-0053.04

- **GIVEN** the new-account form with user name "bob" and a password entered twice
- **WHEN** the shopper activates Create New Account
- **THEN** the user name and password are submitted for account creation

### Requirement: Sign-in error screen
ID: SWHR-R-0054

When a sign-on attempt fails, the storefront SHALL display a "Sign-in Error" screen stating that the user name and password entered were not found in the records and inviting the shopper to try again.

#### Scenario: Unknown credentials submitted
ID: SWHR-R-0054.01

- **GIVEN** no account exists with user name "ghost"
- **WHEN** the shopper submits the returning-customer form with user name "ghost"
- **THEN** the "Sign-in Error" screen is shown with the not-found message and an invitation to try again, and the shopper is not signed on

### Requirement: Storefront page header
ID: SWHR-R-0055

Every storefront page SHALL display a header containing the store logo linking to the home page, a keyword search box with a Search control, an Account link, a Cart link, and exactly one of a "Sign out" link (when the shopper is signed on) or a "Sign in" link (when not). The Sign in link MUST lead to the sign-on welcome page, which is protected, so following it starts sign-on.

#### Scenario: Anonymous shopper views a page
ID: SWHR-R-0055.01

- **GIVEN** a shopper who is not signed on
- **WHEN** any storefront page is displayed
- **THEN** the header shows the logo, search box, Account and Cart links, and a "Sign in" link, and no "Sign out" link

#### Scenario: Signed-on shopper views a page
ID: SWHR-R-0055.02

- **GIVEN** a shopper who is signed on
- **WHEN** any storefront page is displayed
- **THEN** the header shows a "Sign out" link in place of "Sign in"

#### Scenario: Keyword search from the header
ID: SWHR-R-0055.03

- **GIVEN** any storefront page
- **WHEN** the shopper enters "dog" in the header search box and activates Search
- **THEN** the search results page for keyword "dog" is shown

### Requirement: Sign-on credential record
ID: SWHR-R-0056

The system SHALL persist exactly one sign-on credential per user, consisting of a user id that uniquely identifies the credential and a password.

#### Scenario: Credential created
ID: SWHR-R-0056.01

- **GIVEN** no credential exists for user id "carol"
- **WHEN** an account is created with user id "carol" and a password
- **THEN** exactly one credential with user id "carol" is stored

### Requirement: Unique user id
ID: SWHR-R-0057

The system MUST reject creation of a credential whose user id already exists, and SHALL then show a "User Creation Error" screen stating that the chosen user name is in use and asking the user to choose another.

#### Scenario: Duplicate user id
ID: SWHR-R-0057.01

- **GIVEN** a credential with user id "alice" exists
- **WHEN** a visitor submits the new-account form with user id "alice"
- **THEN** no second credential is created and the "User Creation Error" screen asks for another user name

### Requirement: User id length limit
ID: SWHR-R-0058

The system MUST reject creation of a credential whose user id is longer than 25 characters.

#### Scenario: 26-character user id
ID: SWHR-R-0058.01

- **GIVEN** a user id of 26 characters
- **WHEN** account creation is attempted
- **THEN** creation fails and no credential is stored

#### Scenario: 25-character user id
ID: SWHR-R-0058.02

- **GIVEN** a user id of exactly 25 characters that is not in use
- **WHEN** account creation is attempted
- **THEN** the credential is created

### Requirement: User id wildcard characters forbidden
ID: SWHR-R-0059

The system MUST reject creation of a credential whose user id contains a `%` or `*` character.

#### Scenario: User id containing a percent sign
ID: SWHR-R-0059.01

- **GIVEN** the user id "bob%1"
- **WHEN** account creation is attempted
- **THEN** creation fails and no credential is stored

#### Scenario: User id containing an asterisk
ID: SWHR-R-0059.02

- **GIVEN** the user id "bob\*"
- **WHEN** account creation is attempted
- **THEN** creation fails and no credential is stored

### Requirement: Password length limit
ID: SWHR-R-0060

The system MUST reject creation of a credential whose password is longer than a fixed maximum length. The value of that maximum is unresolved in the extracted source.

#### Scenario: Password over the maximum
ID: SWHR-R-0060.01

- **GIVEN** a password one character longer than the configured maximum
- **WHEN** account creation is attempted
- **THEN** creation fails and no credential is stored

### Requirement: Credential authentication
ID: SWHR-R-0061

The system SHALL authenticate a user only when a credential exists for the supplied user id and the supplied password exactly matches the stored password, including case. An unknown user id MUST fail authentication without raising an error.

#### Scenario: Correct password
ID: SWHR-R-0061.01

- **GIVEN** a credential "alice" with password "Secret1"
- **WHEN** authentication is attempted with "alice" / "Secret1"
- **THEN** authentication succeeds

#### Scenario: Password differs only in case
ID: SWHR-R-0061.02

- **GIVEN** a credential "alice" with password "Secret1"
- **WHEN** authentication is attempted with "alice" / "secret1"
- **THEN** authentication fails

#### Scenario: Unknown user id
ID: SWHR-R-0061.03

- **GIVEN** no credential exists for "ghost"
- **WHEN** authentication is attempted with "ghost" and any password
- **THEN** authentication fails and no error is raised

### Requirement: Sign-on submission and return to the requested page
ID: SWHR-R-0062

On submission of the sign-on form, the system SHALL, when the credentials authenticate, mark the session as signed on, record the signed-on user id in the session, and redirect the user to the page they originally requested. When the credentials do not authenticate, the system MUST redirect to the configured sign-on error page and MUST leave the session not signed on.

#### Scenario: Valid credentials after being gated
ID: SWHR-R-0062.01

- **GIVEN** an anonymous shopper who requested the account page and was shown the sign-in screen
- **WHEN** they submit valid credentials for "alice"
- **THEN** the session is signed on as "alice" and the shopper is redirected to the account page

#### Scenario: Invalid credentials
ID: SWHR-R-0062.02

- **GIVEN** the sign-in screen
- **WHEN** credentials that do not authenticate are submitted
- **THEN** the shopper is redirected to the sign-in error screen and the session remains not signed on

### Requirement: Remember user name
ID: SWHR-R-0063

When the sign-on form is submitted with "Remember My User Name" selected, the system SHALL store the entered user name in a browser cookie that expires after 31 days. When it is submitted without that option, the system SHALL delete any previously stored user-name cookie.

#### Scenario: Remember selected
ID: SWHR-R-0063.01

- **GIVEN** the shopper enters "alice" and ticks "Remember My User Name"
- **WHEN** the sign-on form is submitted
- **THEN** a user-name cookie with value "alice" and a lifetime of 31 days is set

#### Scenario: Remember not selected
ID: SWHR-R-0063.02

- **GIVEN** a previously stored user-name cookie
- **WHEN** the sign-on form is submitted without "Remember My User Name"
- **THEN** the user-name cookie is deleted

### Requirement: Protected storefront pages
ID: SWHR-R-0064

The storefront SHALL require a signed-on shopper for exactly these pages: the account page, the account-change action, the order-information (checkout) entry page, and the sign-on welcome page. All other storefront pages, including catalog, search and cart, SHALL be available without signing on.

#### Scenario: Anonymous shopper opens checkout
ID: SWHR-R-0064.01

- **GIVEN** a shopper who is not signed on
- **WHEN** they request the order-information entry page
- **THEN** the sign-in screen is shown instead

#### Scenario: Anonymous shopper opens the cart
ID: SWHR-R-0064.02

- **GIVEN** a shopper who is not signed on
- **WHEN** they request the cart page
- **THEN** the cart page is shown without sign-on

### Requirement: Protected-page gate
ID: SWHR-R-0065

When a user who is not signed on requests a protected page, the system SHALL remember the requested page and show the sign-on page instead. Requests from a signed-on session, and requests for unprotected pages, SHALL proceed normally.

#### Scenario: Signed-on user requests a protected page
ID: SWHR-R-0065.01

- **GIVEN** a signed-on session
- **WHEN** the account page is requested
- **THEN** the account page is served without showing the sign-on page

#### Scenario: Gated request is remembered
ID: SWHR-R-0065.02

- **GIVEN** an anonymous session
- **WHEN** the account page is requested
- **THEN** the sign-on page is shown and the account page is recorded as the page to return to after sign-on

### Requirement: Exact protected-path matching
ID: SWHR-R-0066

The system SHALL match a requested path against the protected pages by exact string equality on the path after the application root. Query strings MUST NOT affect matching, and a protected-page entry SHALL NOT act as a wildcard or prefix matching several pages.

#### Scenario: Query string ignored
ID: SWHR-R-0066.01

- **GIVEN** the account page is protected
- **WHEN** an anonymous user requests the account page with a query string appended
- **THEN** the request is gated

#### Scenario: Similar path not matched
ID: SWHR-R-0066.02

- **GIVEN** only the account page is protected
- **WHEN** an anonymous user requests a different path that begins with the account page's name
- **THEN** the request is not gated

### Requirement: Configurable sign-on protection
ID: SWHR-R-0067

The system SHALL let an operator configure, without code changes, the sign-on page, the sign-on error page, and the list of protected pages, each with a name, a path and the roles allowed. When two protected pages share a name, only the first SHALL take effect and a warning SHOULD be logged.

#### Scenario: Duplicate protected-page name
ID: SWHR-R-0067.01

- **GIVEN** configuration listing two protected pages both named "Customer Screen" with different paths
- **WHEN** the configuration is loaded
- **THEN** only the first path is protected and a warning is logged

### Requirement: Storefront protection ignores configured roles
ID: SWHR-R-0068

A signed-on storefront session SHALL be treated as authorised for every protected storefront page regardless of the roles configured on that page.

#### Scenario: Role configured on a protected page
ID: SWHR-R-0068.01

- **GIVEN** a protected storefront page configured with a role the signed-on shopper does not hold
- **WHEN** the signed-on shopper requests that page
- **THEN** the page is served

### Requirement: Anonymous access to sign-on services
ID: SWHR-R-0069

The system SHALL allow credential checking and account creation to be invoked without the caller already holding any role or being signed on.

#### Scenario: Anonymous account creation
ID: SWHR-R-0069.01

- **GIVEN** an anonymous visitor
- **WHEN** they submit the new-account form with a valid, unused user id
- **THEN** the credential is created without any prior sign-on

### Requirement: Anonymous catalog and cart access
ID: SWHR-R-0070

The system SHALL NOT require sign-on or any role for catalog browsing, item lookup, keyword search, or any cart operation (add, remove, update quantity, list, count, subtotal, empty).

#### Scenario: Anonymous shopper adds to cart
ID: SWHR-R-0070.01

- **GIVEN** a shopper who is not signed on
- **WHEN** they add an item to the cart
- **THEN** the item is added and no sign-on is requested

### Requirement: Data-layer access enforced by callers
ID: SWHR-R-0071

The purchase-order and supplier-order data services SHALL NOT apply role checks of their own. Access control on that data SHALL be enforced by the calling application, and supplier-order data MUST be reachable only from inside the application.

#### Scenario: Internal caller reads a purchase order
ID: SWHR-R-0071.01

- **GIVEN** an internal service acting for a signed-on administrator
- **WHEN** it reads a purchase order
- **THEN** the data layer returns it without a role check of its own

### Requirement: Two-step customer registration
ID: SWHR-R-0072

The system SHALL register a new customer in two steps. First, the submitted user name and password create the credential and lead to the account-information form. Second, submitting that form creates the customer profile and marks the session as signed on. The user SHALL then be returned to the page they originally requested, or to the home page when that page was the account-change action. The system MUST create no credential when the user name or password is absent.

#### Scenario: Registration started from checkout
ID: SWHR-R-0072.01

- **GIVEN** an anonymous shopper gated at the order-information page who creates credential "dave"
- **WHEN** they submit a valid account-information form
- **THEN** the session is signed on as "dave" and the order-information page is shown

#### Scenario: Registration started from account change
ID: SWHR-R-0072.02

- **GIVEN** a shopper whose originally requested page was the account-change action
- **WHEN** registration completes
- **THEN** the home page is shown

#### Scenario: Sign-up chosen on the sign-in screen
ID: SWHR-R-0072.03

- **GIVEN** a first-time visitor on the sign-in screen
- **WHEN** they choose the sign-up option and submit account information
- **THEN** a customer account exists and the visitor can proceed to purchase

### Requirement: Storefront sign-out
ID: SWHR-R-0073

When a shopper signs out, the system SHALL discard the session's sign-on state and shopping cart, keep the shopper's current display language, start a fresh empty cart, and show a "You are signed out" page thanking the shopper and linking to sign in again.

#### Scenario: Sign out with items in the cart
ID: SWHR-R-0073.01

- **GIVEN** a signed-on shopper viewing in Japanese with 3 items in the cart
- **WHEN** they choose Sign out
- **THEN** the "You are signed out" page is shown in Japanese, the session is no longer signed on, and the cart is empty

### Requirement: Storefront session idle timeout
ID: SWHR-R-0074

The storefront SHALL end a shopper's session after 15 minutes of inactivity.

#### Scenario: Idle beyond 15 minutes
ID: SWHR-R-0074.01

- **GIVEN** a signed-on shopper idle for 16 minutes
- **WHEN** they request the account page
- **THEN** the session has ended and the sign-in screen is shown

### Requirement: Administration console restricted to administrators
ID: SWHR-R-0075

The administration console SHALL be available, for both viewing and submitting, only to authenticated users holding the administrator role. An unauthenticated user MUST be shown the administrator sign-in form, which asks for user id and password.

#### Scenario: Unauthenticated request for the console
ID: SWHR-R-0075.01

- **GIVEN** a user with no authenticated session
- **WHEN** they request the administration console
- **THEN** the administrator sign-in form is shown instead

#### Scenario: Authenticated non-administrator
ID: SWHR-R-0075.02

- **GIVEN** a user authenticated without the administrator role
- **WHEN** they request the administration console
- **THEN** access is refused

### Requirement: Administrator role assignment
ID: SWHR-R-0076

The system SHALL grant the administrator role to the administrator principal and to members of the administrator group, and SHALL grant it to the supplier principal in the supplier application.

#### Scenario: Member of the administrator group
ID: SWHR-R-0076.01

- **GIVEN** a user in the administrator group
- **WHEN** they sign in to the administration console
- **THEN** the console is shown

### Requirement: Administrative sign-in failure
ID: SWHR-R-0077

When the administration console or supplier application sign-in fails, the system SHALL show a login error page stating that the user could not be authenticated, asking them to check their username and password, and linking back to the sign-in page.

#### Scenario: Wrong administrator password
ID: SWHR-R-0077.01

- **GIVEN** the administrator sign-in form
- **WHEN** a wrong password is submitted
- **THEN** the login error page is shown with a link back to sign in

### Requirement: Administrator sign-out
ID: SWHR-R-0078

A signed-in administrator SHALL be able to sign out from the administration console. Signing out MUST end the session and return the user to the public administration landing page.

#### Scenario: Administrator signs out
ID: SWHR-R-0078.01

- **GIVEN** a signed-in administrator on the console
- **WHEN** they choose to sign out
- **THEN** the session ends and the administration landing page is shown

### Requirement: Administrator session idle timeout
ID: SWHR-R-0079

The administration console and the supplier application SHALL each end a session after 54 minutes of inactivity.

#### Scenario: Idle administrator
ID: SWHR-R-0079.01

- **GIVEN** a signed-in administrator idle for 55 minutes
- **WHEN** they request the console
- **THEN** the administrator sign-in form is shown

### Requirement: Administration data service requires a session
ID: SWHR-R-0080

The administration data service MUST NOT process a request that arrives without an existing session. It SHALL instead reply with an error stating that the session timed out and that the administrator must exit and sign in again from the sign-in page.

#### Scenario: Expired session calls the data service
ID: SWHR-R-0080.01

- **GIVEN** an administration client whose session has expired
- **WHEN** it requests order data
- **THEN** no data is returned and the reply says the session timed out and to sign in again

### Requirement: Session-bound administration client launch
ID: SWHR-R-0081

When a signed-in administrator launches the order-management client, the system SHALL deliver a launch descriptor carrying the server host, port and the administrator's current session identifier. The client MUST use that session on every data-service call, so no second sign-in is needed.

#### Scenario: Client launched from the console
ID: SWHR-R-0081.01

- **GIVEN** a signed-in administrator
- **WHEN** they choose to manage orders
- **THEN** a launch descriptor bound to their session is returned and the client's order requests succeed without another sign-in

### Requirement: Supplier inventory restricted to administrators
ID: SWHR-R-0082

The supplier application SHALL require form-based sign-in with user id and password before any inventory function, and SHALL permit viewing and updating inventory only to users holding the administrator role. A signed-in user without that role who opens the inventory page MUST see a not-authorised message and no update form.

#### Scenario: Supplier user without the role
ID: SWHR-R-0082.01

- **GIVEN** a user signed in to the supplier application without the administrator role
- **WHEN** they open the inventory page
- **THEN** a message says they are not authorised to update orders and no update form is shown

### Requirement: Supplier sign-out
ID: SWHR-R-0083

A supplier user SHALL be able to log out. Logging out MUST end the session and show a page linking back into the supplier application.

#### Scenario: Supplier logs out
ID: SWHR-R-0083.01

- **GIVEN** a signed-in supplier user
- **WHEN** they choose to log out
- **THEN** the session ends and a page with a link to re-enter the supplier application is shown
