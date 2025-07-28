import axios from 'axios';

const customAxios = axios.create({
    baseURL: 'https://port-0-goodthing-rest-backend-mcge9of87641a8f6.sel5.cloudtype.app',
    withCredentials: true,
});

export default customAxios;
