# Product Context: Student Study Copilot

## Overview
Student Study Copilot is a web application for students applying to UK universities.  
It has two parts:
- **Backend:** FastAPI (Python, async, modular, PostgreSQL, SQLAlchemy).
- **Frontend:** Next.js (React, TypeScript, TailwindCSS).

## Core Features
1. **User Authentication**
   - Register/Login with JWT authentication.

2. **Chatbot (Student Consultant)**
   - Guides students about admission process in UK universities.
   - Answers relevant admission-related questions.

3. **Eligibility Checker**
   - Collects student academic/personal data.
   - Determines eligibility for admission.
   - Shows missing requirements if not eligible.

4. **University Application**
   - Shows eligible universities.
   - Student selects universities and clicks **Apply**.
   - Admin receives application and can request offer letter.
   - System tracks offer letter request status.
   - When offer letter is received, admin uploads to system.
   - Student can view progress and download offer letter when available.

5. **Document Upload & Interview Scheduling** *(Enhanced)*
   - Student sees required documents for initial application.
   - Student uploads documents.
   - **NEW:** After offer letter received, admin configures interview-specific documents.
   - **NEW:** Admin selects required document types from existing document library.
   - **NEW:** Student uploads additional documents required for interview.
   - **NEW:** Once all interview documents uploaded, student can request interview.
   - **NEW:** Admin receives interview requests and can schedule manually with date, time, location, and meeting link.
   - **NEW:** System tracks interview status: documents_required → requested → scheduled.
   - Student sees real-time interview status and progress with enhanced details.
   - **NEW:** Student document manager shows all documents across applications.
   - **NEW:** After interview conducted, admin marks result as pass/fail with notes.
   - **NEW:** Student sees interview result immediately with feedback.
   - **NEW:** If pass: enables CAS application. If fail: application rejected with clear messaging.

6. **CAS Application** *(Complete Flow)*
   - **STEP 1:** After interview passes, admin configures required CAS documents.
   - **STEP 2:** Student sees list of required CAS documents with descriptions.
   - **STEP 3:** Student uploads each CAS document individually with progress tracking.
   - **STEP 4:** Student submits all CAS documents for processing.
   - **STEP 5:** System shows CAS application in progress with admin processing message.
   - **STEP 6:** Student receives notification when CAS document is ready.
   - **STEP 7:** Student can download CAS document with one-click download.
   - **STEP 8:** Visa application option becomes available after CAS received.

7. **Visa Application** *(Complete Flow)*
   - **STEP 1:** After CAS received, admin configures required visa documents.
   - **STEP 2:** Student sees list of required visa documents with descriptions.
   - **STEP 3:** Student uploads each visa document individually with progress tracking.
   - **STEP 4:** Student submits all visa documents for processing.
   - **STEP 5:** Student clicks "Apply for Visa" button to submit visa application.
   - **STEP 6:** System shows visa application in progress with admin processing message.
   - **STEP 7:** Student receives notification when visa document is ready.
   - **STEP 8:** Student can download visa document with one-click download.
   - **STEP 9:** Application status shows as "Completed" - full journey finished.

8. **Completion**
   - Student's application process is complete after receiving visa.

## Application Status Flow *(Complete)*
```
draft → submitted → under_review → offer_letter_requested → offer_letter_received 
→ interview_documents_required → interview_requested → interview_scheduled 
→ accepted/rejected

CAS Flow (after accepted):
accepted → cas_documents_required → cas_application_in_progress → [CAS received]

Visa Flow (after CAS received):
[CAS received] → visa_documents_required → visa_application_ready 
→ visa_application_in_progress → completed

Complete Flow Logic:
- Interview PASS → CAS flow enabled
- Interview FAIL → Application rejected  
- CAS received → Visa flow enabled
- Visa received → Application completed
```

## New Features Implemented *(Complete CAS & Visa Flows)*
### Backend Enhancements:
- **Interview Flow:** Scheduling, result marking (pass/fail), document configuration
- **CAS Flow:** Document configuration, student upload/submission, admin CAS upload
- **Visa Flow:** Document configuration, student upload/submission, admin visa upload, completion
- **Enhanced Models:** Added CAS and visa fields to Application model
- **New Models:** ApplicationCASDocument, ApplicationVisaDocument for document tracking
- **Complete API:** 30+ endpoints covering interview, CAS, and visa workflows
- **Status Management:** Full application lifecycle from draft to completed

### Frontend Enhancements:
- **Student Interface:** Complete document upload flows for interview, CAS, and visa
- **Admin Interface:** Document configuration, scheduling, result marking, document uploads
- **Progress Tracking:** Real-time status updates across entire application journey
- **Document Management:** Upload, download, and status tracking for all document types
- **Status Visualization:** Clear progress indicators and completion tracking
- **Error Handling:** Comprehensive validation and user feedback
- **Responsive Design:** Mobile-friendly interface for all workflows

## New Database Models *(Complete)*
- **ApplicationInterviewDocument**: Tracks interview-specific document requirements per application
- **ApplicationCASDocument**: Tracks CAS-specific document requirements per application  
- **ApplicationVisaDocument**: Tracks visa-specific document requirements per application
- **Application** (enhanced): Added complete interview, CAS, and visa tracking fields
- **DocumentType**: Existing model used for document selection across all flows

## New API Endpoints
**Admin:**
- `POST /admin/api/applications/{id}/configure-interview-documents`
- `GET /admin/api/applications/{id}/interview-documents`
- `GET /admin/api/applications/interview-requests`

**Student:**
- `GET /applications/{id}/interview-documents`
- `POST /applications/{id}/upload-interview-document`
- `POST /applications/{id}/request-interview`

## Technical Guidelines
- **Backend**
  - Folder structure: `routers/`, `schemas/`, `services/`, `db/`.
  - Use async FastAPI routes.
  - Use Pydantic for request/response schemas.
  - Database: PostgreSQL via SQLAlchemy ORM.
  - Use dependency injection for DB sessions.
  - Use HTTPException for error handling.
  - JWT authentication.

- **Frontend**
  - Folder structure: `components/`, `pages/`, `hooks/`, `utils/`.
  - Next.js + TypeScript + TailwindCSS.
  - Use React Query (or SWR) for API calls.
  - Small, reusable components.
  - Server Components where possible (Next.js 13+).
  - Auth handling via JWT tokens.

- **Testing**
  - Backend: pytest.
  - Frontend: Jest + React Testing Library.

## Rules
- Always prefer simple, modular, production-ready code.
- Avoid unnecessary libraries and complexity.
- Use type hints in Python + TypeScript.
- Only generate code when asked, no explanations unless requested.
