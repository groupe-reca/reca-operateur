import NetInfo from '@react-native-community/netinfo';

// Single point of contact for `@react-native-community/netinfo` — no
// component/engine imports it directly (docs/02). docs/08 "ne doit pas se
// fier uniquement à l'icône réseau du téléphone": both `isConnected` (a
// network interface exists) and `isInternetReachable` (that interface
// actually reaches the internet, when the OS can tell) are combined —
// still just the *device's* signal, not real server reachability
// (`SERVER_UNAVAILABLE`/`AUTHENTICATION_DEGRADED` stay deferred, Sprint 015).
export type NetworkSensor = {
  // Returns an unsubscribe function, mirroring NetInfo's own
  // `addEventListener` contract — a React effect can return it directly as
  // its cleanup.
  start(onChange: (online: boolean) => void): () => void;
};

export function createNetInfoSensor(): NetworkSensor {
  return {
    start(onChange) {
      return NetInfo.addEventListener((state) => {
        onChange(Boolean(state.isConnected) && state.isInternetReachable !== false);
      });
    },
  };
}
