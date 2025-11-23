/** @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests. */
export const createMessage = (api, groupId, content) => {
    return api.post(`/api/messages/group/${groupId}`, { content })
}

// /** @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests. */
// export const getGroupJoinUuid = (api, groupId) => {
//     return api.get(`/api/groups/group/${groupId}/join-uuid`)
// }

/** @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests. */
export const refreshGroupJoinUuid = (api, groupId) => {
    return api.post(`/api/groups/group/${groupId}/join-uuid/refresh`)
}

/** @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests. */
export const joinGroupWithUuid = (api, uuid) => {
    return api.post(`/api/groups/join-uuid/${uuid}`)
}

/** @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests. */
export const createChat = (api, name) => {
    return api.post(`/api/groups/group`, { name })
}

/** @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests. */
export const updateChat = (api, groupId, name) => {
    return api.put(`/api/groups/group/${groupId}`, { name })
}

/** @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests. */
export const getChatMembers = (api, groupId) => {
    return api.get(`/api/groups/members/${groupId}`)
}