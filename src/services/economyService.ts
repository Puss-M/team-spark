import { supabase } from '../lib/supabase';
import { UserWallet, Investment, Transaction } from '../types';

/**
 * Virtual Economy Service
 * 封装所有虚拟经济相关的数据库操作
 */

/**
 * 获取用户钱包信息
 * 如果用户不存在，自动初始化钱包（100金币）
 */
export async function getUserWallet(userName: string): Promise<UserWallet | null> {
  try {
    // 先尝试获取钱包
    const { data, error } = await supabase
      .from('user_wallets')
      .select('*')
      .eq('user_name', userName)
      .single();

    if (error && error.code === 'PGRST116') {
      // 用户不存在，初始化钱包
      const { data: newWallet, error: initError } = await supabase
        .rpc('initialize_user_wallet', { p_user_name: userName });

      if (initError) {
        console.error('Failed to initialize wallet:', initError);
        return null;
      }

      // 重新获取
      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_name', userName)
        .single();

      return wallet;
    }

    if (error) {
      console.error('Error fetching wallet:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('getUserWallet error:', err);
    return null;
  }
}

/**
 * 投资想法
 * @param ideaId 想法ID
 * @param amount 投资金额
 * @param userName 用户名
 */
export async function placeBet(
  ideaId: string,
  amount: number,
  userName: string
): Promise<{ success: boolean; message?: string; new_balance?: number }> {
  try {
    const { data, error } = await supabase
      .rpc('place_bet', {
        p_idea_id: ideaId,
        p_amount: amount,
        p_user_name: userName,
      });

    if (error) {
      console.error('Place bet error:', error);
      return { success: false, message: error.message };
    }

    return data;
  } catch (err) {
    console.error('placeBet error:', err);
    return { success: false, message: String(err) };
  }
}

/**
 * 发布悬赏
 * @param ideaId 想法ID
 * @param amount 悬赏金额
 * @param userName 用户名
 */
export async function postBounty(
  ideaId: string,
  amount: number,
  userName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('post_bounty', {
        p_idea_id: ideaId,
        p_amount: amount,
        p_user_name: userName,
      });

    if (error) {
      console.error('Post bounty error:', error);
      return { success: false, message: error.message };
    }

    return data;
  } catch (err) {
    console.error('postBounty error:', err);
    return { success: false, message: String(err) };
  }
}

/**
 * 接受悬赏答案
 * @param ideaId 想法ID
 * @param winnerUserName 获胜者用户名
 */
export async function acceptBountySolution(
  ideaId: string,
  winnerUserName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('accept_bounty_solution', {
        p_idea_id: ideaId,
        p_winner_user_name: winnerUserName,
      });

    if (error) {
      console.error('Accept bounty error:', error);
      return { success: false, message: error.message };
    }

    return data;
  } catch (err) {
    console.error('acceptBountySolution error:', err);
    return { success: false, message: String(err) };
  }
}

/**
 * 解决预测（将想法标记为已实现项目）
 * 自动分配200%回报给所有投资者
 * @param ideaId 想法ID
 */
export async function resolveIdea(
  ideaId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const { data, error } = await supabase
      .rpc('resolve_prediction', {
        p_idea_id: ideaId,
      });

    if (error) {
      console.error('Resolve prediction error:', error);
      return { success: false, message: error.message };
    }

    return data;
  } catch (err) {
    console.error('resolveIdea error:', err);
    return { success: false, message: String(err) };
  }
}

/**
 * 获取用户交易历史
 * @param userName 用户名
 */
export async function getUserTransactions(
  userName: string
): Promise<Transaction[]> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_name', userName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get transactions error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getUserTransactions error:', err);
    return [];
  }
}

/**
 * 获取想法的所有投资记录
 * @param ideaId 想法ID
 */
export async function getIdeaInvestments(ideaId: string): Promise<Investment[]> {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('idea_id', ideaId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Get idea investments error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getIdeaInvestments error:', err);
    return [];
  }
}

/**
 * 获取排行榜
 * @param type 排行榜类型：'earned' | 'invested' | 'bounty'
 * @param limit 返回条数
 */
export async function getLeaderboard(
  type: 'earned' | 'invested' | 'bounty',
  limit: number = 10
): Promise<any[]> {
  try {
    if (type === 'earned') {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('user_name, total_earned, balance')
        .order('total_earned', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }

    if (type === 'invested') {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('user_name, total_invested, balance')
        .order('total_invested', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }

    if (type === 'bounty') {
      const { data, error } = await supabase
        .from('transactions')
        .select('user_name, amount')
        .eq('type', 'bounty_win');

      if (error) throw error;

      // 按用户聚合
      const userBounties = (data || []).reduce((acc: any, tx: any) => {
        if (!acc[tx.user_name]) {
          acc[tx.user_name] = { user_name: tx.user_name, bounty_wins: 0, total_bounty_earned: 0 };
        }
        acc[tx.user_name].bounty_wins += 1;
        acc[tx.user_name].total_bounty_earned += tx.amount;
        return acc;
      }, {});

      return Object.values(userBounties)
        .sort((a: any, b: any) => b.bounty_wins - a.bounty_wins)
        .slice(0, limit);
    }

    return [];
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return [];
  }
}

/**
 * 获取用户在特定想法上的投资金额
 */
export async function getUserInvestmentOnIdea(
  userName: string,
  ideaId: string
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('amount')
      .eq('user_name', userName)
      .eq('idea_id', ideaId);

    if (error) {
      console.error('Get user investment error:', error);
      return 0;
    }

    return (data || []).reduce((sum, inv) => sum + inv.amount, 0);
  } catch (err) {
    console.error('getUserInvestmentOnIdea error:', err);
    return 0;
  }
}
