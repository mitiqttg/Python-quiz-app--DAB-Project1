import { writable } from 'svelte/store';

const currentFeedback = writable(null);
const latestSubmissionId = writable(null);
const points = writable(null);

export { currentFeedback, latestSubmissionId, points };