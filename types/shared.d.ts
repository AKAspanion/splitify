import { User, UserPayment } from "@prisma/client";

export type UserPaymentWithUser = UserPayment & { user: User };
