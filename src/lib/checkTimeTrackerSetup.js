const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or anon key. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSetup() {
  console.log('Checking Time Tracker setup...');
  let allGood = true;

  // Check if time_sessions table exists
  try {
    const { data: timeSessionsData, error: timeSessionsError } = await supabase
      .from('time_sessions')
      .select('id')
      .limit(1);

    if (timeSessionsError) {
      console.error('❌ time_sessions table not found or not accessible:', timeSessionsError.message);
      allGood = false;
    } else {
      console.log('✅ time_sessions table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error checking time_sessions table:', error.message);
    allGood = false;
  }

  // Check if screenshots table exists
  try {
    const { data: screenshotsData, error: screenshotsError } = await supabase
      .from('screenshots')
      .select('id')
      .limit(1);

    if (screenshotsError) {
      console.error('❌ screenshots table not found or not accessible:', screenshotsError.message);
      allGood = false;
    } else {
      console.log('✅ screenshots table exists and is accessible');
    }
  } catch (error) {
    console.error('❌ Error checking screenshots table:', error.message);
    allGood = false;
  }

  // Check if screenshots bucket exists
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing storage buckets:', bucketsError.message);
      allGood = false;
    } else {
      const screenshotsBucket = buckets.find(bucket => bucket.name === 'screenshots');
      
      if (screenshotsBucket) {
        console.log('✅ screenshots bucket exists');
      } else {
        console.error('❌ screenshots bucket not found');
        allGood = false;
      }
    }
  } catch (error) {
    console.error('❌ Error checking screenshots bucket:', error.message);
    allGood = false;
  }

  // Final result
  if (allGood) {
    console.log('✅ Time Tracker setup is complete and ready to use!');
  } else {
    console.log('❌ Time Tracker setup is incomplete. Please follow the setup guide in TIME_TRACKER_SETUP.md');
  }
}

checkSetup(); 