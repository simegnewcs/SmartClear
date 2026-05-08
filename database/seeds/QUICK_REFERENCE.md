# SmartClear Enterprise - Test User Quick Reference

## 🔑 Login Credentials
**Password for ALL users:** `password123`

---

## 👑 1. SUPER ADMIN (Full Access)

| Name | ID | Email | Access |
|------|-----|-------|--------|
| Super Administrator | ADMIN001 | admin@smartclear.edu | **ALL** modules, users, clearances, settings |

**Login:**
- **Web Dashboard:** Use email `admin@smartclear.edu`
- **Mobile App:** Use ID `ADMIN001`

**What they can do:**
- View ALL student clearances (8 nodes)
- View ALL staff clearances (21 nodes)
- See complete approval chains
- Manage users and assign approvers
- View audit logs
- Generate analytics

---

## 👨‍🏫 2. STUDENT APPROVAL TEAM (8 Staff Members)

These staff can only see student clearance requests at their assigned node:

| # | Name | ID | Assigned Node | Email |
|---|------|-----|----------------|-------|
| 1 | Dr. Solomon Bekele | ADV_CS_01 | **Batch Advisor** | solomon@smartclear.edu |
| 2 | Dr. Martha Belay | ADV_SE_01 | **Batch Advisor** | martha@smartclear.edu |
| 3 | Ato Kebede Alemu | LIB_01 | **Library** | library@smartclear.edu |
| 4 | W/ro Helen Asfaw | SPORT_01 | **Sports** | sports@smartclear.edu |
| 5 | Ato Girma Hailu | BOOK_01 | **Book Store** | bookstore@smartclear.edu |
| 6 | W/ro Tigist Worku | DORM_01 | **Housing** | housing@smartclear.edu |
| 7 | Ato Dawit Mengistu | CAFE_01 | **Cafeteria** | cafeteria@smartclear.edu |
| 8 | W/ro Genet Assefa | REG_01 | **Registrar** | registrar@smartclear.edu |

**Login:**
- **Web Dashboard:** Use email (e.g., `library@smartclear.edu`)
- **Mobile App:** Use ID (e.g., `LIB_01`)

**What they can do:**
- View pending clearances at their node ONLY
- Approve/Reject with remarks
- Cannot access other departments
- Cannot access admin pages

---

## 👔 3. ADDITIONAL APPROVAL TEAM (13 Staff Members)

These staff handle the extra nodes for staff clearances:

| # | Name | ID | Assigned Node | Email |
|---|------|-----|----------------|-------|
| 1 | Dr. Behailu Mesfin | SUPER_01 | **Supervisor** | supervisor@smartclear.edu |
| 2 | Ato Yohannes Kassa | FIN_PROJ | **Project Income** | project@smartclear.edu |
| 3 | W/ro Bethlehem Tadesse | FIN_CREDIT | **Credit Union** | credit@smartclear.edu |
| 4 | Ato Tesfaye Alemu | FIN_REV | **Revenue Director** | revenue@smartclear.edu |
| 5 | Ato Fitsum Getachew | ASSET_FIXED | **Fixed Asset** | fixedasset@smartclear.edu |
| 6 | W/ro Meseret Haile | ASSET_CENT | **Central Property** | centralprop@smartclear.edu |
| 7 | Ato Amanuel Tesfaye | ASSET_LAB | **Lab & Workshop** | lab@smartclear.edu |
| 8 | Dr. Frehiwot Assefa | ADM_HR | **HR** | hr@smartclear.edu |
| 9 | W/ro Almaz Bekele | ADM_REC | **Record Office** | records@smartclear.edu |
| 10 | Ato Biniam Alemayehu | ADM_ETHICS | **Ethics** | ethics@smartclear.edu |
| 11 | Ato Samuel Negash | ADM_MAINT | **Maintenance** | maintenance@smartclear.edu |
| 12 | W/ro Hanna Girma | ADM_ASSOC | **Staff Association** | association@smartclear.edu |
| 13 | Ato Daniel Bekele | ADM_DIST | **Distance Education** | distance@smartclear.edu |
| 14 | Ato Elias Worku | ADM_GEN | **General Service** | general@smartclear.edu |
| 15 | Dr. Rahel Tadesse | ADM_RES | **Research** | research@smartclear.edu |

**Login:** Same as above

**What they can do:**
- View staff clearance requests at their node
- Approve/Reject with remarks
- Cannot see student clearances (unless assigned to shared node)

---

## 🎓 4. STUDENTS (6 Users)

| # | Name | ID | Department | Email |
|---|------|-----|------------|-------|
| 1 | John Doe | STU001 | Computer Science | john@student.smartclear.edu |
| 2 | Birtukan Tesfaye | STU002 | Software Engineering | birtukan@student.smartclear.edu |
| 3 | Michael Solomon | STU003 | Computer Science | michael@student.smartclear.edu |
| 4 | Hanna Abera | STU004 | Information Technology | hanna@student.smartclear.edu |
| 5 | Dawit Mekonnen | STU005 | Software Engineering | dawit@student.smartclear.edu |
| 6 | Saron Bekele | STU006 | Computer Science | saron@student.smartclear.edu |

**Login:**
- **Mobile App Only:** Use ID (e.g., `STU001`)
- Students cannot access Web Dashboard

**What they can do:**
- Apply for clearance (graduation, withdrawal, etc.)
- View their clearance progress
- See QR code when approved

---

## 🛡️ 5. GUARDS (2 Users)

| # | Name | ID | Location | Email |
|---|------|-----|----------|-------|
| 1 | Ato Kemal Ahmed | GUARD_01 | Main Gate | guard1@smartclear.edu |
| 2 | Ato Nur Hussein | GUARD_02 | Back Gate | guard2@smartclear.edu |

**Login:**
- **Mobile App:** Use ID (e.g., `GUARD_01`)

**What they can do:**
- Scan QR codes for exit verification
- View scan history

---

## 📋 6. DEPARTMENT HEADS (3 Users)

| # | Name | ID | Department | Email |
|---|------|-----|------------|-------|
| 1 | Dr. Abebe Kebede | DEPT_CS | Computer Science | abebe@smartclear.edu |
| 2 | Dr. Selam Tadesse | DEPT_SE | Software Engineering | selam@smartclear.edu |
| 3 | Prof. Yonas Girma | DEPT_IT | Information Technology | yonas@smartclear.edu |

**Login:**
- **Web Dashboard:** Use email
- **Mobile App:** Use ID

**What they can do:**
- Provide initial approval for staff clearances
- Can also act as approvers for their department nodes

---

## 🧪 Test Scenarios

### Scenario 1: Test Student Clearance Flow
1. **Login as Student:** `STU001` / `password123` (Mobile App)
2. **Apply for graduation clearance**
3. **Login as Supervisor:** `ADV_CS_01` / `password123` (Web Dashboard)
4. **Approve initial request**
5. **Login as Library Staff:** `LIB_01` / `password123`
6. **Approve Library node**
7. **Continue with other nodes...**

### Scenario 2: Test Staff Clearance Flow
1. **Login as Library Staff (applying):** `LIB_01` / `password123`
2. **Submit clearance request**
3. **Login as Supervisor:** `SUPER_01` / `password123`
4. **Approve initial request**
5. **Login as HR Staff:** `ADM_HR` / `password123`
6. **Approve HR node**
7. **Continue with all 21 nodes...**

### Scenario 3: Test Super Admin View
1. **Login as Admin:** `ADMIN001` / `password123` (Web Dashboard)
2. **View all clearances**
3. **Check approval chains**
4. **View analytics**
5. **Assign new approvers**

### Scenario 4: Test Guard QR Scan
1. **Complete a clearance** (all nodes approved)
2. **Login as Guard:** `GUARD_01` / `password123` (Mobile App)
3. **Scan the generated QR code**
4. **Verify exit authorization**

---

## 🗄️ Running the Sample Data

```sql
-- 1. First, run the schema creation (if not already done)
-- source database/migrations/db.sql

-- 2. Insert sample users
source database/seeds/sample_users.sql

-- 3. Insert sample clearances
source database/seeds/sample_clearances.sql
```

Or in MySQL:
```bash
mysql -u root -p smartclear_db < database/seeds/sample_users.sql
mysql -u root -p smartclear_db < database/seeds/sample_clearances.sql
```

---

## 📊 Sample Clearance Status Summary

| Student | Clearance Status | Approved Nodes | Pending Nodes |
|---------|------------------|----------------|---------------|
| John Doe (STU001) | In Progress | 5/8 | Library, Cafeteria |
| Birtukan (STU002) | In Progress | 7/8 | Registrar |
| Michael (STU003) | Pending | 0/8 | Awaiting initial approval |
| Hanna (STU004) | **Completed** | 8/8 | ✅ QR Generated |

| Staff | Clearance Status | Approved Nodes | Pending Nodes |
|-------|------------------|----------------|---------------|
| Library Staff | In Progress | 12/21 | Multiple |
| Finance Staff | Pending | 0/21 | Awaiting initial approval |

---

**Total Users Created:** 35
- 1 Super Admin
- 3 Department Heads
- 23 Staff (8 + 15)
- 2 Guards
- 6 Students
