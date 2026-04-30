import { api } from './client'

export const meetingsApi = {
  create: (token, waitingRoomEnabled = true) =>
    api.post('/meetings', { waiting_room_enabled: waitingRoomEnabled }, token),

  check: (roomCode, token) => api.get(`/meetings/check/${roomCode}`, token),

  join: (roomCode, token) => api.post('/meetings/join', { room_code: roomCode }, token),

  end: (meetingId, token) => api.post(`/meetings/${meetingId}/end`, {}, token),

  kick: (meetingId, participantId, token) =>
    api.post(`/meetings/${meetingId}/kick/${participantId}`, {}, token),

  approve: (meetingId, requestId, token) =>
    api.post(`/meetings/${meetingId}/approve/${requestId}`, {}, token),

  deny: (meetingId, requestId, token) =>
    api.post(`/meetings/${meetingId}/deny/${requestId}`, {}, token),

  listWaiting: (meetingId, token) =>
    api.get(`/meetings/${meetingId}/waiting`, token),

  list: (token) => api.get('/meetings', token),

  get: (meetingId, token) => api.get(`/meetings/${meetingId}`, token),

  toggleWaitingRoom: (meetingId, enabled, token) =>
    api.patch(`/meetings/${meetingId}/waiting-room`, { enabled }, token),

  summarize: (meetingId, token) =>
    api.post(`/meetings/${meetingId}/summarize`, {}, token),

  ask: (meetingId, question, history, token) =>
    api.post(`/meetings/${meetingId}/ask`, { question, history }, token),

  chatHistory: (meetingId, token) =>
    api.get(`/meetings/${meetingId}/chat`, token),
}
