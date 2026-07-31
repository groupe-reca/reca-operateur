import { cameraPaddingTopFor, zoomForState, ZOOM_CLOSE, ZOOM_MEDIUM, ZOOM_WIDE } from '@/engines/map/mapCameraConfig';
import { fetchSuggestedRoute } from '@/integrations/mapbox/suggestedRoute';

describe('zoomForState', () => {
  it('maps each active state to its docs/05 zoom tier', () => {
    expect(zoomForState('EN_ROUTE')).toBe(ZOOM_WIDE);
    expect(zoomForState('APPROACHING')).toBe(ZOOM_MEDIUM);
    expect(zoomForState('IN_PROGRESS')).toBe(ZOOM_CLOSE);
    expect(zoomForState('PROBLEM')).toBe(ZOOM_CLOSE);
  });

  it('falls back to the wide tier for states with no explicit rule', () => {
    expect(zoomForState('WAITING')).toBe(ZOOM_WIDE);
    expect(zoomForState('COMPLETED')).toBe(ZOOM_WIDE);
  });
});

describe('cameraPaddingTopFor', () => {
  it('derives paddingTop so the anchor lands at 76% of the container height', () => {
    expect(cameraPaddingTopFor(1000)).toBe(520);
    expect(cameraPaddingTopFor(0)).toBe(0);
  });

  it('never returns a negative value', () => {
    expect(cameraPaddingTopFor(-100)).toBe(0);
  });
});

describe('fetchSuggestedRoute', () => {
  const originalToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = originalToken;
    globalThis.fetch = originalFetch;
  });

  it('falls back to straight lines when no token is configured', async () => {
    delete process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    const waypoints: [number, number][] = [
      [-74.0035, 45.7803],
      [-74.0037, 45.7809],
    ];
    const result = await fetchSuggestedRoute(waypoints);
    expect(result.isFallback).toBe(true);
    expect(result.coordinates).toEqual(waypoints);
  });

  it('falls back when fewer than 2 waypoints are given', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.test';
    const result = await fetchSuggestedRoute([[-74.0035, 45.7803]]);
    expect(result.isFallback).toBe(true);
  });

  it('falls back on a non-OK response', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.test';
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;
    const waypoints: [number, number][] = [
      [-74.0035, 45.7803],
      [-74.0037, 45.7809],
    ];
    const result = await fetchSuggestedRoute(waypoints);
    expect(result.isFallback).toBe(true);
    expect(result.coordinates).toEqual(waypoints);
  });

  it('falls back when fetch throws (e.g. offline)', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.test';
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;
    const waypoints: [number, number][] = [
      [-74.0035, 45.7803],
      [-74.0037, 45.7809],
    ];
    const result = await fetchSuggestedRoute(waypoints);
    expect(result.isFallback).toBe(true);
  });

  it('uses the real Directions geometry on success', async () => {
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'pk.test';
    const routeGeometry = [
      [-74.0035, 45.7803],
      [-74.0036, 45.7806],
      [-74.0037, 45.7809],
    ];
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ routes: [{ geometry: { coordinates: routeGeometry } }] }),
    }) as unknown as typeof fetch;
    const result = await fetchSuggestedRoute([
      [-74.0035, 45.7803],
      [-74.0037, 45.7809],
    ]);
    expect(result.isFallback).toBe(false);
    expect(result.coordinates).toEqual(routeGeometry);
  });
});
