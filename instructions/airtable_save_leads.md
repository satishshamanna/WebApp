# airtable_save_leads Workflow

This workflow uploads a list of lead dictionaries into a designated Airtable base and table.

## Logic Steps

1. **Load Environment Settings**: Retrieve `AIRTABLE_API_TOKEN`, `AIRTABLE_BASE_ID`, and `AIRTABLE_TABLE_NAME` from the environment.
2. **Initialize Airtable Client**:
   - Create a `pyairtable.Table` instance using the token, base ID, and table name.
3. **Format Records**: Map the list of lead dictionaries into the format required by Airtable (`{"fields": {...}}`):
   - `name`: Business name (string)
   - `service`: The service/industry category (string)
   - `address`: Full address (string)
   - `website`: Website URL (string or empty/None)
   - `rating`: Rating (float or None)
   - `email`: Extracted email address (string or None)
   - `phone_number`: Extracted phone number (string or None)
   - `date_created`: ISO 8601 date string
   - `status`: String (e.g. `"lead"`)
4. **Batch Upload**:
   - Upload records using `table.batch_create()`.
   - Ensure uploads happen in batches of at most 10 records (Airtable API constraint).
5. **Return Result**: Return the count of successfully saved leads.
