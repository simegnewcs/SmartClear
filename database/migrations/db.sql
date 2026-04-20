-- በጥሩ ሁኔታ፣ እንደ **DEVVOLTZ** ሲስተም አርክቴክት፣ ይህ የዳታቤዝ አወቃቀር ለ 21ዱ ቢሮዎች (Nodes) ተለዋዋጭነትን እና ግልጽነትን በሚሰጥ መልኩ ተቀርጿል። በ `database/migrations/` ፎልደርህ ውስጥ ልታስቀምጠው የምትችለው የ MySQL Schema ይኸው፦

---

-- ### **SmartClear Database Schema (MySQL)**

-- #### **1. Users Table (ተማሪዎች፣ ሰራተኞች እና አድሚኖች)**
-- ይህ ሰንጠረዥ ሁሉንም የተጠቃሚ አይነቶች ይይዛል።
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    identifier_id VARCHAR(50) UNIQUE NOT NULL, -- Student ID or Staff File Number
    password VARCHAR(255) NOT NULL,
    role ENUM('student', 'staff', 'department_head', 'admin', 'guard') NOT NULL,
    department VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    profile_pic VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

-- #### **2. Clearance Requests (ዋናው የጥያቄ መቆጣጠሪያ)**
-- እያንዳንዱ ሰራተኛ ወይም ተማሪ ጥያቄ ሲጀምር እዚህ ይመዘገባል።
```sql
CREATE TABLE clearance_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    request_type ENUM('graduation', 'withdrawal', 'education_leave', 'retirement', 'resignation') NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'rejected') DEFAULT 'pending',
    final_qr_code TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

-- #### **3. Staff Nodes Status (የ 21ዱ ቢሮዎች ሰንጠረዥ)**
-- ይህ ለሰራተኞች ብቻ የሚያገለግል ሲሆን፣ የ 21ዱንም ቢሮዎች ሁኔታ በአንድ ሰንጠረዥ ይቆጣጠራል።
```sql
CREATE TABLE staff_clearance_nodes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    
    -- Finance Cluster
    regular_budget_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    project_income_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    credit_union_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    revenue_dir_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',

    -- Assets Cluster
    fixed_asset_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    library_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    book_store_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    central_property_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    lab_workshop_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',

    -- Admin & Services Cluster (ሌሎች 12 ቢሮዎች እዚህ ይቀጥላሉ...)
    hr_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    record_office_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    ethics_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    staff_assoc_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    registrar_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    maintenance_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    housing_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    research_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    sports_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    distance_edu_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    general_service_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    supervisor_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES clearance_requests(id)
);
```

-- #### **4. Assets Table (ንብረቶችን ለመከታተል)**
```sql
CREATE TABLE user_assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100),
    status ENUM('held', 'returned', 'missing') DEFAULT 'held',
    proof_image_url VARCHAR(255), -- የሰራተኛው የፎቶ አፕሎድ
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

-- ### **ለምን ይህ አወቃቀር ተመረጠ?**

-- 1.  **Parallel Approvals:** `staff_clearance_nodes` ሰንጠረዥ 21ዱንም ቢሮዎች በአንድ ሮው (Row) ውስጥ ስለሚይዝ፣ ቢሮዎቹ አንዱ ሌላውን ሳይጠብቁ በራሳቸው ሰዓት እንዲያጸድቁ ያደርጋል።
-- 2.  **Audit Trail:** `last_updated` የሚለው ኮለም የትኛው ቢሮ መጨረሻ ላይ እንደፈረመ ለማወቅ ይረዳል።
-- 3.  **Relational Integrity:** `request_id` የጥያቄውን ሁኔታ ከቢሮዎቹ ፊርማ ጋር በጥብቅ ያቆራርጠዋል።

-- ### **ቀጣዩ እርምጃ (Next Step)**
-- ይህንን SQL በ `database/migrations/` ውስጥ አፕላይ ካደረግክ በኋላ፣ ወደ **Backend Logic** እንለፍ? 
-- ወይስ መጀመሪያ እነዚህን 21 ቢሮዎች በዳታቤዝ ውስጥ "Initial Seed" (ዳታ መሙላት) እናድርጋቸው?