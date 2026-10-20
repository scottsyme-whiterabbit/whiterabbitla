/** Return no infrastructure details; correlate the real server error by request ID. */
export function safeErrorPayload(error: unknown, requestId: string) {
  console.error(`[request ${requestId}]`, error);
  return { error: "Something went wrong. Please try again.", request_id: requestId };
}