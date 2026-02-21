/**
 * Test script to verify Zakat Nisab API integration
 */

import { ZakatNisabService } from '../src/lib/zakatNisab';
import { MetalPricesService } from '../src/lib/metalPrices';

async function testZakatIntegration() {
  console.log('🧪 Testing Zakat Nisab API Integration...\n');

  try {
    // Test 1: Get nisab data with classical standard
    console.log('📋 Test 1: Classical Nisab Standard');
    const classicalNisab = await ZakatNisabService.getNisab('USD', 'classical', 'g');
    console.log('✅ Classical Nisab:', {
      status: classicalNisab.status,
      currency: classicalNisab.currency,
      standard: classicalNisab.calculation_standard,
      goldNisab: classicalNisab.data.nisab_thresholds.gold.nisab_amount,
      silverNisab: classicalNisab.data.nisab_thresholds.silver.nisab_amount,
      zakatRate: classicalNisab.data.zakat_rate
    });

    // Test 2: Get nisab data with common standard
    console.log('\n📋 Test 2: Common Nisab Standard');
    const commonNisab = await ZakatNisabService.getNisab('USD', 'common', 'g');
    console.log('✅ Common Nisab:', {
      status: commonNisab.status,
      currency: commonNisab.currency,
      standard: commonNisab.calculation_standard,
      goldNisab: commonNisab.data.nisab_thresholds.gold.nisab_amount,
      silverNisab: commonNisab.data.nisab_thresholds.silver.nisab_amount,
      zakatRate: commonNisab.data.zakat_rate
    });

    // Test 3: Test with different currency
    console.log('\n📋 Test 3: Different Currency (GBP)');
    const gbpNisab = await ZakatNisabService.getNisab('GBP', 'classical', 'g');
    console.log('✅ GBP Nisab:', {
      status: gbpNisab.status,
      currency: gbpNisab.currency,
      goldNisab: gbpNisab.data.nisab_thresholds.gold.nisab_amount,
      silverNisab: gbpNisab.data.nisab_thresholds.silver.nisab_amount
    });

    // Test 4: Test MetalPricesService integration
    console.log('\n📋 Test 4: MetalPricesService Integration');
    const metalPrices = await MetalPricesService.getPrices('USD', 'classical');
    console.log('✅ Metal Prices with Nisab:', {
      hasNisabData: !!metalPrices.nisabData,
      goldPrice: metalPrices.goldPricePerGram,
      silverPrice: metalPrices.silverPricePerGram,
      goldNisab: metalPrices.goldNisab,
      silverNisab: metalPrices.silverNisab,
      source: metalPrices.source
    });

    // Test 5: Test caching
    console.log('\n📋 Test 5: Caching Test');
    const cachedNisab = ZakatNisabService.getCachedNisab('USD', 'classical', 'g');
    console.log('✅ Cached data available:', !!cachedNisab);

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('API key not configured')) {
      console.log('\n💡 Note: Islamic API key is not configured. Using fallback data.');
      console.log('To use the live Islamic API, update ISLAMIC_API_KEY in constants.ts');
    }
  }
}

// Run tests
testZakatIntegration();
