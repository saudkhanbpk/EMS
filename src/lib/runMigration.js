const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_KEY; // Use service key for admin privileges

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or service key. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'db_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
      }
    }

    console.log('Migration completed successfully!');
    
    // Create storage bucket for screenshots if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing storage buckets:', bucketsError);
    } else {
      const screenshotsBucketExists = buckets.some(bucket => bucket.name === 'screenshots');
      
      if (!screenshotsBucketExists) {
        console.log('Creating screenshots storage bucket...');
        const { error: createBucketError } = await supabase.storage.createBucket('screenshots', {
          public: false,
          fileSizeLimit: 5242880, // 5MB limit for screenshots
        });
        
        if (createBucketError) {
          console.error('Error creating screenshots bucket:', createBucketError);
        } else {
          console.log('Screenshots bucket created successfully!');
          
          // Set up bucket policies
          const { error: policyError } = await supabase.storage.from('screenshots').createPolicy('authenticated_read', {
            name: 'authenticated_read',
            definition: {
              role: 'authenticated',
              permission: 'SELECT',
            },
          });
          
          if (policyError) {
            console.error('Error setting up bucket policy:', policyError);
          } else {
            console.log('Bucket policy set up successfully!');
          }
        }
      } else {
        console.log('Screenshots bucket already exists.');
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration(); 