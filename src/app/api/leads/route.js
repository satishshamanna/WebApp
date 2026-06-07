import { NextResponse } from 'next/server';

function getCity(address) {
  if (!address) return 'Unknown';
  const parts = address.split(',').map(p => p.trim());
  if (parts.length < 3) return parts[0];
  
  let cityCandidate = parts[parts.length - 3];
  
  // If the candidate is a number (like a zip code) or too short, check the previous part
  if (/^\d+$/.test(cityCandidate) || cityCandidate.length <= 3) {
    cityCandidate = parts[parts.length - 4];
  }
  
  // Clean up suburbs of Bengaluru
  if (
    cityCandidate === 'Whitefield' || 
    cityCandidate === 'Whitefield Main Rd' || 
    cityCandidate === 'Whitefield Main Road' ||
    cityCandidate === 'Prestige Ozone'
  ) {
    return 'Bengaluru';
  }
  return cityCandidate || 'Unknown';
}

export async function GET() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME || 'Leads';

  if (!apiKey || !baseId) {
    return NextResponse.json(
      { error: 'Airtable credentials (AIRTABLE_API_KEY or AIRTABLE_BASE_ID) are not configured.' },
      { status: 500 }
    );
  }

  try {
    let allRecords = [];
    let offset = null;

    // Loop to handle pagination in Airtable API
    do {
      let url = `https://api.airtable.com/v0/${baseId}/${tableName}`;
      if (offset) {
        url += `?offset=${offset}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        // Force server to fetch fresh data on every request
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      allRecords = allRecords.concat(data.records || []);
      offset = data.offset;
    } while (offset);

    // Normalize and format leads
    const leads = allRecords.map(record => {
      const fields = record.fields || {};
      const address = fields.address || '';
      return {
        id: record.id,
        name: fields.name || 'Unnamed Business',
        service: fields.service || 'Other',
        address: address,
        city: getCity(address),
        website: fields.website || '',
        rating: fields.rating !== undefined ? Number(fields.rating) : null,
        email: fields.email || '',
        phone: fields.phone_number || '',
        date_created: fields.date_created || '',
        deal_value: fields.Deal_Value !== undefined ? Number(fields.Deal_Value) : 0,
        status: fields.status || 'lead'
      };
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Error fetching leads from Airtable:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads from Airtable' },
      { status: 500 }
    );
  }
}
