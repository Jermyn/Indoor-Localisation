import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import './index.css';
import App from './App';
// import { createStore, applyMiddleware } from 'redux'
import registerServiceWorker from './registerServiceWorker';
// import * as serviceWorker from './serviceWorker';
// import thunk from 'redux-thunk'
import { BrowserRouter as Router } from "react-router-dom";
// import routeReducer from './store/reducers/routeReducer'
import store from "./store/index";

// const store = createStore(routeReducer, applyMiddleware(thunk));

// ReactDOM.render(<Provider store={store}><App /></Provider>, document.getElementById('root'));
// serviceWorker.unregister();
ReactDOM.render(
    <Provider store={store}>
      <Router>
        <App />
      </Router>
    </Provider>,
    document.getElementById('root')
  );
  registerServiceWorker();
