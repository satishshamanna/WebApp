# airtable_search_leads Workflow

This workflow searches leads in Airtable based on filter criteria, sorts them by rating (highest first), and returns up to `count` results.

## Logic Steps

1. **Load Environment Settings**: Retrieve `AIRTABLE_API_TOKEN`, `AIRTABLE_BASE_ID`, and `AIRTABLE_TABLE_NAME` from the environment.
2. **Initialize Airtable Client**: Create a `pyairtable.Table` instance.
3. **Accept Input Filters**:
   - `city` (string, optional)
   - `service` (string, optional)
   - `minimum_rating` (float, optional)
   - `status` (string, optional)
   - `count` (integer, default 5)
4. **Construct Filter Formula**:
   - Build an Airtable logical formula.
   - If `city` is provided, search inside the `address` field: `FIND("city", {address})`.
   - If `service` is provided, match exactly: `{service} = "service"`.
   - If `minimum_rating` is provided, filter rating: `{rating} >= minimum_rating`.
   - If `status` is provided, match exactly: `{status} = "status"`.
   - Combine all active filters using Airtable's `AND(...)` structure.
5. **Query and Sort**:
   - Query Airtable using the formula.
   - Sort the results by the `rating` field in descending order (highest first).
6. **Limit and Return Output**:
   - Slices the results to return exactly `count` items (or fewer if fewer matching records exist).
   - Return the structured list of records.
