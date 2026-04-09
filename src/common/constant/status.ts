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

export enum NotificationType {
  ORDER_PLACED = 1,
  ORDER_STATUS = 2,
  ORDER_ASSIGNED = 3,
}

export enum AssignmentStatus {
  PENDING = 1,
  ACCEPTED = 2,
  REJECTED = 3,
  EXPIRED = 4,
}

