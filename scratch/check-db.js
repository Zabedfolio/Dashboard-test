const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  console.log('Checking customers table...');
  const { data, error } = await supabase.from('customers').select('*').limit(1);
  if (error) {
    console.error('Error fetching customers:', error);
  } else {
    console.log('Customers columns:', Object.keys(data[0] || {}));
  }

  console.log('\nChecking orders table...');
  const { data: orders, error: oError } = await supabase.from('orders').select('*').limit(1);
  if (oError) {
    console.error('Error fetching orders:', oError);
  } else {
    console.log('Orders columns:', Object.keys(orders[0] || {}));
  }
}

checkSchema();
