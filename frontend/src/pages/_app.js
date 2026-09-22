import '@/styles/globals.css';
import { Provider } from 'react-redux';
import { wrapper } from '@/config/redux/store'; // 🔧 Use wrapper instead of direct store import
import '@fortawesome/fontawesome-free/css/all.min.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function MyApp({ Component, ...rest }) {
  const { store, props } = wrapper.useWrappedStore(rest); // 🔧 Correct usage for SSR support

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <Component {...props.pageProps} />
      </Provider>
    </GoogleOAuthProvider>
  );
}

export default MyApp;
