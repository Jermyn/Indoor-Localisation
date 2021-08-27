import React, { Component } from "react";

export class Redirect extends Component {
  constructor( props ){
    super();
    this.state = { ...props };
  }
  componentWillMount(){
    window.location.replace('https://mysterious-hamlet-62469.herokuapp.com')
  }
  render(){
    return (<section>Redirecting...</section>);
  }
}

export default Redirect;