'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';
import { FiUser } from 'react-icons/fi';

// List of whitelisted usernames for quick testing
const WHITELISTED_USERS = [
  'CinyaMa',
  '蔡云杉',
  'Jasin',
  '灼灼不用cursor',
  'Leung',
  '猪猪侠',
  'CHUNLIN'
];

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAppStore(state => state.login);
  const showToast = useAppStore(state => state.showToast);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      showToast('请输入用户名', 'error');
      setLoading(false);
      return;
    }

    try {
      // Check if using mock mode (for development without Supabase)
      const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy');
      
      let isValidUser = false;
      
      if (isMockMode) {
        // Use local whitelist for mock mode
        isValidUser = WHITELISTED_USERS.includes(trimmedUsername);
      } else {
        // Validate username against access_whitelist table in Supabase
        const { data, error } = await supabase
          .from('access_whitelist')
          .select('username')
          .eq('username', trimmedUsername)
          .single();

        isValidUser = !error && !!data;
      }

      if (!isValidUser) {
        throw new Error('用户未找到');
      }

      // Login successful
      login(trimmedUsername);
      
      // Show welcome toast
      showToast(`Welcome back, @${trimmedUsername}`, 'success');
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '登录失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome to Team Spark</h1>
          <p className="text-gray-500 mt-2">Enter your Username to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Enter your Username (e.g., CinyaMa, Jasin, Leung)"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Show whitelisted users for reference in development */}
          <div className="mb-6 text-sm text-gray-500">
            <p className="mb-2">可用用户名示例：</p>
            <div className="flex flex-wrap gap-2">
              {WHITELISTED_USERS.slice(0, 3).map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => setUsername(user)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium transition-colors"
                >
                  {user}
                </button>
              ))}
              {WHITELISTED_USERS.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                  +{WHITELISTED_USERS.length - 3} 更多
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;