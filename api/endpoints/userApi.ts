import crowdyAxios from '../crowdyAxios';

// Define interfaces for User data
interface User {
    id: string;
    name: string;
    email: string;
    // Add other fields as needed
}

export const getUsers = async (): Promise<User[]> => {
    try {
        const response = await crowdyAxios.get<User[]>('/users');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const createUser = async (userData: Partial<User>): Promise<User> => {
    try {
        const response = await crowdyAxios.post<User>('/users', userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
    try {
        const response = await crowdyAxios.put<User>(`/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        throw error;
    }
};