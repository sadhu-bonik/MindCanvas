/**
 * Navigation utilities for MindCanvas
 */

export const routes = {
  home: '/',
  canvas: '/canvas',
  canvasWithNote: (noteId: string) => `/canvas/${noteId}`,
} as const;

export type RouteKey = keyof typeof routes;