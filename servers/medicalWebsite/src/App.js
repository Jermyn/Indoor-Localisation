import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Routes from "./Routes";
// import { BrowserRouter, Switch, Route } from 'react-router-dom'
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      page: "Login"
    };
  }


  render() {

    return (
        <div className="App">
          <Routes />
        </div>
    );
  }
}

export default App;
