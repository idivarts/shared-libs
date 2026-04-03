import { HttpWrapper } from "./http-wrapper";

const KYC_ACCOUNT_ENDPOINT = "/monetize/influencers/account";
const KYC_BANK_ENDPOINT = "/monetize/influencers/account/bank";
const KYC_ADDRESS_ENDPOINT = "/monetize/influencers/account/address";

export interface CreateRazorpayRouteAccountPayload {
    name: string;
    pan: string;
    address: {
        street: string;
        city: string;
        state: string;
        postal_code: string;
    };
    bank: {
        account_number: string;
        ifsc: string;
        beneficiary_name: string;
    };
    reCreateAccount?: boolean;
}

interface CreateRazorpayRouteAccountResponse {
    accountId?: string;
    stakeholderId?: string;
    status?: string;
    [key: string]: unknown;
}

export const createRazorpayRouteAccount = async (
    payload: CreateRazorpayRouteAccountPayload
): Promise<CreateRazorpayRouteAccountResponse> => {
    const response = await HttpWrapper.fetch(KYC_ACCOUNT_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    try {
        return (await response.json()) as CreateRazorpayRouteAccountResponse;
    } catch {
        return {};
    }
};

export interface KYCAccountStatusResponse {
    status?: string;
    accountId?: string;
    stakeholderId?: string;
    account?: {
        status?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export const getRazorpayAccountStatus =
    async (): Promise<KYCAccountStatusResponse> => {
        const response = await HttpWrapper.fetch(KYC_ACCOUNT_ENDPOINT, {
            method: "GET",
        });

        try {
            return (await response.json()) as KYCAccountStatusResponse;
        } catch {
            return {};
        }
    };

export interface UpdateBankDetailsPayload {
    account_number: string;
    ifsc: string;
    beneficiary_name: string;
}

export const updateRazorpayBankDetails = async (
    payload: UpdateBankDetailsPayload
): Promise<Record<string, unknown>> => {
    const response = await HttpWrapper.fetch(KYC_BANK_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    try {
        return (await response.json()) as Record<string, unknown>;
    } catch {
        return {};
    }
};

export interface UpdateAddressPayload {
    street: string;
    city: string;
    state: string;
    postal_code: string;
}

export const updateRazorpayAddress = async (
    payload: UpdateAddressPayload
): Promise<Record<string, unknown>> => {
    const response = await HttpWrapper.fetch(KYC_ADDRESS_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    try {
        return (await response.json()) as Record<string, unknown>;
    } catch {
        return {};
    }
};
