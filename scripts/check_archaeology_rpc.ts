import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkArchaeologyRPC() {
  console.log('🔍 Checking if award_archaeology_coins RPC exists...\n');

  try {
    // Try to call the RPC function with test parameters
    const { data, error } = await supabase.rpc('award_archaeology_coins', {
      p_user_name: 'test_diagnostic_user',
      p_amount: 1,
      p_idea_id: '00000000-0000-0000-0000-000000000000' // Fake UUID
    });

    if (error) {
      console.error('❌ RPC function error:', error);
      console.error('\nError details:');
      console.error('- Message:', error.message);
      console.error('- Code:', error.code);
      console.error('- Details:', error.details);
      console.error('- Hint:', error.hint);
      
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.error('\n⚠️  The RPC function "award_archaeology_coins" does NOT exist in your Supabase database!');
        console.error('📝 You need to run the SQL script: supabase/archaeology_rpc.sql');
        console.error('\nTo fix this:');
        console.error('1. Open Supabase Dashboard → SQL Editor');
        console.error('2. Copy and paste the contents of supabase/archaeology_rpc.sql');
        console.error('3. Execute the SQL');
      }
    } else {
      console.log('✅ RPC function exists and executed successfully!');
      console.log('Response:', data);
    }

    // Check if user_wallets table exists by trying to read from it
    console.log('\n🔍 Checking if user_wallets table exists...');
    const { data: wallets, error: walletsError } = await supabase
      .from('user_wallets')
      .select('*')
      .limit(1);

    if (walletsError) {
      console.error('❌ user_wallets table error:', walletsError.message);
    } else {
      console.log('✅ user_wallets table exists');
    }

    // Check if transactions table exists
    console.log('\n🔍 Checking if transactions table exists...');
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .limit(1);

    if (transError) {
      console.error('❌ transactions table error:', transError.message);
      if (transError.message.includes('does not exist')) {
        console.error('\n⚠️  The transactions table does NOT exist!');
        console.error('📝 You need to create it. Check your database schema setup.');
      }
    } else {
      console.log('✅ transactions table exists');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkArchaeologyRPC();
