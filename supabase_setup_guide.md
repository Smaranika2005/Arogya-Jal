# Complete Supabase Database Setup Guide

This guide provides everything you need to set up the database for your ASHA Guard Dashboard application.

## 📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **New Project**: Create a new Supabase project
3. **Database Access**: Access to your project's SQL Editor

## 🚀 Quick Setup

### Step 1: Run the Database Script

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire content from `supabase_database_setup.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the script

### Step 2: Verify Tables Created

After running the script, you should see these tables in your **Table Editor**:

- ✅ `profiles` - User profiles table
- ✅ `surveys` - Health surveys table
- ✅ `booths` - Booth assignments table
- ✅ `health_alerts` - Health alerts tracking
- ✅ `notifications` - System notifications
- ✅ `audit_logs` - Action audit trail
- ✅ `survey_details` - View combining surveys and profiles
- ✅ `dashboard_stats` - View for dashboard statistics
- ✅ `asha_worker_stats` - Individual worker statistics
- ✅ `booth_assignments` - Booth assignment details

## 📊 Database Schema Overview

### **profiles Table**
```sql
- id (UUID, Primary Key) - Links to auth.users
- created_at (Timestamp)
- name (Text) - User's full name
- role (Text) - 'asha' or 'government'
- phone (Text, Unique) - Phone number
- email (Text, Unique) - Email address
- is_active (Boolean) - Account status
- last_login (Timestamp) - Last login time
- updated_at (Timestamp)
```

### **surveys Table**
```sql
- id (UUID, Primary Key)
- created_at (Timestamp)
- asha_worker_id (UUID) - References profiles.id
- survey_data (JSONB) - Complete form data
- survey_date (Date)
- booth_number (Text)
- age_group_affected (Text) - 'children', 'adults', 'elderly'
- symptom_duration (Text)
- water_bodies_count (Integer)
- avg_ph (Numeric)
- avg_turbidity (Numeric)
- symptoms (Text Array)
- latitude (Numeric)
- longitude (Numeric)
- water_quality (Text)
- notes (Text)
- updated_at (Timestamp)
```

### **booths Table**
```sql
- id (UUID, Primary Key)
- created_at (Timestamp)
- booth_number (Text, Unique) - Booth identifier
- booth_name (Text) - Booth display name
- location (Text) - Booth location
- latitude (Numeric) - GPS coordinates
- longitude (Numeric) - GPS coordinates
- assigned_asha_worker_id (UUID) - Assigned worker
- is_active (Boolean) - Booth status
- notes (Text) - Additional notes
- updated_at (Timestamp)
```

### **health_alerts Table**
```sql
- id (UUID, Primary Key)
- created_at (Timestamp)
- survey_id (UUID) - Related survey
- asha_worker_id (UUID) - Worker who created alert
- alert_type (Text) - 'critical', 'warning', 'info'
- severity (Text) - 'low', 'medium', 'high', 'critical'
- title (Text) - Alert title
- description (Text) - Alert details
- symptoms (Text Array) - Related symptoms
- affected_count (Integer) - Number of affected people
- status (Text) - 'open', 'investigating', 'resolved', 'closed'
- assigned_to (UUID) - Assigned government official
- resolved_at (Timestamp) - Resolution time
- resolution_notes (Text) - Resolution details
- updated_at (Timestamp)
```

### **notifications Table**
```sql
- id (UUID, Primary Key)
- created_at (Timestamp)
- user_id (UUID) - Target user
- title (Text) - Notification title
- message (Text) - Notification content
- type (Text) - 'info', 'warning', 'error', 'success'
- is_read (Boolean) - Read status
- read_at (Timestamp) - Read time
- action_url (Text) - Optional action link
- updated_at (Timestamp)
```

### **audit_logs Table**
```sql
- id (UUID, Primary Key)
- created_at (Timestamp)
- user_id (UUID) - User who performed action
- action (Text) - Action performed
- table_name (Text) - Affected table
- record_id (UUID) - Affected record
- old_values (JSONB) - Previous values
- new_values (JSONB) - New values
- ip_address (INET) - User IP
- user_agent (Text) - Browser info
```

## 🔐 Security Features

### **Row Level Security (RLS)**
- ✅ **ASHA Workers**: Can only access their own data
- ✅ **Government Users**: Can view all data
- ✅ **Automatic Protection**: All queries are automatically secured

### **Authentication Features**
- ✅ **Email/Password Login**: Secure authentication
- ✅ **Automatic Profile Creation**: Profiles created on signup
- ✅ **Role-based Access**: Different permissions per role
- ✅ **Login Tracking**: Last login timestamps
- ✅ **Account Status**: Active/inactive user management

### **Advanced Features**
- ✅ **Booth Management**: Assign workers to specific booths
- ✅ **Health Alerts**: Track critical health situations
- ✅ **Notifications**: System-wide notification system
- ✅ **Audit Logging**: Track all important actions
- ✅ **Automatic Triggers**: Update timestamps and create profiles

### **Policies Implemented**
- Users can view/update their own profile
- ASHA workers can CRUD their own surveys
- Government users can view all profiles and surveys
- Government users can delete any survey

## 📈 Performance Optimizations

### **Indexes Created**
- Profile role and creation date
- Survey worker ID, dates, and age groups
- GIN index on symptoms array for fast searching
- Location index for geographic queries

### **Views for Easy Queries**
- `survey_details` - Surveys with worker information
- `dashboard_stats` - Pre-calculated statistics

## 🧪 Testing Your Setup

### **Test Queries**

1. **Check if tables exist:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'surveys');
```

2. **View dashboard statistics:**
```sql
SELECT * FROM dashboard_stats;
```

3. **Check RLS policies:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'surveys');
```

## 🔧 Configuration for Your App

### **Environment Variables**
Add these to your `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### **Get Your Credentials**
1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the **Project URL** and **anon public** key

## 📝 Sample Data Structure

### **Profile Example**
```json
{
  "id": "uuid-here",
  "name": "Dr. Priya Sharma",
  "role": "asha",
  "phone": "+91-9876543210",
  "email": "priya@example.com"
}
```

### **Survey Example**
```json
{
  "id": "uuid-here",
  "asha_worker_id": "uuid-here",
  "survey_data": {
    "surveyDate": "2024-01-15",
    "boothNumber": "B001",
    "ageGroupAffected": "children",
    "symptomDuration": "3-5 days",
    "waterBodiesCount": 5,
    "avgPH": 7.2,
    "avgTurbidity": 2.1
  },
  "symptoms": ["Diarrhoea", "Vomiting", "Fever"],
  "latitude": 28.6139,
  "longitude": 77.2090,
  "notes": "High incidence in children"
}
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Permission Denied**
   - Check if RLS is enabled
   - Verify user authentication
   - Check policy conditions

2. **Foreign Key Errors**
   - Ensure profiles are created before surveys
   - Check UUID format and references

3. **Index Errors**
   - Some indexes might fail if data exists
   - Drop and recreate if needed

### **Reset Database**
If you need to start over:
```sql
-- Drop views first
DROP VIEW IF EXISTS dashboard_stats;
DROP VIEW IF EXISTS survey_details;

-- Drop tables
DROP TABLE IF EXISTS surveys CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## 📊 Useful Queries

### **Get All Surveys with Worker Names**
```sql
SELECT 
  s.id,
  s.survey_date,
  s.booth_number,
  s.symptoms,
  p.name as worker_name
FROM surveys s
JOIN profiles p ON s.asha_worker_id = p.id
ORDER BY s.created_at DESC;
```

### **Get Symptom Statistics**
```sql
SELECT 
  unnest(symptoms) as symptom,
  COUNT(*) as frequency
FROM surveys
GROUP BY unnest(symptoms)
ORDER BY frequency DESC;
```

### **Get Water Quality Trends**
```sql
SELECT 
  survey_date,
  AVG(avg_ph) as avg_ph,
  AVG(avg_turbidity) as avg_turbidity,
  COUNT(*) as survey_count
FROM surveys
WHERE avg_ph IS NOT NULL AND avg_turbidity IS NOT NULL
GROUP BY survey_date
ORDER BY survey_date;
```

## ✅ Verification Checklist

- [ ] Database script executed successfully
- [ ] Tables created (profiles, surveys)
- [ ] Views created (survey_details, dashboard_stats)
- [ ] RLS policies active
- [ ] Indexes created
- [ ] Triggers working
- [ ] Environment variables set
- [ ] Test queries working

Your database is now ready for the ASHA Guard Dashboard application! 🎉
