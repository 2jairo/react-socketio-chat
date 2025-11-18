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
