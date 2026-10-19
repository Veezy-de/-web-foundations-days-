# School Database Design

## 1. Tables and Their Purposes

### Students Table

The `students` table stores information about students. It contains `student_id`, `name`, and `email`. The `student_id` column is the primary key and uniquely identifies each student. The name and email columns cannot be NULL, and the email column has a UNIQUE constraint to prevent two students from registering with the same email address.

### Courses Table

The `courses` table stores information about the courses offered by the school. It contains `course_id` and `course_name`. The `course_id` column is the primary key, while `course_name` is required and unique so that the same course name cannot be entered twice.

### Enrolments Table

The `enrolments` table records which students take which courses. It contains `enrolment_id`, `student_id`, `course_id`, and `grade`. The `enrolment_id` column is the primary key. The `student_id` and `course_id` columns are foreign keys that reference the students and courses tables. Both foreign keys are required. The grade records the student's result for a particular course and can remain NULL until a grade is assigned. A UNIQUE constraint on `(student_id, course_id)` prevents the same student from enrolling in the same course more than once.

## 2. Relationships Between the Tables

The relationship between students and enrolments is one-to-many because one student can have several enrolment records, while each enrolment belongs to one student. Similarly, the relationship between courses and enrolments is one-to-many because one course can have many enrolments, while each enrolment refers to one course.

Students and courses have a many-to-many relationship. A student can enrol in several courses, and a course can have several students. A join table, called `enrolments`, is needed to represent this relationship in a relational database. It connects the two tables using foreign keys and also stores information about the relationship, such as the student's grade for a course.

## 3. Index Recommendation

I would add an index on the `enrolments.course_id` column to help the database find enrolments belonging to a particular course more efficiently. This could improve queries that list all students on a course and queries that count the students enrolled in each course. Although the UNIQUE constraint and primary keys already create indexes in SQLite, an explicit index on `course_id` can still be useful because it is not the leading column of the composite UNIQUE constraint `(student_id, course_id)`.

Example:

```sql
CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);
```

## 4. SQL or NoSQL?

I would choose a relational SQL database for this school system. The data has clear relationships between students, courses, and enrolments, and SQL provides primary keys, foreign keys, UNIQUE constraints, and transactions to help maintain data accuracy. SQL also makes it straightforward to join tables, count enrolments, and update grades. A NoSQL database could be useful for some systems with highly flexible or document-oriented data, but this school system benefits more from the structured data and relationship management offered by a relational database such as SQLite.
