import * as Notifications from 'expo-notifications';


const getToken = Notifications.getDevicePushTokenAsync
const deleteToken = async (token?: string) => {

}


// const messaging = getMessaging(FirebaseApp);
export { deleteToken, getToken, Notifications as messaging };
