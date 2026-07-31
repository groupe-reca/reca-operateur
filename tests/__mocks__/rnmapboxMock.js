// Jest stub for @rnmapbox/maps: its native view managers can't render under
// Jest, and testing real Mapbox rendering has little value here (see
// memory.md). Simple View-based stand-ins let MissionScreen/MissionMapView
// render fully (children included) for component tests, without touching
// the native module.
const React = require('react');
const { View } = require('react-native');

function passthrough(name) {
  return function MockComponent(props) {
    return React.createElement(View, { testID: name }, props.children);
  };
}

const Camera = React.forwardRef(function MockCamera(_props, ref) {
  React.useImperativeHandle(ref, () => ({
    setCamera: () => {},
    fitBounds: () => {},
    flyTo: () => {},
    moveTo: () => {},
    zoomTo: () => {},
    moveBy: () => {},
    scaleBy: () => {},
  }));
  return null;
});

module.exports = {
  MapView: passthrough('MapView'),
  Camera,
  PointAnnotation: passthrough('PointAnnotation'),
  ShapeSource: passthrough('ShapeSource'),
  LineLayer: passthrough('LineLayer'),
  setAccessToken: () => Promise.resolve(null),
};
