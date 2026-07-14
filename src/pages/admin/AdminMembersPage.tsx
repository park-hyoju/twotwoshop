import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '../../contexts/AdminAuthProvider'
import { formatDateTime } from '../../lib/formatDateTime'
import {
  AdminMemberRepositoryError,
  deleteAdminMember,
  fetchAdminMembers,
} from '../../services/adminMemberRepository'
import type { AdminMemberRow } from '../../types/adminMember'

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminMemberRepositoryError) {
    return error.message
  }

  return '회원 목록을 불러오는 중 오류가 발생했습니다.'
}

function normalizeSearchDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function matchesMemberSearch(member: AdminMemberRow, query: string): boolean {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return true
  }

  const name = (member.name ?? '').toLowerCase()
  const loginId = (member.loginId ?? '').toLowerCase()
  const phone = member.phone ?? ''

  if (name.includes(trimmed) || loginId.includes(trimmed)) {
    return true
  }

  const queryDigits = normalizeSearchDigits(trimmed)
  if (queryDigits) {
    return normalizeSearchDigits(phone).includes(queryDigits)
  }

  return phone.toLowerCase().includes(trimmed)
}

function canDeleteMember(member: AdminMemberRow, currentAdminId: string | undefined): boolean {
  if (member.hasOrder) {
    return false
  }

  if (!currentAdminId || member.id === currentAdminId) {
    return false
  }

  return true
}

export function AdminMembersPage() {
  const { user } = useAdminAuth()
  const [members, setMembers] = useState<AdminMemberRow[]>([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadMembers = useCallback(async () => {
    setIsLoading(true)
    setListErrorMessage(null)

    try {
      const rows = await fetchAdminMembers()
      setMembers(rows)
    } catch (error) {
      setMembers([])
      setListErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMembers()
  }, [loadMembers])

  const filteredMembers = useMemo(
    () => members.filter((member) => matchesMemberSearch(member, query)),
    [members, query],
  )

  async function handleDelete(member: AdminMemberRow) {
    if (!canDeleteMember(member, user?.id)) {
      return
    }

    const confirmed = window.confirm(
      '이 회원 계정을 삭제할까요?\n삭제 후에는 로그인할 수 없으며 복구할 수 없습니다.',
    )

    if (!confirmed) {
      return
    }

    setDeletingId(member.id)
    setActionErrorMessage(null)
    setSuccessMessage(null)

    try {
      const message = await deleteAdminMember(member.id)
      setMembers((current) => current.filter((row) => row.id !== member.id))
      setSuccessMessage(message || '회원이 삭제되었습니다.')
    } catch (error) {
      setActionErrorMessage(getErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">회원관리</h1>
        <p className="mt-2 text-base text-neutral-600 sm:text-lg">
          가입한 회원 목록을 확인합니다. 주문하지 않은 테스트 회원만 삭제할 수 있습니다.
        </p>
      </div>

      <div className="mt-6">
        <label htmlFor="admin-members-search" className="sr-only">
          회원 검색
        </label>
        <input
          id="admin-members-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름, 아이디, 전화번호 검색"
          className="w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500"
        />
      </div>

      {successMessage ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {successMessage}
        </p>
      ) : null}

      {actionErrorMessage ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {actionErrorMessage}
        </p>
      ) : null}

      <div className="mt-6">
        {isLoading && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            회원 목록을 불러오는 중입니다...
          </div>
        )}

        {!isLoading && listErrorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center text-red-700"
          >
            <p>{listErrorMessage}</p>
            <button
              type="button"
              onClick={() => void loadMembers()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading && !listErrorMessage && members.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            가입한 회원이 없습니다.
          </div>
        )}

        {!isLoading && !listErrorMessage && members.length > 0 && filteredMembers.length === 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white px-6 py-12 text-center text-neutral-600">
            검색 결과가 없습니다.
          </div>
        )}

        {!isLoading && !listErrorMessage && filteredMembers.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                    이름
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                    로그인 아이디
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                    가입일
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                    구매 여부
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredMembers.map((member) => {
                  const optionalEmail = member.optionalEmail?.trim() || null
                  const deletable = canDeleteMember(member, user?.id)
                  const isDeleting = deletingId === member.id

                  return (
                    <tr key={member.id} className="text-neutral-800">
                      <td className="px-4 py-3 font-medium text-neutral-900">
                        {member.name?.trim() || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs sm:text-sm">
                        {member.loginId?.trim() || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {member.phone?.trim() || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {optionalEmail ? optionalEmail : <span className="text-neutral-400">-</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-neutral-600">
                        {formatDateTime(member.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {member.hasOrder ? (
                          <span className="inline-flex rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200">
                            구매회원
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">
                            주문 없음
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={!deletable || isDeleting || deletingId !== null}
                          onClick={() => void handleDelete(member)}
                          title={
                            member.hasOrder
                              ? '주문 이력이 있는 회원은 삭제할 수 없습니다.'
                              : member.id === user?.id
                                ? '현재 로그인한 계정은 삭제할 수 없습니다.'
                                : undefined
                          }
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400 disabled:hover:bg-transparent"
                        >
                          {isDeleting ? '삭제 중...' : '삭제'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
