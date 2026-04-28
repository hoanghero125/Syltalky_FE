import { api } from './client'

export const meetingsApi = {
  create: (token) => api.post('/meetings', {}, token),

  check: (roomCode, token) => api.get(`/meetings/check/${roomCode}`, token),

  join: (roomCode, token) => api.post('/meetings/join', { room_code: roomCode }, token),

  end: (meetingId, token) => api.post(`/meetings/${meetingId}/end`, {}, token),

  kick: (meetingId, participantId, token) => api.post(`/meetings/${meetingId}/kick/${participantId}`, {}, token),

  list: (token) => api.get('/meetings', token),

  get: (meetingId, token) => api.get(`/meetings/${meetingId}`, token),
}
