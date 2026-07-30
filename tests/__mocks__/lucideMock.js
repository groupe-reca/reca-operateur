// Jest stub for lucide-react-native: its ESM build isn't transformed under
// jest-expo, and icons are purely decorative for component tests anyway.
// A Proxy returns a no-op component for whichever icon name is imported.
function NullIcon() {
  return null;
}

module.exports = new Proxy(
  {},
  {
    get: () => NullIcon,
  }
);
