
# Fix Plan: Deal Sources Sync and Deep DD Integration

## Issues Identified

1. **Google Sheets sync not importing deals**: The sync function fetches rows but skips them because column headers in the sheet don't match the field mapping. The field mapping expects "Company Name" but the actual sheet likely uses different column names like "Startup Name" or "Name".

2. **Deep DD shows "No deals synced"**: Since no deals are successfully imported into `pipeline_deals`, the Deep DD selector shows an empty state.

3. **Notion sync not functional**: The current implementation just shows a toast message but doesn't actually trigger a sync because it expects MCP data to be passed in manually.

## Solution

### 1. Improve Google Sheets Sync Field Matching

Update `sync-gsheets` edge function to:
- Log actual column headers found in the sheet for debugging
- Use case-insensitive matching for column headers
- Try multiple common variations of column names as fallbacks
- Return better error messages showing what columns were found vs expected

### 2. Add Flexible Column Name Fallbacks

The sync function should try these fallback columns for the name field:
- "Company Name", "Startup Name", "Name", "Company", "Startup", "Title"
- Apply same fallback logic for other fields (Website, Founder, Email, etc.)

### 3. Fix Notion Sync - Use Notion API Directly

Since the project has Notion MCP connected, we can leverage the Notion API directly from an edge function by:
- Adding a `NOTION_API_KEY` secret (users need to create a Notion integration)
- Updating `sync-notion` to fetch directly from Notion API instead of requiring MCP data
- Making it work like the Airtable/GSheets sync (just needs sourceId)

### 4. Improve Sync Feedback

Update the SourceCard component to:
- Show detailed sync results with counts
- Display which fields were successfully mapped
- Show warnings if columns weren't found

## Technical Changes

### A. `supabase/functions/sync-gsheets/index.ts`
- Add logging of actual column headers found
- Implement case-insensitive header matching
- Add fallback column name variations for all fields

### B. `supabase/functions/sync-notion/index.ts`
- Add direct Notion API integration using `NOTION_API_KEY`
- Remove requirement for MCP-provided data
- Query the Notion database directly

### C. `src/pages/DealSources.tsx`
- Remove special Notion handling that just shows toast
- Let Notion sync work like other sources

### D. `src/hooks/useDealSources.ts`
- Remove Notion-specific data requirement
- Simplify sync to just pass sourceId for all types

### E. `src/components/deal-sources/SourceCard.tsx`
- Improve sync result display with detailed feedback
- Show column mapping status

## Implementation Order

1. First fix GSheets sync with better column matching (critical path)
2. Update Notion sync to use direct API
3. Update UI to reflect simpler sync flow
4. Improve feedback/error messaging

## Required Secret

For Notion to work, the user needs to:
1. Create a Notion integration at https://www.notion.so/my-integrations
2. Copy the Internal Integration Token
3. Add it as `NOTION_API_KEY` secret
4. Share their Notion database with the integration
