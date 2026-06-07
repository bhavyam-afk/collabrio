# Content Submission Flow Implementation

## Overview
This implementation enables creators to submit content for accepted collaborations directly from the creator dashboard. The flow includes:
1. Modal opens when creator clicks on an accepted collaboration
2. Shows content status (NOT_SUBMITTED, SUBMITTED, APPROVED, etc.)
3. File upload interface for submitting content
4. S3 integration for secure file storage
5. Real-time status updates

## Files Created/Modified

### 1. API Routes

#### `/app/api/uploads/creatordraft/route.ts` (UPDATED)
- Fixed schema references (`collabStatus` → `collabStatus`, `packageCollaborations` → `content`)
- Integrated with `uploadToS3` utility from existing codebase
- Handles file validation (type, size)
- Updates `PackageCollaboration` table with uploaded content
- Returns upload success with content metadata

**Key Features:**
- Creates or updates `PackageCollaboration` record
- Appends files to `contentDraft` JSON array
- Sets `contentStatus` to "SUBMITTED"
- Stores S3 URLs for future retrieval

#### `/app/api/creator/content/[collabId]/route.ts` (NEW)
- Fetches content status for a specific collaboration
- Returns:
  - `contentStatus`: Current status of submission
  - `uploadedFiles`: Array of uploaded file objects
  - `revisionCount`: Number of improvement requests
  - `feedback`: Brand feedback if available

### 2. Frontend Components

#### `/components/creator/ContentSubmissionModal.tsx` (NEW)
Rich modal component with:
- **Content Status Display**: Shows current status with color-coded indicators
  - 🔴 Red: NOT_SUBMITTED
  - 🔵 Blue: SUBMITTED
  - ✓ Green: APPROVED
- **File Preview**: Lists all uploaded files with links
- **File Upload**: Drag-and-drop or click-to-upload interface
- **File Validation**: Shows allowed types and size limit (500MB)
- **Status-Based UI**:
  - NOT_SUBMITTED: Shows upload interface
  - IMPROVEMENT_REQUESTED: Shows "Submit Revised Content" section
  - APPROVED/REJECTED: Shows status messages
- **Error/Success Handling**: Real-time feedback messages

#### `/app/creator/dashboard/page.tsx` (UPDATED)
Dashboard enhancements:
- **Clickable Collaboration Cards**: Click any active collaboration to open submission modal
- **Content Status Badges**: Shows submission status directly on cards
  - Visual indicator (🔴/🔵/✓)
  - Status label
- **Modal Integration**: Opens with collaboration details
- **State Management**: Tracks modal visibility and content status
- **API Integration**:
  - Fetches content status on modal open
  - Handles file uploads
  - Updates UI on successful upload

### 3. Supporting Files

#### `/types/dashboard.ts` (NEW)
Shared TypeScript types:
- `CollaborationItem`: Collaboration data structure
- `ContentStatus`: Union type for submission states
- `UploadedFile`: File object structure
- `ContentModalState`: Modal state management

## Database Integration

### Schema References
All operations use the existing Prisma schema:

```
PackageCollaboration {
  contentStatus: ContentStatus (enum)
  contentDraft: Json (array of {url, type})
  draftSubmittedAt: DateTime
  revisionCount: Int
  brandFeedback: String
}

Collaboration {
  content: PackageCollaboration (relation)
  collabStatus: CollabStatus (must be ACTIVE)
}
```

## S3 Upload Flow

1. **File Selection**: User picks file from upload modal
2. **Validation**: 
   - File type check (video/mp4, video/quicktime, image/jpeg, image/png, image/webp)
   - File size check (max 500MB)
3. **Upload Process**:
   - File converted to Buffer
   - S3 key generated: `drafts/creators/{creatorId}/collabs/{collabId}/{timestamp}-{filename}`
   - Uploaded via `uploadToS3` utility
4. **Database Update**:
   - Create or update `PackageCollaboration` record
   - Append to `contentDraft` array
   - Set `contentStatus` to "SUBMITTED"
   - Record submission timestamp

## API Responses

### POST /api/uploads/creatordraft
**Request:**
```
FormData {
  file: File
  collabId: string
}
```

**Success Response (200):**
```json
{
  "success": true,
  "fileUrl": "https://bucket.s3.region.amazonaws.com/path",
  "fileName": "original_name.mp4",
  "fileType": "video/mp4",
  "contentType": "video",
  "message": "Content uploaded successfully",
  "collaboration": {
    "id": "collab_id",
    "status": "ACTIVE",
    "contentStatus": "SUBMITTED",
    "uploadedCount": 1
  }
}
```

### GET /api/creator/content/[collabId]
**Success Response (200):**
```json
{
  "contentStatus": "SUBMITTED",
  "uploadedFiles": [
    { "url": "https://...", "type": "video" }
  ],
  "revisionCount": 0,
  "feedback": null
}
```

## User Experience Flow

1. **Dashboard View**:
   - Creator sees active collaborations with status badges
   - Cards show "Click to submit content →" hint

2. **Modal Opens**:
   - Shows collaboration details
   - Displays current content status
   - Lists any previously uploaded files

3. **Content Submission**:
   - If NOT_SUBMITTED: Shows upload interface
   - If IMPROVEMENT_REQUESTED: Shows "Submit Revised Content"
   - If APPROVED: Shows confirmation message

4. **File Upload**:
   - Select file via upload area
   - Real-time validation
   - Upload feedback (success/error)
   - File added to preview list

5. **Status Updates**:
   - Content status changes to "SUBMITTED"
   - Brand receives notification
   - Creator can see all submitted files

## Environment Variables Required
```
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Testing Checklist

- [ ] Creator can click on accepted collaboration
- [ ] Modal opens with correct collaboration details
- [ ] File upload interface loads
- [ ] Can upload video/image files
- [ ] Files are stored in S3
- [ ] Content status updates to "SUBMITTED"
- [ ] Multiple files can be uploaded for same collaboration
- [ ] File size validation works (reject >500MB)
- [ ] File type validation works
- [ ] Success/error messages display correctly
- [ ] Modal can be closed and reopened
- [ ] Content status persists across page refreshes
- [ ] Proper error handling for failed uploads
