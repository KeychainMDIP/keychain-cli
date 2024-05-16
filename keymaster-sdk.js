import axios from 'axios';

function throwError(error) {
    if (error.response) {
        throw error.response.data;
    }

    throw error.message;
}

export async function listRegistries() {
    try {
        const response = await axios.get(`/api/v1/registries`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function getCurrentId() {
    try {
        const response = await axios.get(`/api/v1/current-id`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function setCurrentId(name) {
    try {
        const response = await axios.put(`/api/v1/current-id`, { name: name });
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function listIds() {
    try {
        const response = await axios.get(`/api/v1/ids`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function resolveId(id) {
    try {
        const response = await axios.get(`/api/v1/ids/${id}`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function createId(name, registry) {
    try {
        const response = await axios.post(`/api/v1/ids`, { name: name, registry: registry });
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function removeId(id) {
    try {
        const response = await axios.delete(`/api/v1/ids/${id}`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function backupId(id) {
    try {
        const response = await axios.post(`/api/v1/ids/${id}/backup`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function recoverId(did) {
    try {
        const response = await axios.post(`/api/v1/recover-id`, { did: did });
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function listNames() {
    try {
        const response = await axios.get(`/api/v1/names`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function addName(name, did) {
    try {
        const response = await axios.post(`/api/v1/names`, { name: name, did: did });
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function removeName(name) {
    try {
        const response = await axios.delete(`/api/v1/names/${name}`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function resolveDID(name) {
    try {
        const response = await axios.get(`/api/v1/names/${name}`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function createChallenge() {
    try {
        const response = await axios.get(`/api/v1/challenge`);
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function createResponse(challengeDID) {
    try {
        const response = await axios.post(`/api/v1/response`, { challenge: challengeDID });
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}

export async function verifyResponse(responseDID, challengeDID) {
    try {
        const response = await axios.post(`/api/v1/verify-response`, { response: responseDID, challenge: challengeDID });
        return response.data;
    }
    catch (error) {
        throwError(error);
    }
}
