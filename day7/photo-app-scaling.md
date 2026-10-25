# SnapShare: Photo-Sharing App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view a feed containing photos from people they follow.

The following assumptions are used for the calculations:

* Registered users: 10,000,000.
* Daily active users (DAU): 10% of registered users.
* Each daily active user uploads 1 photo per day.
* Each daily active user views 50 feed pages per day.
* Average original photo size: 2 MB.
* Average thumbnail size: 50 KB.
* One day contains 86,400 seconds.
* One year contains 365 days.
* All daily active users are assumed to upload and view feeds throughout the day when calculating average request rates.
* Peak feed traffic is estimated to be 5 times the average feed request rate.
* Each uploaded photo generates one thumbnail.
* Storage estimates assume decimal units: 1 TB = 1,000,000 MB.
* Storage calculations exclude database backups, replication overhead, logs, and temporary files.
* The estimates assume that photos and thumbnails are retained for one year without deletion.

These figures are planning estimates rather than measurements of actual production traffic.

## 2. Daily Active Users

Daily active users are 10% of the 10 million registered users.

Formula:

Daily active users = Registered users × Daily activity percentage

Calculation:

DAU = 10,000,000 × 10%

DAU = 1,000,000 users

Therefore, SnapShare has an estimated **1 million daily active users**.

## 3. Uploads Per Second

Each daily active user uploads one photo per day.

Daily uploads:

Daily uploads = Daily active users × Photos uploaded per user per day

Daily uploads = 1,000,000 × 1

Daily uploads = 1,000,000 photos per day

Average uploads per second:

Uploads per second = Daily uploads ÷ Seconds per day

Uploads per second = 1,000,000 ÷ 86,400

Uploads per second ≈ 11.57

Therefore, SnapShare must handle approximately **12 photo uploads per second on average**.

Actual upload traffic may be higher during busy periods.

## 4. Feed Views Per Second

Each daily active user views 50 feed pages per day.

Daily feed views:

Daily feed views = Daily active users × Feed pages viewed per user per day

Daily feed views = 1,000,000 × 50

Daily feed views = 50,000,000 feed page requests per day

### Average Feed Views Per Second

Average feed views per second = Daily feed views ÷ Seconds per day

Average feed views per second = 50,000,000 ÷ 86,400

Average feed views per second ≈ 578.70

Therefore, SnapShare must handle approximately **579 feed page requests per second on average**.

### Peak Feed Views Per Second

Peak traffic is assumed to be five times the average traffic.

Peak feed views per second = Average feed views per second × Peak multiplier

Peak feed views per second = 578.70 × 5

Peak feed views per second ≈ 2,893.52

Therefore, SnapShare should plan for approximately **2,894 feed page requests per second during peak periods**.

This estimate covers feed page requests, not the additional requests for every individual photo, thumbnail, or other asset displayed on those pages.

## 5. Photo Storage Per Year

Each uploaded photo requires storage for the original image and its thumbnail.

### Original Photo Storage

Daily original photo storage:

Daily original storage = Daily uploads × Average original photo size

Daily original storage = 1,000,000 × 2 MB

Daily original storage = 2,000,000 MB

Annual original photo storage:

Annual original storage = Daily original storage × 365

Annual original storage = 2,000,000 × 365

Annual original storage = 730,000,000 MB

Annual original storage = 730 TB

### Thumbnail Storage

Each photo generates one 50 KB thumbnail.

For this calculation, 50 KB = 0.05 MB.

Daily thumbnail storage:

Daily thumbnail storage = Daily uploads × Thumbnail size

Daily thumbnail storage = 1,000,000 × 0.05 MB

Daily thumbnail storage = 50,000 MB

Annual thumbnail storage:

Annual thumbnail storage = 50,000 × 365

Annual thumbnail storage = 18,250,000 MB

Annual thumbnail storage = 18.25 TB

### Total Annual Photo Storage

Total annual storage = Original photo storage + Thumbnail storage

Total annual storage = 730 TB + 18.25 TB

Total annual storage = 748.25 TB

Therefore, SnapShare requires approximately **748.25 TB of additional storage per year** for original photos and thumbnails.

This estimate assumes that all uploads are retained and that each upload creates one thumbnail. It excludes backups, replicas, and other storage overhead.

## 6. Is SnapShare Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system**.

Each daily active user uploads one photo but views 50 feed pages per day. This produces approximately 50 million feed page requests and 1 million photo uploads per day.

The ratio is:

Feed page requests : Photo uploads = 50 : 1

This means the application receives many more feed requests than photo uploads.

### What This Means for the Design

Because SnapShare is read-heavy, its architecture should prioritize fast and efficient reads.

The design should:

* Use a Content Delivery Network (CDN) to serve photos and thumbnails from locations close to users.
* Cache frequently requested feed data to reduce repeated database queries.
* Use a database read replica to distribute read queries away from the primary database.
* Run multiple application servers behind a load balancer to distribute requests.
* Scale application servers and caching capacity according to traffic.
* Use object storage for image files instead of sending large image data through the database.

The primary database will handle writes, such as saving photo metadata, while the read replica can handle many read queries. The system must still protect the primary database because uploads and other updates require writes.

## 7. Why Photos Should Not Be Stored Inside the Database

SnapShare should store original photos and thumbnails in **object storage**, while keeping their metadata and storage references in the database.

Storing large image files directly in the database would increase database size, backup costs, and the amount of data transferred during database operations.

It would also make database backups and restores more expensive and could reduce the efficiency of database queries.

Object storage is designed to store large numbers of files independently of application servers. It allows SnapShare to scale photo storage without requiring the relational database to manage the actual image contents.

The database should store information such as:

* Photo ID.
* User ID of the uploader.
* Caption.
* Upload timestamp.
* Original photo object key or URL.
* Thumbnail object key or URL.
* Visibility settings.

The actual image files should be stored in object storage, and the CDN should deliver them to users.

## 8. SnapShare Architecture Diagram

The following diagram shows how the major components work together.

```text
                         +----------------------+
                         |        USERS         |
                         | Uploads and Feed     |
                         | Requests             |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |         CDN          |
                         | Caches and serves    |
                         | Photos/Thumbnails    |
                         +----------+-----------+
                                    |
                         Cache miss or API call
                                    |
                                    v
                         +----------------------+
                         |    LOAD BALANCER     |
                         | Distributes API      |
                         | Requests             |
                         +----------+-----------+
                                    |
                       +------------+------------+
                       |            |            |
                       v            v            v
                  +---------+  +---------+  +---------+
                  |  App    |  |  App    |  |  App    |
                  | Server 1|  | Server 2|  | Server 3|
                  +----+----+  +----+----+  +----+----+
                       |            |            |
                       +------------+------------+
                                    |
                    +---------------+---------------+
                    |               |               |
                    v               v               v
             +-------------+  +-------------+  +----------------+
             |    CACHE    |  |  DATABASE   |  | OBJECT STORAGE |
             | Redis-like  |  |   PRIMARY   |  | Original Photos|
             | Feed Data   |  | Metadata and |  | and Thumbnails|
             |             |  | Writes       |  |                |
             +-------------+  +------+------+  +--------+-------+
                                    |                    ^
                                    |                    |
                                    v                    |
                             +-------------+             |
                             |  DATABASE   |             |
                             | READ REPLICA|             |
                             | Read Queries|             |
                             +-------------+             |
                                                         |
                                                         |
                  Photo upload metadata + job            |
                                    |                    |
                                    v                    |
                             +-------------+             |
                             |    QUEUE    |             |
                             | Thumbnail   |             |
                             | Jobs        |             |
                             +------+------+             |
                                    |                    |
                                    v                    |
                             +-------------+             |
                             |   WORKER    |-------------+
                             | Creates     |
                             | Thumbnails  |
                             +-------------+
```

**Diagram note:** The CDN primarily serves cached image files. API requests that require application processing go through the load balancer to the application servers. The application servers can access the cache, database, object storage, and queue as needed. The thumbnail worker reads the original image from object storage, creates a thumbnail, and saves the thumbnail back to object storage.

## 9. Components and the Problems They Solve

1. **Users:** Users upload photos, follow other users, and request feed pages, creating the workload that the system must support.

2. **CDN:** A CDN serves cached photos and thumbnails from geographically distributed locations, reducing latency and traffic reaching the origin infrastructure.

3. **Load balancer:** The load balancer distributes incoming API requests across application servers so that one server does not handle all the traffic.

4. **Application servers:** Application servers handle business logic, authenticate users, validate uploads, generate feed responses, and coordinate interactions with other services.

5. **Cache:** A cache stores frequently requested feed data and other reusable information in fast memory, reducing database load and improving response times.

6. **Primary database:** The primary database stores structured information such as users, follows, photo metadata, captions, and references to image files while handling updates.

7. **Database read replica:** The read replica serves eligible read queries to reduce pressure on the primary database, although replication delay may mean that some recent updates are not immediately visible.

8. **Object storage:** Object storage holds original photos and generated thumbnails separately from the database, providing scalable storage for large image files.

9. **Queue:** The queue records thumbnail-generation jobs so that image processing can happen asynchronously instead of delaying the user's upload response.

10. **Thumbnail worker:** The worker consumes jobs from the queue, retrieves original photos from object storage, creates smaller thumbnails, and stores the results back in object storage.

## 10. Step-by-Step Photo Upload Flow

1. A user signs in and selects a photo to upload through the SnapShare application.

2. The application sends an authenticated upload request to the backend. The load balancer directs the API request to an available application server.

3. The application server validates the user's permissions, checks the file type and size, and rejects invalid uploads.

4. The application server arranges for the original photo to be uploaded to object storage. For larger files, the application could use a pre-signed upload URL so the client can upload directly to object storage without sending the image bytes through the application server.

5. Once the original photo is successfully stored, the application saves the photo metadata in the primary database, including the uploader's ID, caption, timestamp, and object key.

6. The application publishes a thumbnail-generation job to the queue. The job contains the photo ID and the original object's key.

7. The application confirms that the photo has been uploaded successfully. Thumbnail generation can continue in the background.

8. A thumbnail worker retrieves the job from the queue and downloads or reads the original photo from object storage.

9. The worker resizes the image, compresses it, and generates a thumbnail with an approximate target size of 50 KB.

10. The worker uploads the thumbnail to object storage and records its object key in the database.

11. When a user requests a feed, the application retrieves the relevant photo metadata and thumbnail references. It can use the cache and database read replica to serve eligible reads efficiently.

12. The user's device requests the thumbnail through the CDN. If the thumbnail is already cached, the CDN serves it directly; otherwise, it retrieves the image from the origin and may cache it for later requests.

13. If thumbnail processing fails, the system retries the job according to a defined policy and records repeated failures for investigation. The original photo remains available even if thumbnail generation needs to be retried.

## 11. Design Trade-Offs

### Trade-Off 1: Caching vs. Freshness

Caching feed data improves response times and reduces database load. However, cached information can become outdated when a user uploads a new photo, changes a caption, or changes who they follow.

SnapShare should invalidate or update relevant cache entries when data changes and use suitable expiration times. This introduces additional complexity but improves performance.

### Trade-Off 2: Asynchronous Processing vs. Immediate Availability

Generating thumbnails asynchronously allows the application to confirm uploads without waiting for image processing to finish. It also lets thumbnail workers scale independently.

However, the thumbnail may not be available immediately after upload, and jobs can fail or be delayed.

SnapShare should track processing status, retry failed jobs, and display a temporary placeholder until the thumbnail is ready.

### Trade-Off 3: Database Read Replicas vs. Strong Consistency

Read replicas distribute database reads and reduce pressure on the primary database.

However, replication can be delayed, so a user might not immediately see a newly uploaded photo when a feed request is served by a replica.

SnapShare can use the primary database for operations requiring the latest data and use replicas for read queries where slight delays are acceptable.

### Trade-Off 4: Direct Object Storage Uploads vs. Application-Mediated Uploads

Direct uploads to object storage reduce the bandwidth and processing burden on application servers, which can improve scalability.

However, they require secure pre-signed URLs, careful permission checks, and verification that an upload completed successfully before the application records it as available.

Application-mediated uploads can simplify initial implementation and validation, but they consume more application-server bandwidth and resources.

## 12. Conclusion

SnapShare has 10 million registered users and an estimated 1 million daily active users.

The estimated workload is approximately:

* **1,000,000 photo uploads per day.**
* **11.57 photo uploads per second on average.**
* **50,000,000 feed page requests per day.**
* **578.70 feed page requests per second on average.**
* **2,894 feed page requests per second at the estimated peak.**
* **730 TB of original photo storage per year.**
* **18.25 TB of thumbnail storage per year.**
* **748.25 TB of total additional image storage per year.**

SnapShare is read-heavy, so its design emphasizes CDN delivery, caching, database read replicas, and horizontally scalable application servers. Object storage holds image files, while a queue and background workers handle thumbnail generation asynchronously.

This architecture separates image storage, database operations, and background processing, allowing each part to scale according to its workload.
