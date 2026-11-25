export function apiSuccess<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export function apiError(code: string, message: string, status: number) {
  return Response.json(
    { success: false, error: { code, message } },
    { status },
  )
}
