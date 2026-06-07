# Lead Tracking Analytics Dashboard Specification

## Objective

Build a simple, beautiful, and modern analytics dashboard for lead tracking. The application fetches lead data from an Airtable base and provides real-time visualizations and statistics about sales performance.

---

## Users

* **Sales Managers**: To analyze lead conversion performance across cities and industries.
* **Business Administrators**: To track total revenue generated from won contracts.

---

## Core Features

1. **Airtable Integration**:
   - Fetches lead data securely using server-side Next.js API routes (no keys exposed to the client).
   - Normalizes lead values, status (`Contract Won` vs `lead`), and parses city names from addresses.
2. **KPI Metrics Grid**:
   - **Total Leads**: Total count of filtered leads.
   - **Total Revenue**: Sum of deal values for leads that have been won (`status: "Contract Won"`).
   - **Contracts Won**: Total count of closed-won leads.
   - **Contract Won Conv Rate (%)**: Ratio of won contracts to total leads.
3. **Analytics Visualization (Custom SVG Bar Charts)**:
   - **Revenue by City**: Total revenue per city for won contracts.
   - **Closing Rate by City**: Percentage of won contracts out of total leads per city.
   - **Revenue by Service**: Total revenue per industry service sector.
   - **Closing Rate by Service**: Percentage of won contracts out of total leads per service type.
4. **Dynamic Client-side Filters**:
   - **Service Multiselect**: Allows filtering leads by one or more industry categories.
   - **Date Range Picker**: Allows selecting start and end dates with boundaries (2020-2030) to prevent invalid 5-digit years (e.g. `62024`).
   - **Rating Range Slider**: Controls the minimum and maximum ratings (0 to 5, step 0.1).
5. **Raw Lead Records Table**:
   - Displays all matching lead details with badges for status and ratings.

---

## User Stories

* **As a Sales Manager**, I want to see which city produces the highest closing rate so that I can direct marketing resources appropriately.
* **As a Business Administrator**, I want to filter leads by rating range and service so that I can analyze high-value plumbers or restaurants separately.
* **As an operator**, I want to filter by a specific date range without encountering year input errors so that I can query monthly or quarterly statistics.

---

## Technical Requirements

* **Framework**: Next.js (App Router, JS).
* **Styling**: Vanilla CSS (Premium Glassmorphic Dark UI, Outfit font). No Tailwind CSS.
* **API/Database**: Airtable REST API.
* **Deployment Target**: Vercel.
* **Environment Keys**:
  - `AIRTABLE_API_KEY`: Airtable Personal Access Token (PAT).
  - `AIRTABLE_BASE_ID`: Airtable Base Identifier.

---

## Constraints

* Never expose the Airtable API key to the browser (must use server-side routes).
* Use Vanilla CSS, not Tailwind CSS.
* Restrict date picker year range to 4 digits (`2020-01-01` to `2030-12-31`) to block Chrome 5-digit year autofill bugs.

---

## Definition of Done

* Data is successfully fetched from Airtable without API key leaks.
* Page loads with correct values for metrics (52 total leads by default, $374,000 total revenue, 10 won contracts).
* Custom SVG charts scale dynamically and hover effects function properly.
* Date picker inputs are constrained to 4-digit years.
* Build is clean and compiles successfully.
