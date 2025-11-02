import axios from "axios";
import server from "../../environment";

export const BASE_URL = server.prod;

const clientServer = axios.create({
    baseURL: BASE_URL
})

export default clientServer;