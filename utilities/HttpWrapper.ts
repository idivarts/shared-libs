import axios from "axios";

axios.defaults.baseURL = process.env.BACKEND_URL
class HttpWrapper {
    callUrl = () => {

    }
}

const httpWrapper = new HttpWrapper();
export default httpWrapper