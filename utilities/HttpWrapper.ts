import axios from "axios";

axios.defaults.baseURL = process.env.BACKEND_URL
class HttpWrapper {
    callUrl = () => {

    }
}

const Http = new HttpWrapper();
export default Http