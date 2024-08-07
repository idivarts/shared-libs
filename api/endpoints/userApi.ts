import axios from 'axios';
import crowdyAxios from '../crowdyAxios';

// Define interfaces for User data
export interface IUser {
    id: string;
    name: string;
    email: string;
    // Add other fields as needed
}

class UserAPIClass {

    getUsers = async (): Promise<IUser[]> => {
        try {
            const response = await crowdyAxios.get<IUser[]>('/users');
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    createUser = async (userData: Partial<IUser>): Promise<IUser> => {
        try {
            const response = await crowdyAxios.post<IUser>('/users', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

    updateUser = async (userId: string, userData: Partial<IUser>): Promise<IUser> => {
        try {
            const response = await crowdyAxios.put<IUser>(`/users/${userId}`, userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    };

}

const UserAPI = new UserAPIClass()
export default UserAPI