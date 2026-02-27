# Complex Mermaid Examples

## E-Commerce System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Web[Web App]
        Mobile[Mobile App]
        Admin[Admin Dashboard]
    end

    subgraph Gateway["API Gateway"]
        LB[Load Balancer]
        Auth[Auth Service]
        Rate[Rate Limiter]
    end

    subgraph Services["Microservices"]
        User[User Service]
        Product[Product Service]
        Order[Order Service]
        Payment[Payment Service]
        Inventory[Inventory Service]
        Notification[Notification Service]
    end

    subgraph Data["Data Layer"]
        UserDB[(User DB)]
        ProductDB[(Product DB)]
        OrderDB[(Order DB)]
        Cache[(Redis Cache)]
        Search[(Elasticsearch)]
    end

    subgraph External["External Services"]
        Stripe[Stripe API]
        SendGrid[SendGrid]
        S3[AWS S3]
    end

    Web & Mobile & Admin --> LB
    LB --> Auth --> Rate
    Rate --> User & Product & Order

    User --> UserDB
    Product --> ProductDB & Search & S3
    Order --> OrderDB & Payment & Inventory
    Payment --> Stripe
    Inventory --> ProductDB
    Notification --> SendGrid

    Order -.->|Events| Notification
    User & Product & Order --> Cache
```

## User Registration Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Web as Web App
    participant API as API Gateway
    participant Auth as Auth Service
    participant UserSvc as User Service
    participant DB as Database
    participant Email as Email Service
    participant Queue as Message Queue

    User->>+Web: Fill registration form
    Web->>Web: Validate input
    Web->>+API: POST /api/register
    API->>+Auth: Validate request
    Auth-->>-API: Token generated

    API->>+UserSvc: Create user
    UserSvc->>+DB: Check email exists
    DB-->>-UserSvc: Email available

    UserSvc->>+DB: Insert user record
    DB-->>-UserSvc: User created (ID: 12345)

    UserSvc->>Queue: Publish UserCreated event
    Queue-->>Email: Consume event

    UserSvc-->>-API: User response
    API-->>-Web: 201 Created
    Web-->>-User: Show success message

    Email->>Email: Generate verification email
    Email->>User: Send verification email

    Note over User,Email: User receives email within 5 minutes

    User->>Web: Click verification link
    Web->>API: GET /api/verify?token=xyz
    API->>UserSvc: Verify token
    UserSvc->>DB: Update verified=true
    DB-->>UserSvc: Updated
    UserSvc-->>API: Verified
    API-->>Web: 200 OK
    Web-->>User: Account verified!
```

## Order State Machine

```mermaid
stateDiagram-v2
    [*] --> Draft: Create Order

    Draft --> Pending: Submit
    Draft --> Cancelled: Cancel

    Pending --> PaymentProcessing: Process Payment
    Pending --> Cancelled: Cancel
    Pending --> Draft: Edit

    PaymentProcessing --> PaymentFailed: Payment Declined
    PaymentProcessing --> Paid: Payment Success

    PaymentFailed --> PaymentProcessing: Retry
    PaymentFailed --> Cancelled: Cancel

    Paid --> Processing: Start Fulfillment
    Paid --> Refunded: Full Refund

    Processing --> Shipped: Ship Order
    Processing --> PartialRefund: Partial Refund

    Shipped --> Delivered: Confirm Delivery
    Shipped --> ReturnRequested: Request Return

    Delivered --> Completed: Auto-complete (14 days)
    Delivered --> ReturnRequested: Request Return

    ReturnRequested --> ReturnApproved: Approve
    ReturnRequested --> ReturnDenied: Deny

    ReturnApproved --> Returned: Receive Return
    Returned --> Refunded: Process Refund

    ReturnDenied --> Delivered: Close Request

    Completed --> [*]
    Cancelled --> [*]
    Refunded --> [*]
    PartialRefund --> Processing
```

## Database Schema

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ ADDRESSES : has
    USERS ||--o{ PAYMENT_METHODS : has
    USERS ||--o{ REVIEWS : writes
    USERS ||--o{ WISHLISTS : creates

    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS ||--|| ADDRESSES : "ships to"
    ORDERS ||--|| PAYMENT_METHODS : "paid with"
    ORDERS ||--o{ ORDER_HISTORY : tracks

    PRODUCTS ||--o{ ORDER_ITEMS : "ordered as"
    PRODUCTS ||--o{ REVIEWS : receives
    PRODUCTS ||--o{ WISHLIST_ITEMS : "added to"
    PRODUCTS }|--|| CATEGORIES : "belongs to"
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ INVENTORY : tracks

    CATEGORIES ||--o{ CATEGORIES : "parent of"

    WISHLISTS ||--|{ WISHLIST_ITEMS : contains

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string first_name
        string last_name
        datetime created_at
        datetime updated_at
        boolean is_verified
        boolean is_active
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        uuid shipping_address_id FK
        uuid payment_method_id FK
        string status
        decimal subtotal
        decimal tax
        decimal shipping
        decimal total
        datetime created_at
        datetime updated_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string sku UK
        string name
        text description
        decimal price
        decimal compare_price
        boolean is_active
        datetime created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
        decimal unit_price
        decimal total
    }

    INVENTORY {
        uuid id PK
        uuid product_id FK
        string warehouse
        integer quantity
        integer reserved
        datetime updated_at
    }
```

## CI/CD Pipeline

```mermaid
flowchart LR
    subgraph Dev["Development"]
        Code[Write Code]
        Commit[Git Commit]
        Push[Git Push]
    end

    subgraph CI["Continuous Integration"]
        Trigger[Webhook Trigger]

        subgraph Tests["Test Stage"]
            Lint[Lint Check]
            Unit[Unit Tests]
            Integration[Integration Tests]
        end

        subgraph Build["Build Stage"]
            Compile[Compile]
            Docker[Build Docker Image]
            Push2[Push to Registry]
        end

        subgraph Security["Security Stage"]
            SAST[SAST Scan]
            Deps[Dependency Check]
            Container[Container Scan]
        end
    end

    subgraph CD["Continuous Deployment"]
        subgraph Staging["Staging"]
            DeployStg[Deploy to Staging]
            E2EStg[E2E Tests]
            PerfStg[Performance Tests]
        end

        Approve{Manual Approval}

        subgraph Production["Production"]
            DeployProd[Deploy to Prod]
            Canary[Canary Release]
            Full[Full Rollout]
            Monitor[Monitor Metrics]
        end
    end

    Code --> Commit --> Push --> Trigger
    Trigger --> Lint & Unit & Integration
    Lint & Unit & Integration --> Compile
    Compile --> Docker --> Push2
    Push2 --> SAST & Deps & Container
    SAST & Deps & Container --> DeployStg
    DeployStg --> E2EStg --> PerfStg
    PerfStg --> Approve
    Approve -->|Approved| DeployProd
    Approve -->|Rejected| Code
    DeployProd --> Canary --> Full --> Monitor
    Monitor -->|Issues| Code
```

## Sprint Timeline

```mermaid
gantt
    title Q1 2024 Development Roadmap
    dateFormat YYYY-MM-DD

    section Planning
        Product Requirements    :done, req, 2024-01-01, 5d
        Technical Design        :done, design, after req, 5d
        Sprint Planning         :done, plan, after design, 2d

    section Sprint 1
        User Authentication     :done, auth, 2024-01-15, 10d
        Database Schema         :done, db, 2024-01-15, 7d
        API Gateway Setup       :done, gateway, after db, 5d
        Sprint Review           :milestone, done, 2024-01-29, 0d

    section Sprint 2
        Product Catalog         :active, catalog, 2024-01-29, 10d
        Search Implementation   :active, search, 2024-02-01, 8d
        Image Upload Service    :image, after catalog, 5d
        Sprint Review           :milestone, 2024-02-12, 0d

    section Sprint 3
        Shopping Cart           :cart, 2024-02-12, 8d
        Checkout Flow           :checkout, after cart, 7d
        Payment Integration     :payment, after checkout, 5d
        Sprint Review           :milestone, 2024-02-26, 0d

    section Sprint 4
        Order Management        :order, 2024-02-26, 10d
        Email Notifications     :email, 2024-02-28, 7d
        Admin Dashboard         :admin, after order, 8d
        Sprint Review           :milestone, 2024-03-11, 0d

    section Launch Prep
        QA Testing              :crit, qa, 2024-03-11, 7d
        Bug Fixes               :crit, bugs, after qa, 5d
        Performance Tuning      :perf, 2024-03-15, 5d
        Documentation           :docs, 2024-03-11, 10d
        Launch                  :milestone, crit, 2024-03-25, 0d
```

## Class Hierarchy

```mermaid
classDiagram
    class BaseEntity {
        <<abstract>>
        +UUID id
        +DateTime createdAt
        +DateTime updatedAt
        +save()
        +delete()
        +validate()
    }

    class User {
        +String email
        +String passwordHash
        +String firstName
        +String lastName
        +Boolean isVerified
        +Boolean isActive
        +List~Address~ addresses
        +List~Order~ orders
        +register()
        +login()
        +logout()
        +resetPassword()
        +verifyEmail()
    }

    class Product {
        +String sku
        +String name
        +String description
        +Decimal price
        +Decimal comparePrice
        +Category category
        +List~ProductImage~ images
        +Inventory inventory
        +getDiscountPercentage()
        +isInStock()
        +reserve(quantity)
    }

    class Order {
        +User user
        +Address shippingAddress
        +PaymentMethod paymentMethod
        +OrderStatus status
        +List~OrderItem~ items
        +Decimal subtotal
        +Decimal tax
        +Decimal shipping
        +Decimal total
        +calculateTotals()
        +submit()
        +cancel()
        +refund()
    }

    class OrderItem {
        +Product product
        +Integer quantity
        +Decimal unitPrice
        +Decimal total
        +calculateTotal()
    }

    class PaymentProcessor {
        <<interface>>
        +processPayment(order, paymentMethod)
        +refund(transaction, amount)
        +getTransactionStatus(transactionId)
    }

    class StripeProcessor {
        -String apiKey
        +processPayment(order, paymentMethod)
        +refund(transaction, amount)
        +getTransactionStatus(transactionId)
        -createPaymentIntent()
        -handleWebhook()
    }

    class PayPalProcessor {
        -String clientId
        -String clientSecret
        +processPayment(order, paymentMethod)
        +refund(transaction, amount)
        +getTransactionStatus(transactionId)
        -createOrder()
        -capturePayment()
    }

    class NotificationService {
        <<service>>
        +sendEmail(to, template, data)
        +sendSMS(to, message)
        +sendPush(userId, notification)
    }

    BaseEntity <|-- User
    BaseEntity <|-- Product
    BaseEntity <|-- Order
    BaseEntity <|-- OrderItem

    User "1" --> "*" Order : places
    Order "1" --> "*" OrderItem : contains
    OrderItem "*" --> "1" Product : references

    PaymentProcessor <|.. StripeProcessor
    PaymentProcessor <|.. PayPalProcessor

    Order ..> PaymentProcessor : uses
    Order ..> NotificationService : notifies
```

## Git Workflow

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "Project setup"

    branch develop
    checkout develop
    commit id: "Add base structure"

    branch feature/auth
    checkout feature/auth
    commit id: "Add user model"
    commit id: "Add auth endpoints"
    commit id: "Add JWT middleware"

    checkout develop
    branch feature/products
    checkout feature/products
    commit id: "Add product model"
    commit id: "Add CRUD endpoints"

    checkout develop
    merge feature/auth id: "Merge auth" tag: "v0.1.0"

    checkout feature/products
    commit id: "Add search"
    commit id: "Add filtering"

    checkout develop
    merge feature/products id: "Merge products"

    branch release/1.0
    checkout release/1.0
    commit id: "Version bump"
    commit id: "Fix bugs"

    checkout main
    merge release/1.0 id: "Release 1.0" tag: "v1.0.0"

    checkout develop
    merge main id: "Sync main"

    branch hotfix/security
    checkout hotfix/security
    commit id: "Patch vulnerability"

    checkout main
    merge hotfix/security id: "Hotfix" tag: "v1.0.1"

    checkout develop
    merge main id: "Sync hotfix"
    commit id: "Continue development"
```

## User Journey

```mermaid
journey
    title Customer Purchase Journey
    section Discovery
        Visit homepage: 5: Customer
        Browse categories: 4: Customer
        Search for product: 4: Customer
        View product details: 5: Customer
        Read reviews: 4: Customer
    section Consideration
        Compare products: 3: Customer
        Check availability: 4: Customer
        Add to wishlist: 4: Customer
        Share with friend: 3: Customer
    section Purchase
        Add to cart: 5: Customer
        Apply coupon: 4: Customer
        Enter shipping info: 3: Customer
        Enter payment info: 3: Customer
        Confirm order: 5: Customer
    section Post-Purchase
        Receive confirmation: 5: Customer, System
        Track shipment: 4: Customer, System
        Receive delivery: 5: Customer, Delivery
        Leave review: 4: Customer
        Contact support: 3: Customer, Support
```
