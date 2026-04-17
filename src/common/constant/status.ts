export enum OtpType {
  REGISTER = 1,
  FORGOT_PASSWORD = 2,
}

export enum OrderStatus {
  PENDING = 1,
  CONFIRMED = 2,
  PACKED = 3,
  OUT_FOR_DELIVERY = 4,
  DELIVERED = 5,
  ASSIGNED = 6,
  CANCELLED = 7,
}

export enum PaymentStatus {
  PENDING = 1,
  PROCESSING = 2,
  COMPLETED = 3,
  FAILED = 4,
  REFUNDED = 5,
}

export enum paymentMethod{
  CASH_ON_DELIVERY = 1,
  ONLINE_PAYMENT = 2,
}

export enum AssignmentStatus {
  PENDING = 1,
  ACCEPTED = 2,
  REJECTED = 3,
  EXPIRED = 4,
}

export enum NotificationType {
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_SUCCESSFUL = 'PAYMENT_SUCCESSFUL',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

