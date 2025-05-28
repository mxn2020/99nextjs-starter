'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@99packages/auth'
import { getBrowserClient } from '@/lib/supabase-client'
import { Account, UserAccount } from '@/lib/types'

interface UserAccountsContextType {
  accounts: Account[]
  userAccounts: UserAccount[]
  currentAccount: Account | null
  setCurrentAccount: (account: Account) => void
  loading: boolean
  refetch: () => Promise<void>
}

const UserAccountsContext = createContext<UserAccountsContextType>({
  accounts: [],
  userAccounts: [],
  currentAccount: null,
  setCurrentAccount: () => {},
  loading: true,
  refetch: async () => {},
})

export function UserAccountsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = getBrowserClient()

  const fetchUserAccounts = async () => {
    try {
      if (!user) return

      // Get user accounts with account details
      const { data: userAccountsData, error: userAccountsError } = await supabase
        .from('user_accounts')
        .select(`
          *,
          account:accounts(*)
        `)
        .eq('user_id', user.id)

      if (userAccountsError) {
        console.error('Error fetching user accounts:', userAccountsError)
        return
      }

      const userAccountsList = userAccountsData || []
      const accountsList = userAccountsList.map(ua => ua.account).filter(Boolean) as Account[]

      setUserAccounts(userAccountsList)
      setAccounts(accountsList)

      // Set current account to the first one if not already set
      if (accountsList.length > 0 && !currentAccount && accountsList[0]) {
        setCurrentAccount(accountsList[0])
      }
    } catch (error) {
      console.error('Error in fetchUserAccounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserAccounts()
  }, [])

  const refetch = async () => {
    setLoading(true)
    await fetchUserAccounts()
  }

  return (
    <UserAccountsContext.Provider
      value={{
        accounts,
        userAccounts,
        currentAccount,
        setCurrentAccount,
        loading,
        refetch,
      }}
    >
      {children}
    </UserAccountsContext.Provider>
  )
}

export function useUserAccounts() {
  const context = useContext(UserAccountsContext)
  return context
}
