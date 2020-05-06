import React, { Component } from "react";
import Button from '@material-ui/core/Button';
import { Link } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import AccountCircle from '@material-ui/icons/AccountCircle';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import TemporaryDrawer from './TemporaryDrawer.js';
import LinearProgress from '@material-ui/core/LinearProgress';
import { verifyAuth, signOutUser } from "./actions/index";

const styles = {
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
    opacity : 0.4,
    color: 'black',
  },
  buttons: {
    display: 'flex',
    width: '450px',
    margin: 'auto',
    marginTop: '1rem',
    justifyContent: 'space-evenly',
  },
  addButton: {
    paddingLeft: '8px'
  },
  card: {
    maxWidth: 345,
  },
  lander: {
    marginTop: '1.5rem'
  },
  media: {
    // ⚠️ object-fit is not supported by IE 11.
    objectFit: 'cover',
  },
  cardsFlex: {
    paddingTop: '3em',
  },
  title: {
    paddingBottom: '.3em',
    paddingTop: '1em',
  },
  AppBar: {
    borderBottom: '1px solid #f2f3f3',
  }
};

const mapStateToProps = state => {

  return {
    username: state.username,
    authenticated: state.authenticated,
    isAuthenticating: state.isAuthenticating,
   };
};

const mapDispatchToProps = dispatch => {
  return {
    signOutUser: username => dispatch(signOutUser(username)),
    verifyAuth: credentials => dispatch(verifyAuth(credentials)),
  };
};

class Home extends Component {

  constructor(props) {
    super(props);
    this.state = {
      username: this.props.username,
      anchorEl: null,
      auth: true,
      drawer: false,
      isAuthenticating: true
    };
  }

  componentDidUpdate(prevProps) {
    if(this.props.username != prevProps.username) {
      this.setState({username: this.props.username})
    }

    if(this.props.isAuthenticating == false && this.props.authenticated == false) {
      this.props.history.push('/');
    }
  }
  toggleDrawer = () => {
    this.setState({ drawer: true});
  }
  handleChange = event => {
    this.setState({ auth: event.target.checked });
  };

  handleMenu = event => {
    this.setState({ drawer: false });
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleLogOut = () => {
    this.setState({ anchorEl: null });
    this.props.signOutUser()
  }

renderUsername = () => {
  let username = this.state.username;
  if(username != null) {
    username = username.charAt(0).toUpperCase() + username.slice(1);
    let split = username.split("@")
    username = split[0]
  }
  return username
}

render() {
  const { classes } = this.props;
  const { anchorEl, auth } = this.state;
  const open = Boolean(anchorEl)
  if(this.props.isAuthenticating) {
    return <LinearProgress />
  } else {
    return (
      <div className={classes.root}>
        <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}} className={classes.AppBar}>
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer}>
              <MenuIcon />
            </IconButton>
            <Typography variant="title" className={classes.grow} style={{color: "black"}}>
              Home
            </Typography>
            {auth && (
                <div>
                  <IconButton
                    aria-owns={open ? 'menu-appbar' : null}
                    aria-haspopup="true"
                    onClick={this.handleMenu}
                    color="inherit"
                  >
                    <AccountCircle style={{color: "black"}} />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={open}
                    onClose={this.handleClose}
                  >
                    <MenuItem onClick={this.handleLogOut}>Logout</MenuItem>
                  </Menu>
                </div>
              )}
          </Toolbar>
        </AppBar>
        <TemporaryDrawer toggle={this.state.drawer} />
        <Grid container className={classes.root}>
          <Grid item xs={12}>
            <Grid
              className={classes.title}
              container
              spacing={16}
              alignItems={'center'}
              direction={'row'}
              justify={'center'}
            >
              <Typography variant="h4" gutterBottom className={classes.title}>
                Welcome {this.renderUsername()}!
              </Typography>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid
              container
              spacing={40}
              alignItems={'center'}
              direction={'row'}
              justify={'center'}
            >
              <Grid item>
                <Button component={Link} to="/addPatient" variant="outlined" color="primary" className={classes.addButton}>
                  <AddIcon /> Patient
                </Button>
              </Grid>
              <Grid item>
                <Button component={Link} to="/addAsset" variant="outlined" color="primary" className={classes.addButton}>
                  <AddIcon /> Asset
                </Button>
              </Grid>
              <Grid item>
                <Button component={Link} to="/addStaff" variant="outlined" color="primary" className={classes.addButton} >
                  <AddIcon /> Staff
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Grid
              container
              className={classes.cardsFlex}
              spacing={40}
              alignItems={'center'}
              direction={'row'}
              justify={'center'}
            >
              <Grid item>
                <Card className={classes.card}>
                  <CardActionArea
                    component={Link}
                    to="/locationTracking">
                    <CardMedia
                      component="img"
                      alt="Contemplative Reptile"
                      className={classes.media}
                      height="180"
                      image="img/LocationTracking.jpg"
                      title="Location Tracking"
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="h2">
                        Location & Status Tracking
                      </Typography>
                      <Typography component="p">
                        Shows locations and statuses of patients, assets and staff
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
              <Grid item>
                <Card className={classes.card}>
                  <CardActionArea
                    component={Link}
                    to="/contactTracing">
                    <CardMedia
                    component="img"
                    alt="Contemplative Reptile"
                    className={classes.media}
                    height="180"
                    image="img/ContactTracing.jpg"
                    title="Contact Tracing"
                  />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="h2">
                        Contact Tracing
                      </Typography>
                      <Typography component="p">
                        Identify contact between the infected and other patients
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </div>
    );
  }
  }
}
const ConnectedHome = connect(mapStateToProps, mapDispatchToProps)(Home);
export default withStyles(styles)(ConnectedHome);
