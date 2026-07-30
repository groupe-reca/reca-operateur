import { render } from '@testing-library/react-native';

import App from '../App';

// Sprint 001 smoke test: the app renders without crashing and shows the brand.
// Real behaviour tests (State Machine, GPS Engine…) come with their engines.
describe('App', () => {
  it('renders the RÉCA OPÉRATEUR brand', () => {
    const { getByText } = render(<App />);
    expect(getByText('RÉCA')).toBeTruthy();
    expect(getByText('OPÉRATEUR')).toBeTruthy();
  });
});
