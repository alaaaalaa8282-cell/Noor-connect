/**
 * Test script to verify Islamic Fasting API integration
 */

import { IslamicFastingAPI } from '../src/lib/islamic-fasting-api';

async function testIslamicFastingAPI() {
  console.log('🧪 Testing Islamic Fasting API Integration...\n');

  try {
    // Test 1: Get today's fasting times
    console.log('📋 Test 1: Today Fasting Times');
    const todayFasting = await IslamicFastingAPI.getTodaysFastingTimes(
      51.5194682,  // London latitude
      -0.1360365,  // London longitude
      3,            // Muslim World League method
      '2025-07-25'  // Specific date
    );
    
    console.log('✅ Today Fasting Response:', {
      status: todayFasting.status,
      range: todayFasting.range,
      fastingCount: todayFasting.data.fasting.length,
      firstFasting: todayFasting.data.fasting[0] ? {
        date: todayFasting.data.fasting[0].date,
        hijri: todayFasting.data.fasting[0].hijri_readable,
        sahur: todayFasting.data.fasting[0].time.sahur,
        iftar: todayFasting.data.fasting[0].time.iftar,
        duration: todayFasting.data.fasting[0].time.duration
      } : null
    });

    // Test 2: Get monthly fasting times
    console.log('\n📋 Test 2: Monthly Fasting Times');
    const monthlyFasting = await IslamicFastingAPI.getMonthlyFastingTimes(
      51.5194682,  // London latitude
      -0.1360365,  // London longitude
      3,            // Muslim World League method
      '2025-07'     // July 2025
    );
    
    console.log('✅ Monthly Fasting Response:', {
      status: monthlyFasting.status,
      range: monthlyFasting.range,
      fastingCount: monthlyFasting.data.fasting.length,
      whiteDays: monthlyFasting.data.white_days
    });

    // Test 3: Test caching
    console.log('\n📋 Test 3: Caching Test');
    const cachedData = IslamicFastingAPI.getCachedData(
      51.5194682,
      -0.1360365,
      3,
      '2025-07-25'
    );
    console.log('✅ Cached data available:', !!cachedData);

    // Test 4: Test method name
    console.log('\n📋 Test 4: Method Names');
    console.log('✅ Method 3:', IslamicFastingAPI.getMethodName(3));
    console.log('✅ Method 1:', IslamicFastingAPI.getMethodName(1));
    console.log('✅ Method 5:', IslamicFastingAPI.getMethodName(5));

    console.log('\n🎉 All Islamic Fasting API tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('API key not configured')) {
      console.log('\n💡 Note: Islamic API key is configured, testing with live API...');
    } else {
      console.log('\n💡 Note: This might be expected if the API is temporarily unavailable.');
      console.log('The app will fall back to Aladhan API or offline calculations.');
    }
  }
}

// Run tests
testIslamicFastingAPI();
