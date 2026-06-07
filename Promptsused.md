a. Please read web_app_instructions.md and build the project file structure. We're building a web app interface as well.

b. Please copy any Airtable instructions from the /instructions folder from my past project "masterclass-telegram" into this project. Use them as reference for data structure and logic, but adapt everything this Next.js app.

c. We're building a simple analytics dashboard for lead tracking. The app should:
i. Get data from Airtable
ii. Display the data in a clean, modern dashboard.
iii. Show:

Total Leads

Total Revenue

Contracts Won

Contract Won Conv Rate (%)

Display simple bar charts:
a. Revenue by city
b. Closing rate by city
c. Revenue by service
d. Closing rate by service

Have an ability filter by the following:
a. Rating range
b. Date range (date picking functionality)
c. Services

Be fully deployable to Vercel.

Use environment variables for: AIRTABLE_API_KEY, AIRTABLE_BASE_ID

Never expose API keys to the frontend.

Use API routes in Next.js (not MCP) to fetch Airtable data. The UI should be beautiful, modern, and responsive (inspired by the attached screenshot).