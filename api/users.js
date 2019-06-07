const axios = require('axios');

exports.getUserById = async (id, token) => axios.get(`${process.env.API_HOSTNAME}/users/${id}`, { headers: { 'x-access-token': token } });

exports.refreshToken = async data => axios.post(`${process.env.API_HOSTNAME}/users/refreshToken`, data);
