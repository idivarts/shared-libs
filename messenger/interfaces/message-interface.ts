export interface IMessengerData {
    type: "open-contract" | "open-channel" | "contract-status" | "contract-status-receive" | "give-feedback",
    data: any
}