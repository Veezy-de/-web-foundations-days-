# TicketHub – System Design Document

## 1. Introduction

TicketHub is an online ticketing platform that allows users to browse concerts and events, view available seats, reserve seats, purchase tickets and access their purchased tickets.

The platform must support normal daily traffic while remaining reliable during highly popular ticket sales, where thousands of users may attempt to purchase the same seats simultaneously.

The main design priorities are performance, scalability, fairness, security and data consistency.

---

## 2. Requirements

### 2.1 Functional Requirements

The system must allow users to:

1. Register and log into their accounts.
2. Browse available concerts and events.
3. View event information, including venue, date, time and ticket prices.
4. View available, held and sold seats.
5. Select and temporarily reserve available seats.
6. Complete payments for reserved seats.
7. Receive confirmation after successful payment.
8. View their purchased tickets.
9. Cancel eligible reservations.
10. Receive notifications about successful purchases.

### 2.2 Non-Functional Requirements

**Performance**

* Event listings should load within 300 milliseconds under normal conditions.
* Seat availability information should load within 500 milliseconds under normal conditions.
* The system should minimize unnecessary database queries through caching.

**Scalability**

* The application must support 50,000 daily visitors under normal conditions.
* It must handle 200,000 users attempting to purchase tickets during a major concert sale.
* Application servers should scale horizontally when traffic increases.

**Correctness and Data Consistency**

* A seat must never be sold to two different customers.
* Payment status must accurately reflect the payment provider's confirmation.
* Ticket availability must remain consistent across concurrent requests.
* Failed transactions must not result in invalid reservations.

**Fairness**

* A virtual waiting room should control admission during highly popular sales.
* Users should receive queue positions or admission tokens.
* The system should process admitted users according to their assigned queue order.
* Automated abuse and excessive requests should be controlled through rate limiting.

**Security**

* Users must authenticate before purchasing tickets.
* Users must only access their own orders and tickets.
* Passwords must be securely hashed.
* Payment information must be handled through a trusted payment provider.
* API endpoints must validate incoming requests.

**Availability and Reliability**

* The application should remain available during high traffic.
* Failed application servers should be replaced without bringing down the entire system.
* Database transactions should protect important purchasing operations.

---

## 3. Traffic Estimates

TicketHub has the following expected usage:

* Registered users: 2,000,000.
* Normal daily visitors: 50,000.
* Average pages viewed per visitor: 10.
* Normal daily ticket sales: 5,000.
* Popular concert capacity: 20,000 seats.
* Users attempting to purchase during the popular sale: 200,000.
* Sale duration: 10 minutes.

### 3.1 Normal Traffic Estimates

**Daily page views**

50,000 visitors × 10 pages

= 500,000 page views per day.

**Average page requests per second**

500,000 ÷ 86,400 seconds

= approximately 5.8 page requests per second.

**Average ticket sales per second**

5,000 ÷ 86,400

= approximately 0.058 tickets per second.

This represents relatively manageable daily traffic.

### 3.2 Popular Concert Sale Estimates

During a major concert sale:

200,000 users attempt to purchase tickets within 10 minutes.

10 minutes = 600 seconds.

**Purchase attempts per second**

200,000 ÷ 600

= approximately 333 purchase attempts per second.

**Tickets available per second**

20,000 ÷ 600

= approximately 33 tickets per second.

**Demand compared to supply**

200,000 ÷ 20,000 = 10.

Therefore, approximately 10 people compete for every available seat.

### 3.3 Normal Traffic vs Big Sale Traffic

| Metric                      |                 Normal Traffic |                 Popular Concert Sale |
| --------------------------- | -----------------------------: | -----------------------------------: |
| Visitors/attempts           |                 50,000 per day |                200,000 in 10 minutes |
| Page views                  |                500,000 per day |     Concentrated purchasing requests |
| Average normal request rate |          5.8 page views/second |         333 purchase attempts/second |
| Ticket sales                |                  5,000 per day |                 Maximum 20,000 seats |
| Main challenge              | Normal application performance | Concurrency and database consistency |

The popular concert sale creates a significantly higher concentration of traffic.

The purchase attempt rate is approximately 576 times the normal average ticket sales rate.

This means TicketHub must be designed to handle sudden traffic spikes rather than relying only on its normal daily capacity.

---

## 4. API Design

TicketHub will use REST APIs to allow the frontend to communicate with the backend.

The API will use JSON for request and response data.

| HTTP Method | Endpoint              | Purpose                                   |
| ----------- | --------------------- | ----------------------------------------- |
| GET         | /api/events           | Retrieve available events                 |
| GET         | /api/events/:id       | Retrieve details of a specific event      |
| GET         | /api/events/:id/seats | Retrieve seats and their availability     |
| POST        | /api/events/:id/holds | Temporarily reserve a seat                |
| POST        | /api/orders           | Create an order for a held seat           |
| POST        | /api/orders/:id/pay   | Initiate payment                          |
| POST        | /api/payments/webhook | Receive payment provider confirmation     |
| GET         | /api/users/me/tickets | Retrieve the authenticated user's tickets |

### API Examples

**1. Browse events**

GET /api/events

Returns available concerts and event information.

**2. View available seats**

GET /api/events/101/seats

Returns the seat numbers, prices and availability status for event 101.

**3. Hold a seat**

POST /api/events/101/holds

Example request:

{
"seat_id": 25
}

The backend checks whether the seat is available and temporarily reserves it for the requesting user.

The hold expires after five minutes if payment is not completed.

**4. Create an order**

POST /api/orders

Creates a pending order associated with the authenticated user and their reserved seat.

**5. Initiate payment**

POST /api/orders/500/pay

Initiates payment through the selected payment provider.

**6. View purchased tickets**

GET /api/users/me/tickets

Returns tickets belonging to the authenticated user.

All purchasing endpoints must perform server-side validation and authentication.

Payment webhooks must be verified, and payment processing must be idempotent to prevent duplicate orders.

---

## 5. Database Design

TicketHub will use PostgreSQL as its primary relational database.

The database will contain the following tables.

### 5.1 Users Table

Stores registered customer information.

| Column        | Data Type    | Constraint       |
| ------------- | ------------ | ---------------- |
| id            | BIGINT       | Primary Key      |
| full_name     | VARCHAR(100) | NOT NULL         |
| email         | VARCHAR(150) | UNIQUE, NOT NULL |
| password_hash | TEXT         | NOT NULL         |
| created_at    | TIMESTAMP    | NOT NULL         |

### 5.2 Events Table

Stores information about concerts and other events.

| Column      | Data Type    | Constraint  |
| ----------- | ------------ | ----------- |
| id          | BIGINT       | Primary Key |
| title       | VARCHAR(150) | NOT NULL    |
| venue       | VARCHAR(150) | NOT NULL    |
| event_date  | TIMESTAMP    | NOT NULL    |
| description | TEXT         |             |
| created_at  | TIMESTAMP    | NOT NULL    |

### 5.3 Seats Table

Stores individual seats available for each event.

| Column          | Data Type     | Constraint            |
| --------------- | ------------- | --------------------- |
| id              | BIGINT        | Primary Key           |
| event_id        | BIGINT        | Foreign Key           |
| seat_number     | VARCHAR(20)   | NOT NULL              |
| price           | DECIMAL(10,2) | NOT NULL              |
| status          | VARCHAR(20)   | NOT NULL              |
| held_by_user_id | BIGINT        | Foreign Key, Nullable |
| hold_expires_at | TIMESTAMP     | Nullable              |

The seat status can be:

* Available
* Held
* Sold

A unique constraint on (event_id, seat_number) ensures that the same physical seat is not created twice for one event.

### 5.4 Orders Table

Stores customer purchase information.

| Column         | Data Type     | Constraint  |
| -------------- | ------------- | ----------- |
| id             | BIGINT        | Primary Key |
| user_id        | BIGINT        | Foreign Key |
| total_amount   | DECIMAL(10,2) | NOT NULL    |
| payment_status | VARCHAR(30)   | NOT NULL    |
| created_at     | TIMESTAMP     | NOT NULL    |

Possible payment statuses include:

* Pending
* Paid
* Failed
* Refunded

### 5.5 Order Items Table

Connects orders to the seats purchased.

| Column   | Data Type     | Constraint          |
| -------- | ------------- | ------------------- |
| id       | BIGINT        | Primary Key         |
| order_id | BIGINT        | Foreign Key         |
| seat_id  | BIGINT        | Foreign Key, UNIQUE |
| price    | DECIMAL(10,2) | NOT NULL            |

The UNIQUE constraint on seat_id ensures that a seat cannot appear in multiple successful orders.

### 5.6 Database Relationships

The database has the following relationships:

1. Users to Orders: One-to-Many.

   * One user can create multiple orders.
   * Each order belongs to one user.

2. Events to Seats: One-to-Many.

   * One event has multiple seats.
   * Each seat belongs to one event.

3. Orders to Order Items: One-to-Many.

   * One order can contain multiple seats.
   * Each order item belongs to one order.

4. Seats to Order Items: One-to-One for a seat's lifetime.

   * Each seat can appear in at most one order item.
   * The unique constraint on seat_id enforces this.

---

## 6. Preventing Double Booking

One of the most important challenges in TicketHub is preventing two customers from purchasing the same seat.

Imagine two customers attempt to purchase seat A15 at exactly the same time.

Without proper database protection, both requests might read that the seat is available and attempt to reserve it.

To prevent this, TicketHub will use PostgreSQL transactions, atomic conditional updates and unique constraints.

### 6.1 Atomic Conditional Update

When a customer requests a seat, the backend executes an operation similar to:

UPDATE seats
SET status = 'held',
held_by_user_id = 101,
hold_expires_at = NOW() + INTERVAL '5 minutes'
WHERE id = 25
AND status = 'available'
RETURNING id;

This operation only succeeds if the seat is still available.

PostgreSQL locks the affected row during the update.

If another customer attempts to reserve the same seat, their update must wait for the first transaction to finish.

After the first transaction commits, PostgreSQL rechecks the condition.

The second request will not update the seat because its status is no longer available.

If no row is returned, the backend informs the customer that the seat is unavailable.

### 6.2 Database Transactions

The reservation process will run inside a database transaction.

The process is:

1. Begin a transaction.
2. Check and conditionally update the seat.
3. If the update succeeds, create a pending order.
4. Create an order item.
5. Commit the transaction.
6. If any operation fails, roll back the transaction.

The unique constraint on order_items.seat_id provides an additional layer of protection against duplicate bookings.

### 6.3 Payment Confirmation

The payment provider processes payment outside the database transaction.

After payment succeeds, a verified webhook informs TicketHub.

The backend then uses another database transaction to:

1. Verify that the order is still valid.
2. Confirm that the seat is held by the correct user and the hold has not expired.
3. Mark the order as paid.
4. Mark the seat as sold.
5. Commit the transaction.

If payment fails, the reservation can be released.

Payment webhooks must be processed idempotently so that repeated notifications do not create duplicate purchases.

**Important:** A cache is never responsible for guaranteeing seat ownership. PostgreSQL is the source of truth.

This design ensures that two customers cannot successfully purchase the same seat.

---

## 7. System Architecture

### 7.1 Architecture Diagram

The following architecture shows how TicketHub handles normal traffic and large concert sales.

```
                USERS
                   |
                   v
            CDN / WAF
                   |
                   v
          VIRTUAL WAITING ROOM
                   |
                   v
            LOAD BALANCER
                   |
      +------------+------------+
      |            |            |
      v            v            v
   APP SERVER  APP SERVER  APP SERVER
      |            |            |
      +------------+------------+
                   |
         +---------+---------+
         |                   |
         v                   v
     REDIS CACHE        POSTGRESQL
         |                   |
         |             PRIMARY DATABASE
         |                   |
         |             READ REPLICA
         |
         |
      PAYMENT PROVIDER
         |
         v
    PAYMENT WEBHOOK
         |
         v
   ORDER CONFIRMATION
         |
         v
    TICKET GENERATION
         |
         v
      CUSTOMERS
```

### 7.2 Architecture Components

**1. Users**

Customers access TicketHub using their computers or mobile devices.

**2. CDN and WAF**

The Content Delivery Network serves static files such as images, CSS and JavaScript.

The Web Application Firewall helps protect the application from malicious traffic.

**3. Virtual Waiting Room**

During a popular concert sale, users enter a virtual queue.

The waiting room controls how many users can access the purchasing system at a time.

It assigns queue positions or admission tokens to help maintain fairness and prevent overwhelming the backend.

**4. Load Balancer**

The load balancer distributes incoming requests across multiple application servers.

If one server becomes unavailable, traffic can be redirected to healthy servers.

**5. Application Servers**

These run the Next.js backend.

They handle:

* Authentication.
* Event browsing.
* Seat reservations.
* Order creation.
* Payment processing.
* Ticket retrieval.

The application servers should be stateless so that additional servers can be added easily.

**6. Redis Cache**

Redis stores frequently requested information such as event details and cached seat-map information.

This reduces repeated database queries and improves response times.

However, seat reservations and purchases must always be verified against PostgreSQL.

**7. PostgreSQL Primary Database**

The primary database stores users, events, seats, orders and order items.

All important reservation and purchase operations use database transactions.

**8. PostgreSQL Read Replica**

A read replica handles suitable read-heavy queries, reducing the workload on the primary database.

Purchasing and seat reservation operations remain directed to the primary database.

**9. Payment Provider**

An external payment provider handles customer payments.

Verified webhooks communicate successful or failed payment results back to TicketHub.

**10. Ticket Generation**

After successful payment confirmation, the system generates tickets associated with the customer's order.

### 7.3 How the Architecture Survives a Big Sale

During normal traffic, users can browse events and purchase tickets through the application servers.

When a popular concert goes on sale:

1. The waiting room controls the number of users entering the system.
2. The load balancer distributes admitted requests.
3. Additional application servers can be added through horizontal scaling.
4. Redis serves frequently accessed event and seat-map information.
5. PostgreSQL handles critical reservation operations using transactions.
6. The read replica handles suitable browsing queries.
7. Payment processing occurs through an external provider.
8. Confirmed purchases generate tickets.

This architecture prevents excessive traffic from overwhelming the database while protecting the correctness of ticket purchases.

---

## 8. Trade-offs

### Trade-off 1: Redis Caching vs Data Consistency

Caching event information and seat maps improves performance and reduces database load.

However, cached information can become outdated when another customer reserves a seat.

The solution is to invalidate or update cached seat information after successful reservations.

All final seat availability checks must happen in PostgreSQL.

The trade-off is improved performance at the cost of additional cache-management complexity.

### Trade-off 2: Waiting Room vs Immediate Access

A waiting room protects the backend from sudden traffic spikes and helps control the order in which users enter the purchasing system.

However, customers may have to wait before accessing the website.

The trade-off is that users experience delays in exchange for better system stability and a more controlled purchasing process.

### Trade-off 3: Read Replicas vs Strong Consistency

Read replicas reduce the workload on the primary database and improve read scalability.

However, replication may introduce a delay before updated information becomes available on a replica.

Therefore, critical seat availability and purchasing operations must use the primary database.

The trade-off is improved read performance at the cost of more complicated data consistency management.

---

## 9. Conclusion

TicketHub is designed to support both normal ticket sales and sudden increases in demand during popular concert releases.

The architecture combines horizontal scaling, load balancing, caching, PostgreSQL transactions and a virtual waiting room.

The most important design decision is protecting seat reservations through atomic conditional database updates and unique constraints.

This ensures that customers cannot successfully purchase the same seat twice.

The design prioritizes performance, correctness, fairness and reliability while allowing the platform to grow as its user base increases.
