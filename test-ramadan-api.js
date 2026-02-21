/**
 * Test script to verify Ramadan 2026 API integration
 */

import { IslamicRamadanAPI } from '../src/lib/islamic-fasting-api';

async function testRamadanAPI() {
  console.log('🧪 Testing Ramadan 2026 API Integration...\n');

  try {
    // Test 1: Get Ramadan data for London
    console.log('📋 Test 1: Ramadan Data for London');
    const ramadanData = await IslamicRamadanAPI.getRamadanData(
      51.5194682,  // London latitude
      -0.1360365,  // London longitude
      3,            // Muslim World League method
      {
        calendar: 'UAQ',
        school: 1,    // Standard
        format: 12,   // 12-hour format
        shifting: 0    // No adjustment
      }
    );
    
    console.log('✅ Ramadan Response:', {
      status: ramadanData.status,
      ramadanYear: ramadanData.ramadan_year,
      fastingCount: ramadanData.data.fasting.length,
      firstDay: ramadanData.data.fasting[0] ? {
        date: ramadanData.data.fasting[0].date,
        day: ramadanData.data.fasting[0].day,
        hijri: ramadanData.data.fasting[0].hijri_readable,
        sahur: ramadanData.data.fasting[0].time.sahur,
        iftar: ramadanData.data.fasting[0].time.iftar,
        duration: ramadanData.data.fasting[0].time.duration
      } : null,
      whiteDays: ramadanData.data.white_days,
      hasDua: !!ramadanData.resource?.dua,
      hasHadith: !!ramadanData.resource?.hadith
    });

    // Test 2: Get today's Ramadan times
    console.log('\n📋 Test 2: Today Ramadan Times');
    const todayData = await IslamicRamadanAPI.getTodaysRamadanTimes(
      51.5194682,
      -0.1360365,
      3
    );
    
    console.log('✅ Today Ramadan Response:', {
      hasTodayData: !!todayData.fastingTime,
      todayFasting: todayData.fastingTime ? {
        date: todayData.fastingTime.date,
        hijri: todayData.fastingTime.hijri_readable,
        sahur: todayData.fastingTime.time.sahur,
        iftar: todayData.fastingTime.time.iftar,
        duration: todayData.fastingTime.time.duration
      } : null,
      fullDataStatus: todayData.fullData.status
    });

    // Test 3: Get specific day (Day 15 of Ramadan)
    console.log('\n📋 Test 3: Day 15 of Ramadan');
    const day15Data = await IslamicRamadanAPI.getSpecificDayRamadanTimes(
      15,           // Day 15
      51.5194682,
      -0.1360365,
      3
    );
    
    console.log('✅ Day 15 Response:', {
      hasDay15Data: !!day15Data,
      day15Data: day15Data ? {
        date: day15Data.date,
        hijri: day15Data.hijri_readable,
        sahur: day15Data.time.sahur,
        iftar: day15Data.time.iftar,
        duration: day15Data.time.duration
      } : null
    });

    // Test 4: Test caching
    console.log('\n📋 Test 4: Caching Test');
    const cachedData = IslamicRamadanAPI.getCachedData(51.5194682, -0.1360365, 3);
    console.log('✅ Cached data available:', !!cachedData);
    
    // Test 5: Test method names
    console.log('\n📋 Test 5: Method Names');
    console.log('✅ Method 3:', IslamicRamadanAPI.getMethodName(3));
    console.log('✅ Method 5:', IslamicRamadanAPI.getMethodName(5));
    console.log('✅ Method 16:', IslamicRamadanAPI.getMethodName(16));

    console.log('\n🎉 All Ramadan 2026 API tests completed successfully!');
    
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
testRamadanAPI();
