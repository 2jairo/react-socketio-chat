/**
 * @param {import('axios').AxiosInstance} api - Configured Axios instance to perform HTTP requests.
 */
export const createMessage = (api, groupId, content) => {
    return api.post(`/api/messages/group/${groupId}`, { content })
}
