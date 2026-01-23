import { Attachment } from "../constants/attachment";

export type PaymentStatus = 
    | "pending"       // Payment not initiated
    | "processing"    // Payment in process
    | "completed"     // Payment successful
    | "failed";       // Payment failed

export interface IPayments {
    contractId: string;
    brandId: string;
    managerId: string;
    userId: string;
    
    amount: number;
    currency: string;
    
    status: PaymentStatus;
    
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    
    initiatedAt: number;
    completedAt?: number;
    failedAt?: number;
    failureReason?: string;
    
    paymentProof?: Attachment[];
    
    transactionId?: string;
}
