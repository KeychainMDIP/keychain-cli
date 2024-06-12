import * as keymaster from './keymaster-browser.js';
import KeymasterUI from './KeymasterUI.js';
import './App.css';

function App() {
    return (
        <KeymasterUI keymaster={keymaster} title={'Keymaster Wallet Demo'} />
    );
}

export default App;
