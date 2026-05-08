# SmartClear Enterprise - Complete Testing Guide
## Step-by-Step Testing from Student to Final Exit

---

## **🎯 Overview of Test Flow**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   STUDENT   │───→│ SUPERVISOR  │───→│   NODES     │───→│   GUARD     │
│  (Mobile)   │    │ (Web/Staff) │    │ (8 or 21)   │    │  (Mobile)   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼
  Apply for         Initial            Each staff          Scan QR
  Clearance         Approval           approves            for exit
```

---

## **📱 STEP 1: Student Applies for Clearance (Mobile App)**

### **1.1 Login as Student**
```
App: SmartClear Mobile
ID: STU001
Password: password123
Name: John Doe
```

**Expected Result:**
- Student Dashboard opens
- Can see "Apply for Clearance" button
- Current status: "No active clearance request"

### **1.2 Submit Clearance Request**
```
Action: Tap "Apply for Clearance"
Select: Request Type = "Graduation"
Select: Supervisor = Dr. Abebe Kebede
Add: Personal Information (if prompted)
Submit: Tap "Submit Request"
```

**Expected Result:**
- Success message: "Clearance request submitted"
- Status shows: "Awaiting initial supervisor approval"
- All 8 nodes show as "inactive" (locked)

### **1.3 View Progress**
```
Navigate to: "My Clearance Status"
```

**Expected Result:**
- Request ID displayed
- Status: "Pending Initial Approval"
- Supervisor: Dr. Abebe Kebede
- All nodes: "Waiting for supervisor approval"

---

## **💻 STEP 2: Supervisor Provides Initial Approval (Web Dashboard)**

### **2.1 Login as Department Head**
```
URL: http://localhost:5173 (Web Dashboard)
Email: abebe@smartclear.edu
Password: password123
Role: Department Head
```

**Expected Result:**
- Dashboard loads
- Role badge shows: "Department Head"
- Can see pending initial approvals

### **2.2 View Pending Initial Approvals**
```
Navigate to: Dashboard → Pending Initial Approvals
Look for: John Doe's request (STU001)
```

**Expected Result:**
- List shows: John Doe, Student ID: STU001
- Request Type: Graduation
- Status: "Pending Initial Approval"

### **2.3 Approve Initial Request**
```
Action: Click "Review" on John Doe's request
Action: Select "Approve"
Add Comment: "Approved for graduation clearance"
Click: "Submit Approval"
```

**Expected Result:**
- Success message: "Initial approval granted"
- All 8 nodes now show as "pending" (unlocked)
- Request status changes to: "In Progress"

---

## **💻 STEP 3: Staff Approve Their Assigned Nodes (Web Dashboard)**

### **3.1 Test as Library Staff**

#### **3.1.1 Login as Library Staff**
```
URL: http://localhost:5173
Email: library@smartclear.edu
Password: password123
Role: Staff (Library Officer)
```

**Expected Result:**
- Sidebar shows: "Library Officer"
- Assigned Department: "library status"
- Menu: My Dashboard, Pending Approvals, Approval History

#### **3.1.2 View Pending Approvals**
```
Navigate to: My Dashboard → Pending Approvals
```

**Expected Result:**
- Shows: John Doe's request (STU001)
- Node Status: "pending"
- Applicant Role: "student"

#### **3.1.3 Approve Library Node**
```
Action: Click "Review Request" on John Doe
Action: Select "Approve"
Add Remarks: "All library books returned, no outstanding dues"
Click: "Submit Approval"
```

**Expected Result:**
- Success: "Request approved successfully"
- Library node status changes to: "approved"
- John Doe's clearance progress: 1/8 approved

### **3.2 Test as Sports Staff**

#### **3.2.1 Login as Sports Staff**
```
Email: sports@smartclear.edu
Password: password123
Role: Staff (Sports Officer)
```

#### **3.2.2 View Pending Approvals**
```
Navigate to: Pending Approvals
```

**Expected Result:**
- Shows: John Doe's request
- Can see that Library already approved

#### **3.2.3 Approve Sports Node**
```
Action: Review John Doe's request
Select: "Approve"
Remarks: "Sports equipment returned"
Submit: Approval
```

**Expected Result:**
- Sports node: "approved"
- John Doe's progress: 2/8 approved

### **3.3 Continue with Other Nodes**

Repeat for remaining nodes:
- **Book Store** (BOOK_01) → Approve
- **Housing** (DORM_01) → Approve
- **Registrar** (REG_01) → Approve
- **Batch Advisor** (ADV_CS_01) → Approve
- **Chair Holder** (DEPT_CS) → Approve
- **Cafeteria** (CAFE_01) → Approve

---

## **📱 STEP 4: Student Checks Progress (Mobile App)**

### **4.1 Login as Student**
```
ID: STU001
Password: password123
```

### **4.2 View Clearance Status**
```
Navigate to: My Clearance Status
```

**Expected Result:**
- Overall Status: "In Progress"
- Progress: 8/8 approved (100%)
- All nodes show: "approved"
- QR Code: Generated and displayed

---

## **📱 STEP 5: Guard Scans QR Code (Mobile App)**

### **5.1 Login as Guard**
```
App: SmartClear Guard Module
ID: GUARD_01
Password: password123
Name: Ato Kemal Ahmed
```

### **5.2 Scan Student QR Code**
```
Action: Tap "Scan QR Code"
Camera: Scan John Doe's QR code from his phone
```

**Expected Result:**
- Success beep/vibration
- Shows: "Clearance Verified"
- Student Name: John Doe
- ID: STU001
- Status: "Authorized to Exit"
- Timestamp: Current date/time

### **5.3 View Scan History**
```
Navigate to: Scan History
```

**Expected Result:**
- List shows: John Doe's exit record
- Time: When scanned
- Location: Main Gate (GUARD_01)

---

## **💻 BONUS: Super Admin View (Web Dashboard)**

### **Login as Admin**
```
Email: admin@smartclear.edu
Password: password123
Role: Super Administrator
```

### **View All Clearances**
```
Navigate to: Clearance Requests
```

**Expected Result:**
- Can see ALL requests:
  - John Doe (STU001) - Completed ✅
  - Birtukan (STU002) - In Progress
  - Michael (STU003) - Pending
  - Hanna (STU004) - Completed ✅
  - Library Staff - In Progress (Staff)
  - Finance Staff - Pending (Staff)

### **View Approval Chain**
```
Click on: John Doe's request
```

**Expected Result:**
- Full approval chain visible:
  1. Initial Approval: Dr. Abebe Kebede (2026-05-07 10:00)
  2. Library: Ato Kebede Alemu (2026-05-07 10:30)
  3. Sports: W/ro Helen Asfaw (2026-05-07 11:00)
  4. ... all 8 nodes with timestamps

### **View Analytics**
```
Navigate to: Dashboard → Statistics
```

**Expected Result:**
- Total Clearances: 6
- Completed: 2
- In Progress: 3
- Pending: 1
- By Department breakdown

---

## **🔧 Testing Edge Cases**

### **Test Case 1: Staff Cannot Access Other Departments**

```
Login: library@smartclear.edu
Try to Access: Sports approvals
```

**Expected Result:**
- Sports tab not visible
- Direct URL access shows: "Access Denied"
- Message: "You are not assigned to sports node"

### **Test Case 2: Rejection Flow**

```
Student: STU003 (Michael Solomon)
Supervisor: Rejects initial request
Expected: All nodes remain locked
Student sees: "Request rejected - contact supervisor"
```

### **Test Case 3: Partial Approval Staff View**

```
Login: registrar@smartclear.edu
View: Birtukan Tesfaye (STU002)
Expected: Shows 7/8 approved
Registrar: Only sees their node pending
Cannot see other nodes' status
```

### **Test Case 4: Staff Applying for Clearance**

```
Staff: LIB_01 (Library Staff)
Apply: Retirement clearance
Expected: Goes through all 21 nodes
Login as HR: ADM_HR
Approve: HR node
Expected: Staff can approve their own node even when applying
```

---

## **📝 Quick Test Checklist**

| # | Test | Expected | Status |
|---|------|----------|--------|
| 1 | Student login | Dashboard opens | ☐ |
| 2 | Student apply clearance | Request submitted | ☐ |
| 3 | Supervisor initial approve | Nodes unlocked | ☐ |
| 4 | Staff sees only their node | 1 pending request | ☐ |
| 5 | Staff approve node | Status approved | ☐ |
| 6 | Student sees progress | Progress updated | ☐ |
| 7 | All nodes approved | QR generated | ☐ |
| 8 | Guard scans QR | Verification success | ☐ |
| 9 | Admin sees all | 6 requests visible | ☐ |
| 10 | Staff cannot access other dept | Access denied | ☐ |

---

## **🚨 Troubleshooting**

### **Issue: "Cannot login"**
```
Check: Backend server running (node src/server.js)
Check: Database connection
Check: User exists in database
```

### **Issue: "Staff sees no pending approvals"**
```
Check: Student's initial approval completed
Check: Staff assigned_node matches pending node
Check: clearance_requests.status = 'in_progress'
```

### **Issue: "QR code not generating"**
```
Check: All 8 nodes approved for student
Check: All 21 nodes approved for staff
Check: No rejected nodes
```

---

## **🎬 Summary of Roles Tested**

| Role | Users Tested | Access Level |
|------|--------------|--------------|
| Student | STU001-STU006 | Own clearance only |
| Supervisor | DEPT_CS, DEPT_SE, DEPT_IT | Initial approval |
| Library Staff | LIB_01 | Library node only |
| Sports Staff | SPORT_01 | Sports node only |
| HR Staff | ADM_HR | HR node only |
| Guard | GUARD_01, GUARD_02 | QR scanning only |
| Super Admin | ADMIN001 | Full system access |

---

**Ready to test? Start with Step 1: Login as STU001 on the mobile app!**
