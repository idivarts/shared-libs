export const getUserPath = (userId: string) => `/users/${userId}`
export interface IUser {
    email: string,
    username?: string, // This is only needed if you are creating members
    name?: string,
    image?: string
    preferences?: {
        theme?: 'light' | 'dark'
        question1: string,
        question2: string,
        question3: string
    }
}