-- ============================================================================
-- LEARNNOVA COMPLETE RELATIONAL DATABASE SCHEMA & MIGRATION SCRIPT
-- Compatible with Supabase PostgreSQL
-- ============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fee_status_type') THEN
        CREATE TYPE fee_status_type AS ENUM ('Paid', 'Pending', 'Overdue', 'Partially Paid', 'Cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challan_status_type') THEN
        CREATE TYPE challan_status_type AS ENUM ('Generated', 'Sent', 'Paid', 'Pending', 'Overdue', 'Cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
        CREATE TYPE payment_method_type AS ENUM ('Cash', 'Bank', 'Online', 'Card', 'Cheque');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_type') THEN
        CREATE TYPE payment_status_type AS ENUM ('Completed', 'Pending', 'Failed', 'Refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_type') THEN
        CREATE TYPE attendance_status_type AS ENUM ('Present', 'Absent', 'Late', 'Excused');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_status_type') THEN
        CREATE TYPE exam_status_type AS ENUM ('Scheduled', 'Ongoing', 'Completed', 'Cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'homework_status_type') THEN
        CREATE TYPE homework_status_type AS ENUM ('Active', 'Closed', 'Draft');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status_type') THEN
        CREATE TYPE submission_status_type AS ENUM ('Pending', 'Submitted', 'Graded', 'Late');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
        CREATE TYPE user_role_type AS ENUM ('admin', 'teacher', 'student', 'parent', 'accountant');
    END IF;
END $$;

-- 2. CORE TABLES

CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    logo_url TEXT,
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    numeric_order INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    qualification VARCHAR(255),
    join_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    room_number VARCHAR(50),
    class_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, name)
);

CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) DEFAULT 'Father',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    cnic VARCHAR(50),
    address TEXT,
    occupation VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id_code VARCHAR(50) UNIQUE NOT NULL,
    guardian_id UUID REFERENCES guardians(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(20),
    dob DATE,
    admission_date DATE NOT NULL,
    current_class_id UUID REFERENCES classes(id),
    current_section_id UUID REFERENCES sections(id),
    roll_number VARCHAR(50),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(100),
    avatar_url TEXT,
    fee_status fee_status_type DEFAULT 'Pending',
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    lead_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE(class_id, subject_id)
);

CREATE TABLE IF NOT EXISTS subject_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    topic_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_topic_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES subject_topics(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    in_progress BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    UNIQUE(student_id, topic_id)
);

CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    due_day_of_month INT DEFAULT 10,
    late_fee_amount DECIMAL(10, 2) DEFAULT 200.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, class_id)
);

CREATE TABLE IF NOT EXISTS fee_structure_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
    fee_head_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(20) DEFAULT 'percentage',
    value DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    discount_id UUID NOT NULL REFERENCES discounts(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, discount_id, session_id)
);

CREATE TABLE IF NOT EXISTS challans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    challan_number VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    session_id UUID REFERENCES academic_sessions(id),
    billing_month VARCHAR(50) NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    base_amount DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    previous_balance DECIMAL(10, 2) DEFAULT 0.00,
    late_fee DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    status challan_status_type DEFAULT 'Pending',
    paid_date DATE,
    payment_method payment_method_type,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challan_id UUID NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
    item_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    transaction_code VARCHAR(100) UNIQUE NOT NULL,
    challan_id UUID NOT NULL REFERENCES challans(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method payment_method_type NOT NULL,
    reference_number VARCHAR(100),
    receipt_url TEXT,
    status payment_status_type DEFAULT 'Completed',
    verified_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status attendance_status_type NOT NULL DEFAULT 'Present',
    remarks VARCHAR(255),
    marked_by UUID REFERENCES teachers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);

CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    session_id UUID REFERENCES academic_sessions(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    total_marks DECIMAL(5, 2) NOT NULL DEFAULT 100.00,
    description TEXT,
    status exam_status_type DEFAULT 'Scheduled',
    results_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5, 2) NOT NULL,
    percentage DECIMAL(5, 2),
    grade VARCHAR(10),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS homework (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    status homework_status_type DEFAULT 'Active',
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homework_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    file_url TEXT,
    file_name VARCHAR(255),
    submission_text TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status submission_status_type DEFAULT 'Submitted',
    grade VARCHAR(10),
    teacher_feedback TEXT,
    graded_at TIMESTAMPTZ,
    UNIQUE(homework_id, student_id)
);

CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    period_number INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    room_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id UUID,
    audience VARCHAR(50) NOT NULL,
    target_class_id UUID REFERENCES classes(id),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    recipient_type user_role_type NOT NULL,
    recipient_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    action_link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    actor_id UUID,
    actor_role VARCHAR(50),
    action_type VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRIGGERS & PROCEDURES

CREATE OR REPLACE FUNCTION fn_calculate_grade_and_percentage()
RETURNS TRIGGER AS $$
DECLARE
    v_total_marks DECIMAL(5, 2);
BEGIN
    SELECT total_marks INTO v_total_marks FROM exams WHERE id = NEW.exam_id;
    IF v_total_marks > 0 THEN
        NEW.percentage := ROUND((NEW.marks_obtained / v_total_marks) * 100, 2);
        
        IF NEW.percentage >= 90 THEN
            NEW.grade := 'A+';
        ELSIF NEW.percentage >= 80 THEN
            NEW.grade := 'A';
        ELSIF NEW.percentage >= 70 THEN
            NEW.grade := 'B+';
        ELSIF NEW.percentage >= 60 THEN
            NEW.grade := 'B';
        ELSIF NEW.percentage >= 50 THEN
            NEW.grade := 'C';
        ELSIF NEW.percentage >= 40 THEN
            NEW.grade := 'D';
        ELSE
            NEW.grade := 'F';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_exam_grade ON exam_results;
CREATE TRIGGER trg_calculate_exam_grade
BEFORE INSERT OR UPDATE ON exam_results
FOR EACH ROW EXECUTE FUNCTION fn_calculate_grade_and_percentage();

CREATE OR REPLACE FUNCTION fn_process_payment_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'Completed' THEN
        UPDATE challans 
        SET status = 'Paid',
            paid_date = NEW.payment_date,
            payment_method = NEW.payment_method,
            updated_at = NOW()
        WHERE id = NEW.challan_id;

        UPDATE students
        SET fee_status = 'Paid',
            updated_at = NOW()
        WHERE id = NEW.student_id;

        INSERT INTO audit_logs(school_id, action_type, target_entity, target_id, details)
        VALUES (
            NEW.school_id,
            'PAYMENT_RECORDED',
            'payments',
            NEW.id,
            json_build_object('amount', NEW.amount_paid, 'challan_id', NEW.challan_id, 'method', NEW.payment_method)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_processed ON payments;
CREATE TRIGGER trg_payment_processed
AFTER INSERT OR UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION fn_process_payment_completion();

-- 4. BATCH MONTHLY CHALLAN GENERATOR
CREATE OR REPLACE FUNCTION sp_generate_monthly_challans(
    p_school_id UUID,
    p_session_id UUID,
    p_billing_month VARCHAR(50),
    p_due_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_student RECORD;
    v_fee_structure RECORD;
    v_item RECORD;
    v_challan_id UUID;
    v_base_amount DECIMAL(10, 2);
    v_discount_pct DECIMAL(10, 2);
    v_discount_val DECIMAL(10, 2);
    v_total_amount DECIMAL(10, 2);
    v_challan_count INT := 0;
    v_challan_no VARCHAR(100);
BEGIN
    FOR v_student IN 
        SELECT s.id, s.current_class_id, s.student_id_code 
        FROM students s 
        WHERE (s.school_id = p_school_id OR p_school_id IS NULL) AND s.status = 'Active'
    LOOP
        SELECT fs.id, fs.late_fee_amount 
        INTO v_fee_structure 
        FROM fee_structures fs 
        WHERE fs.class_id = v_student.current_class_id 
        LIMIT 1;

        IF v_fee_structure.id IS NOT NULL THEN
            SELECT COALESCE(SUM(amount), 0) INTO v_base_amount 
            FROM fee_structure_items 
            WHERE fee_structure_id = v_fee_structure.id;

            SELECT COALESCE(SUM(d.value), 0) INTO v_discount_pct
            FROM student_discounts sd
            JOIN discounts d ON d.id = sd.discount_id
            WHERE sd.student_id = v_student.id AND d.is_active = TRUE;

            v_discount_val := ROUND((v_base_amount * (v_discount_pct / 100)), 2);
            v_total_amount := v_base_amount - v_discount_val;

            v_challan_no := 'CHL-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-' || LPAD((v_challan_count + 1)::TEXT, 4, '0');

            INSERT INTO challans (
                school_id, challan_number, student_id, session_id,
                billing_month, issue_date, due_date, base_amount,
                discount_amount, total_amount, status
            ) VALUES (
                COALESCE(p_school_id, (SELECT id FROM schools LIMIT 1)),
                v_challan_no, v_student.id, p_session_id,
                p_billing_month, CURRENT_DATE, p_due_date, v_base_amount,
                v_discount_val, v_total_amount, 'Pending'
            ) RETURNING id INTO v_challan_id;

            FOR v_item IN SELECT fee_head_name, amount FROM fee_structure_items WHERE fee_structure_id = v_fee_structure.id
            LOOP
                INSERT INTO challan_items (challan_id, item_name, amount)
                VALUES (v_challan_id, v_item.fee_head_name, v_item.amount);
            END LOOP;

            UPDATE students SET fee_status = 'Pending' WHERE id = v_student.id;
            v_challan_count := v_challan_count + 1;
        END IF;
    END LOOP;

    RETURN json_build_object('success', true, 'challans_generated', v_challan_count);
END;
$$ LANGUAGE plpgsql;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- For frontend client direct queries
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE challans ENABLE ROW LEVEL SECURITY;
ALTER TABLE challan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    t text;
BEGIN 
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public access policy" ON %I;', t);
        EXECUTE format('CREATE POLICY "Public access policy" ON %I FOR ALL USING (true) WITH CHECK (true);', t);
    END LOOP;
END $$;

-- 6. SEED DATA (INITIAL SCHOOL ROSTER)
INSERT INTO schools (name, code, address, phone, email)
VALUES ('LearnNova Model Academy', 'SCH-001', 'Main Campus, Gulshan Block 4, Karachi', '+92 21 34567890', 'info@learnnova.edu.pk')
ON CONFLICT (code) DO NOTHING;

DO $$ 
DECLARE
    v_sch_id UUID;
    v_ses_id UUID;
    v_c8 UUID; v_c9 UUID; v_c10 UUID;
    v_s8a UUID; v_s8b UUID;
    v_t1 UUID; v_t2 UUID;
BEGIN
    SELECT id INTO v_sch_id FROM schools WHERE code = 'SCH-001' LIMIT 1;
    
    INSERT INTO academic_sessions (school_id, name, start_date, end_date, is_current)
    VALUES (v_sch_id, '2025-2026', '2025-08-01', '2026-06-30', TRUE)
    RETURNING id INTO v_ses_id;

    INSERT INTO classes (school_id, name, numeric_order) VALUES (v_sch_id, 'Class 8', 8) RETURNING id INTO v_c8;
    INSERT INTO classes (school_id, name, numeric_order) VALUES (v_sch_id, 'Class 9', 9) RETURNING id INTO v_c9;
    INSERT INTO classes (school_id, name, numeric_order) VALUES (v_sch_id, 'Class 10', 10) RETURNING id INTO v_c10;

    INSERT INTO teachers (school_id, employee_code, name, email, phone, qualification, join_date)
    VALUES (v_sch_id, 'EMP-001', 'Sadia Rahman', 'sadia.rahman@school.edu.pk', '+92 300 1112233', 'MSc Mathematics', '2021-08-15')
    RETURNING id INTO v_t1;

    INSERT INTO teachers (school_id, employee_code, name, email, phone, qualification, join_date)
    VALUES (v_sch_id, 'EMP-002', 'Kamran Akhtar', 'kamran.akhtar@school.edu.pk', '+92 301 2223344', 'MSc Physics', '2020-03-10')
    RETURNING id INTO v_t2;

    INSERT INTO sections (class_id, name, room_number, class_teacher_id) VALUES (v_c8, 'A', '201', v_t1) RETURNING id INTO v_s8a;
    INSERT INTO sections (class_id, name, room_number, class_teacher_id) VALUES (v_c8, 'B', '202', v_t2) RETURNING id INTO v_s8b;

    INSERT INTO subjects (school_id, code, name, lead_teacher_id) VALUES (v_sch_id, 'MATH-101', 'Mathematics', v_t1);
    INSERT INTO subjects (school_id, code, name, lead_teacher_id) VALUES (v_sch_id, 'PHY-101', 'Physics', v_t2);

    INSERT INTO students (school_id, student_id_code, name, gender, dob, admission_date, current_class_id, current_section_id, roll_number, address, phone, fee_status)
    VALUES 
    (v_sch_id, 'STU-2026-00124', 'Ahmed Khan', 'Male', '2012-05-14', '2024-03-15', v_c8, v_s8b, '24', 'House 24, Gulshan, Karachi', '+92 300 1234567', 'Pending'),
    (v_sch_id, 'STU-2026-00125', 'Fatima Siddiqui', 'Female', '2011-09-22', '2023-08-10', v_c9, v_s8a, '01', 'DHA Phase 2, Karachi', '+92 301 2345678', 'Paid');
END $$;
