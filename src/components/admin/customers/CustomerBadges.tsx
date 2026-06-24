import type {
  CustomerGrade,
  CustomerMemberType,
  CustomerStatus,
} from '../../../types/adminCustomer'
import {
  CUSTOMER_GRADE_BADGE_CLASSES,
  CUSTOMER_MEMBER_BADGE_CLASSES,
  CUSTOMER_STATUS_BADGE_CLASSES,
  getCustomerGradeLabel,
  getCustomerMemberLabel,
  getCustomerStatusLabel,
} from '../../../lib/adminCustomerDisplay'

const badgeBaseClassName = 'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset'

export function CustomerGradeBadge({ grade }: { grade: CustomerGrade }) {
  return (
    <span className={`${badgeBaseClassName} ${CUSTOMER_GRADE_BADGE_CLASSES[grade]}`}>
      {getCustomerGradeLabel(grade)}
    </span>
  )
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span className={`${badgeBaseClassName} ${CUSTOMER_STATUS_BADGE_CLASSES[status]}`}>
      {getCustomerStatusLabel(status)}
    </span>
  )
}

export function CustomerMemberBadge({ memberType }: { memberType: CustomerMemberType }) {
  return (
    <span className={`${badgeBaseClassName} ${CUSTOMER_MEMBER_BADGE_CLASSES[memberType]}`}>
      {getCustomerMemberLabel(memberType)}
    </span>
  )
}
