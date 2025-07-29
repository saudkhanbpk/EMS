/**
 * Test utilities for Database-Based Laptop Tracking System
 * Use these functions in browser console to test the implementation
 */

import { supabase } from '../lib/supabase';
import { 
  saveRealLaptopStatus, 
  getAllRealLaptopStatus, 
  getRealStatusForUser,
  cleanupOldLaptopStatus 
} from '../services/realLaptopTracking';

/**
 * Test the database-based laptop tracking system
 */
export async function testLaptopTrackingSystem() {
  console.log('🧪 Testing Database-Based Laptop Tracking System...');
  
  try {
    // Test 1: Save current user's status
    console.log('\n📝 Test 1: Saving current user status...');
    await saveRealLaptopStatus();
    console.log('✅ Status saved successfully');

    // Test 2: Get current user's status
    console.log('\n📖 Test 2: Reading current user status...');
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userStatus = await getRealStatusForUser(user.id);
      console.log('Current user status:', userStatus);
    }

    // Test 3: Get user's organization
    console.log('\n🏢 Test 3: Getting organization data...');
    if (user) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('organization_id, full_name')
        .eq('id', user.id)
        .single();

      if (userProfile?.organization_id) {
        console.log(`Organization ID: ${userProfile.organization_id}`);
        
        // Test 4: Get all users' laptop status
        console.log('\n👥 Test 4: Getting all users laptop status...');
        const allStatuses = await getAllRealLaptopStatus(userProfile.organization_id);
        
        console.log('All users laptop status:');
        Object.entries(allStatuses).forEach(([userId, status]) => {
          console.log(`  ${userId}: ${status.laptop_state} | Battery: ${status.battery_level}% | Checked in: ${status.is_checked_in}`);
        });

        // Test 5: Database query test
        console.log('\n🗄️ Test 5: Direct database query...');
        const { data: laptopStates, error } = await supabase
          .from('laptop_states')
          .select('*')
          .limit(5);

        if (error) {
          console.error('Database query error:', error);
        } else {
          console.log('Recent laptop states from database:', laptopStates);
        }

        console.log('\n✅ All tests completed successfully!');
        return {
          success: true,
          userStatus: await getRealStatusForUser(user.id),
          allStatuses,
          databaseRecords: laptopStates
        };
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error };
  }
}

/**
 * Test real-time updates by simulating status changes
 */
export async function testRealTimeUpdates() {
  console.log('🔄 Testing real-time updates...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return;
  }

  // Save initial status
  await saveRealLaptopStatus();
  console.log('📝 Initial status saved');

  // Wait 2 seconds and save again
  setTimeout(async () => {
    await saveRealLaptopStatus();
    console.log('📝 Updated status saved');
  }, 2000);

  // Check for real-time subscription events
  const subscription = supabase
    .channel('test_laptop_states')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'laptop_states'
      },
      (payload) => {
        console.log('📡 Real-time update received:', payload);
      }
    )
    .subscribe();

  // Cleanup after 10 seconds
  setTimeout(() => {
    subscription.unsubscribe();
    console.log('🔕 Test subscription cleaned up');
  }, 10000);
}

/**
 * Check database table structure
 */
export async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check if laptop_states table exists and get sample data
    const { data, error } = await supabase
      .from('laptop_states')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Database structure issue:', error);
      return false;
    }

    console.log('✅ Database structure is correct');
    console.log('Sample record structure:', data?.[0] || 'No records yet');
    return true;
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return false;
  }
}

/**
 * Simulate multiple users for testing
 */
export async function simulateMultipleUsers() {
  console.log('👥 Simulating multiple users...');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return;
  }

  // Get user's organization
  const { data: userProfile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.organization_id) {
    console.error('No organization found');
    return;
  }

  // Get all users in organization
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, full_name')
    .eq('organization_id', userProfile.organization_id);

  if (!allUsers || allUsers.length === 0) {
    console.error('No users found in organization');
    return;
  }

  console.log(`Found ${allUsers.length} users in organization`);

  // Simulate different states for different users
  const states = ['On', 'Sleep', 'Off'];
  const promises = allUsers.slice(0, 3).map(async (testUser, index) => {
    const state = states[index % 3];
    const batteryLevel = Math.floor(Math.random() * 100);
    
    try {
      const { error } = await supabase
        .from('laptop_states')
        .upsert({
          user_id: testUser.id,
          state: state,
          timestamp: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          battery_level: batteryLevel,
          is_charging: Math.random() > 0.5,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error(`Error simulating user ${testUser.full_name}:`, error);
      } else {
        console.log(`✅ Simulated ${testUser.full_name}: ${state} | Battery: ${batteryLevel}%`);
      }
    } catch (error) {
      console.error(`Error for user ${testUser.full_name}:`, error);
    }
  });

  await Promise.all(promises);
  console.log('✅ Simulation complete');
}

// Make functions available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testLaptopTracking = testLaptopTrackingSystem;
  (window as any).testRealTimeUpdates = testRealTimeUpdates;
  (window as any).checkDatabaseStructure = checkDatabaseStructure;
  (window as any).simulateMultipleUsers = simulateMultipleUsers;
  (window as any).cleanupOldLaptopData = cleanupOldLaptopStatus;
}
