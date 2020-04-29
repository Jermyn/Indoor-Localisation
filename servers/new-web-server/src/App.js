import React, { Component } from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import './App.css';
import Layout from './pages/Layout'
import Drawer from './components/layout/Drawer'
import Devices from './pages/Devices'
import Maps from './pages/Maps'
import Locate from './pages/Locate'

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div className="App">
          <Drawer/>
            <Switch>
              <Route exact path='/' component={Layout}/>
              <Route path='/Devices' component={Devices} />
              <Route path='/Maps' component={Maps} />
              <Route path='/Locate' component={Locate} />
            </Switch>
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
