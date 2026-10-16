# Cohort Integration

## Overview

Minimal refactor to introduce cohort management on top of the existing class/enrollment system.
No changes to existing game logic (XP, level, market share, perks).

> **Current scope:** single-teacher system. Designed to expand to multi-teacher in the future.

---

## Architecture

```
cohorts
   ├── cohort_students          (cohort membership)
   └── class  ←  add cohort_id  (cohort groups classes)
           └── enrolled_students  (unchanged — XP, level, perks live here)
```

---

## Database Changes

### 1. `cohorts` table — NEW

| column | type | notes |
|---|---|---|
| id | UUID PK | |
| name | VARCHAR(255) | required |
| slug | VARCHAR(255) | unique, nullable |
| description | TEXT | |
| status | VARCHAR(50) | `active \| paused \| completed \| archived`, default `active` |
| start_date | TIMESTAMPTZ | |
| end_date | TIMESTAMPTZ | |
| timezone | VARCHAR(100) | |
| teacher_id | UUID FK → users | nullable, ON DELETE SET NULL |
| program_name | VARCHAR(255) | |
| level | VARCHAR(100) | |
| max_students | INT | default 0 |
| is_public | BOOLEAN | default false |
| total_classes | INT | denormalized count, default 0 |
| total_students | INT | denormalized count, default 0 |
| cover_image | TEXT | |
| tags | JSONB | default `[]` |
| created_at | TIMESTAMPTZ | default NOW() |
| updated_at | TIMESTAMPTZ | default NOW() |
| archived_at | TIMESTAMPTZ | nullable |

> `created_by` is omitted — redundant in single-teacher system. Add when multi-teacher is introduced.

**Indexes:**
- `idx_cohorts_status` on `status`
- `idx_cohorts_teacher` on `teacher_id`
- `idx_cohorts_start_date` on `start_date`

---

### 2. `cohort_students` table — NEW

Tracks which students belong to a cohort, independent of class enrollment.

| column | type | notes |
|---|---|---|
| id | UUID PK | |
| cohort_id | UUID FK → cohorts | ON DELETE CASCADE |
| student_id | UUID FK → users | ON DELETE CASCADE |
| joined_at | TIMESTAMPTZ | default NOW() |
| created_at | TIMESTAMPTZ | default NOW() |

Unique constraint: `(cohort_id, student_id)`

---

### 3. `class.cohort_id` — ADD COLUMN

| column | type | notes |
|---|---|---|
| cohort_id | UUID FK → cohorts | nullable, ON DELETE SET NULL |

A class can exist without a cohort (nullable) for backward compatibility.

---

## What Does NOT Change

| table | status |
|---|---|
| `class` | unchanged except new `cohort_id` column |
| `enrolled_students` | fully unchanged |
| XP / level / market share logic | fully unchanged |
| Perks / archtypes | fully unchanged |
| All existing API endpoints | fully unchanged |

---

## Migration Plan

| # | file | status |
|---|---|---|
| 1 | `20260508000000_create_cohorts_table` | ❌ needs fix (TIMESTAMPTZ, remove `created_by`, add FK) |
| 2 | `20260508000001_create_cohort_students` | ❌ pending |
| 3 | `20260508000002_add_cohort_id_to_class` | ❌ pending |

### Fix needed on migration 1
- All `TIMESTAMP` → `TIMESTAMPTZ`
- Remove `created_by` column
- Add FK constraint on `teacher_id` → `users(id)` ON DELETE SET NULL

---

## Prisma Schema

```prisma
model cohorts {
  id             String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name           String            @db.VarChar(255)
  slug           String?           @unique @db.VarChar(255)
  description    String?
  status         String            @default("active") @db.VarChar(50)
  start_date     DateTime?         @db.Timestamptz(6)
  end_date       DateTime?         @db.Timestamptz(6)
  timezone       String?           @db.VarChar(100)
  max_students   Int               @default(0)
  is_public      Boolean           @default(false)
  total_classes  Int               @default(0)
  total_students Int               @default(0)
  cover_image    String?
  tags           Json              @default("[]")
  created_at     DateTime          @default(now()) @db.Timestamptz(6)
  updated_at     DateTime          @default(now()) @db.Timestamptz(6)
  archived_at    DateTime?         @db.Timestamptz(6)

  users           users?            @relation(fields: [teacher_id], references: [id], onDelete: SetNull)
  cohort_students cohort_students[]
  class           Renamedclass[]
}

model cohort_students {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  cohort_id  String   @db.Uuid
  student_id String   @db.Uuid
  joined_at  DateTime @default(now()) @db.Timestamptz(6)
  created_at DateTime @default(now()) @db.Timestamptz(6)

  cohorts cohorts @relation(fields: [cohort_id], references: [id], onDelete: Cascade)
  users   users   @relation(fields: [student_id], references: [id], onDelete: Cascade)

  @@unique([cohort_id, student_id])
}
```

---

## Future: Multi-Teacher Expansion

When the system needs to support multiple teachers:

1. Add `created_by UUID FK → users` to `cohorts`
2. Add a `cohort_teachers` join table `(cohort_id, teacher_id, role)`
3. No changes needed to `cohort_students` or `class`

---

## Useful Queries

### Get all classes in a cohort
```sql
SELECT * FROM class WHERE cohort_id = $1 ORDER BY start_time;
```

### Get all students in a cohort
```sql
SELECT u.* FROM cohort_students cs
JOIN users u ON u.id = cs.student_id
WHERE cs.cohort_id = $1;
```

### Get a student's class history within a cohort
```sql
SELECT es.*, c.name AS class_name, c.start_time
FROM enrolled_students es
JOIN class c ON c.id = es.class_id
WHERE c.cohort_id = $1
  AND es.student_id = $2
ORDER BY c.start_time;
```
