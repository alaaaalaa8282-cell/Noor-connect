/**
 * Test script for Aladhan API integration
 * This can be run in the browser console to verify functionality
 */

import { AladhanAPI } from './aladhan-api';

export const testAladhanAPI = async () => {
  console.log('🧪 Testing Aladhan API Integration...');
  
  try {
    // Test with Karachi coordinates (Pakistan)
    const latitude = 24.8607;
    const longitude = 67.0011;
    
    console.log('📍 Testing with Karachi coordinates:', { latitude, longitude });
    
    // Test 1: Fetch monthly calendar
    console.log('📅 Testing monthly calendar fetch...');
    const monthlyData = await AladhanAPI.fetchMonthlyCalendar(
      latitude, 
      longitude, 
      2025, 
      1, // January
      1  // Pakistan/Karachi method
    );
    
    console.log('✅ Monthly data fetched:', {
      month: monthlyData.month,
      year: monthlyData.year,
      dataPoints: monthlyData.data.length,
      sampleDate: monthlyData.data[0]?.date?.readable
    });
    
    // Test 2: Get today's prayer times
    console.log('⏰ Testing today\'s prayer times...');
    const todayTimes = await AladhanAPI.getTodaysPrayerTimes(latitude, longitude, 1);
    console.log('✅ Today\'s times:', todayTimes);
    
    // Test 3: Get Ramadan times
    console.log('🌙 Testing Ramadan times...');
    const ramadanTimes = await AladhanAPI.getRamadanTimes(latitude, longitude, 1);
    if (ramadanTimes) {
      console.log('✅ Ramadan times:', {
        suhoor: ramadanTimes.suhoor,
        iftar: ramadanTimes.iftar
      });
    } else {
      console.log('ℹ️ No Ramadan times available (not Ramadan month)');
    }
    
    // Test 4: Get countdown
    console.log('⏱️ Testing countdown...');
    const countdown = await AladhanAPI.getNextEventCountdown(latitude, longitude, 1, false);
    if (countdown) {
      console.log('✅ Next event:', {
        name: countdown.name,
        time: countdown.time,
        countdown: countdown.countdown
      });
    }
    
    // Test 5: Check localStorage persistence
    console.log('💾 Testing localStorage...');
    const cachedData = AladhanAPI.getStoredMonthlyData();
    if (cachedData) {
      console.log('✅ Cached data found:', {
        month: cachedData.month,
        year: cachedData.year,
        lastUpdated: cachedData.lastUpdated
      });
    }
    
    console.log('🎉 All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Auto-run test if in development mode
if (process.env.NODE_ENV === 'development') {
  // Uncomment to auto-test on page load
  // testAladhanAPI();
}
