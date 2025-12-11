'use client';
import React, { useState } from 'react';
import { FiUser } from 'react-icons/fi';

interface LoginModalProps {
  onLogin: (name: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl transition-all duration-300 ease-in-out transform scale-100 opacity-100">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎来到 Team Spark</h2>
          <p className="text-gray-500">请输入你的名字开始使用</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="输入你的名字"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
          >
            开始使用
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          你的名字将保存在浏览器中，下次访问时自动登录
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
