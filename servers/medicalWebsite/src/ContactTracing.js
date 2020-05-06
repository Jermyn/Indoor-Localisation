import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { addUsername, fetchContactTrace, fetchingProcess, signOutUser } from "./actions/index";
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CircularProgress from '@material-ui/core/CircularProgress';
import TemporaryDrawer from './TemporaryDrawer';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import classNames from 'classnames';
import InputAdornment from '@material-ui/core/InputAdornment';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import BeaconTable from './BeaconTable';
import CameraIcon from '@material-ui/icons/PhotoCamera';
import DeleteIcon from '@material-ui/icons/Delete';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import LinearProgress from '@material-ui/core/LinearProgress';

const styles = theme => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  root: {
    flexGrow: 1,
  },
  grow: {
    flexGrow: 1,
  },
  card: {
    minWidth: 275,
    padding: '2rem'
  },
  textField: {
    // marginLeft: theme.spacing.unit,
    // marginRight: theme.spacing.unit,
  },
  borderBox: {
    border: '1px solid',
    padding: '2rem',
    borderRadius: '16px',
  },
  menu: {
    width: 200,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
    opacity : 0.4,
    color: 'black',
  },
  align: {
    padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
  },
  label: {
    textTransform: 'capitalize',
  },
  cameraIcon: {
    opacity: '0.5',
    paddingLeft: '10px'
  },
  cardContent: {
    paddingBottom: '16px'
  }
});

const mapStateToProps = state => {
  return {
    beacon: state.beacon,
    fetching: state.fetching,
    contactTrace: state.contactTrace,
    isAuthenticating: state.isAuthenticating,
    authenticated: state.authenticated
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addUsername: username => dispatch(addUsername(username)),
    fetchingProcess: process => dispatch(fetchingProcess(process)),
    fetchContactTrace: traceDetails => dispatch(fetchContactTrace(traceDetails)),
    signOutUser: credentials => dispatch(signOutUser(credentials)),
  };
};

class ContactTracing extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      auth: true,
      name: "",
      owner: "",
      image: "",
      imagePreview: "",
      imageName: "",
      ward: "",
      contactDistance: "",
      beacon: this.props.beacon,
      loading: false,
      startTime: '2019-04-15T10:30',
      endTime: '2019-04-15T10:30',
      contactTraceError: "",
      error: "",
      nameError: false,
      distError: false,
    };
  }

  componentDidUpdate(prevProps, prevState) {


    if(this.props.fetching == false && prevProps.fetching == true && this.props.contactTrace != null | this.props.contactTrace != prevProps.contactTrace && this.props.contactTrace != null) {
      if(this.props.contactTrace.length == 0) {
        this.setState({contactTraceError: 'Error: There are no contact tracing data for the specified time range'})

      } else
      this.props.history.push('/contactTracingResults');
    } else if(this.props.fetching == false && prevProps.fetching == true && this.props.contactTrace == null | this.props.contactTrace != prevProps.contactTrace && this.props.contactTrace == null){
      this.setState({contactTraceError: 'Server Error: Unable to get contact trace'})
    }

    if(this.props.isAuthenticating == false && this.props.authenticated == false) {
      this.props.history.push('/');
    }
  }

  toggleDrawer = () => {
    this.setState({ drawer: true});
  }

  toggleCloseDrawer = () => {
    this.setState({drawer: false})
  }

  handleMenu = event => {
    this.setState({ drawer: false });
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleLogOut = () => {
    this.handleClose()
    this.props.signOutUser()
  }

  handleSubmit = (e) => {
    e.preventDefault();
    let errorCheck = false
    let unixStart = new Date(this.state.startTime)
    let unixEnd = new Date(this.state.endTime)
    if(this.state.contactDistance == "") {
      this.setState({distError: true})
      errorCheck = true
    }

    if(this.state.name == "") {
      this.setState({nameError: true})
      errorCheck = true
    }

    if(unixStart > unixEnd) {
      this.setState({error: 'Time range is invalid'})
      errorCheck = true
    }

    if(errorCheck) {
      return
    }
    if(unixStart <= unixEnd ) {
      let traceDetails = {
        name: this.state.name,
        contactDistance: this.state.contactDistance,
        startTime: this.state.startTime,
        endTime: this.state.endTime
      }
      this.props.fetchContactTrace(traceDetails);
      this.setState({error: ""})
    }

  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }

  handleChange = prop => event => {
    this.setState({ [prop]: event.target.value });
  };

  imageUpload = (e) => {

    if(e.target.files[0]) {
      const image = e.target.files[0];
      this.setState({image})
      this.setState({imagePreview : URL.createObjectURL(e.target.files[0])})
      this.setState({imageName : image.name})
    }

  }

  updateStart = (e) => {
    this.setState({startTime: e.target.value})
  }

  updateEnd = (e) => {
    this.setState({endTime: e.target.value})
  }

  removeImage = () => {
    this.setState({image : ""});
    this.setState({imagePreview : ""});
    this.setState({imageName: ""});
  }

  cancel = () => {
    this.props.history.push('/home');
  }
  render() {

    const { classes } = this.props;
    const { anchorEl, auth } = this.state;
    const open = Boolean(anchorEl)
    const races = ['Chinese', 'Malay', 'Indian', 'Others'];
    let imagePreview = this.state.imagePreview;
    let imageName = this.state.imageName;

    if(this.props.isAuthenticating) {
      return <LinearProgress />
    } else
    return (
      <div className={classes.root}>
        <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}>
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer}>
              <MenuIcon />
            </IconButton>
            <Typography variant="title" className={classes.grow} style={{color: "black"}}>
              Contact Tracing
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
        <ClickAwayListener onClickAway={this.toggleCloseDrawer}>
          <TemporaryDrawer toggle={this.state.drawer} />
        </ClickAwayListener>
        <form className={classes.align} onSubmit={this.handleSubmit}>
          <Grid container
            direction="column"
            spacing={0}
            alignItems="center"
            style={{ minHeight: '75vh'}}>
            <Grid item xs={12}>
              <div className={classes.layout}>
                <Typography variant="h4" gutterBottom>Contact Tracing</Typography>

                <Typography variant="h6" gutterBottom>Infected</Typography>
                <Typography variant="subtitle1" style={{color: 'red'}}> {this.state.contactTraceError }  </Typography>
                <FormControl margin="normal" required fullWidth>
                  <TextField
                    label="Name"
                    placeholder="Name"
                    autoComplete="name"
                    variant="outlined"
                    disabled={this.props.fetching}
                    fullWidth
                    className={classes.textField}
                    onChange = {(e) => this.setState({name:e.target.value})}
                    required
                    helperText={this.state.nameError ? "This field is required" : null}
                    error={this.state.nameError}
                  />
                </FormControl>

                <FormControl margin="normal" required fullWidth>
                  <TextField
                    label="Contact Distance (m)"
                    placeholder="Contact Distance (m)"
                    variant="outlined"
                    disabled={this.props.fetching}
                    fullWidth
                    className={classes.textField}
                    helperText={this.state.distError ? "This field is required" : null}
                    error={this.state.distError}
                    required
                    onChange = {(e) => this.setState({contactDistance:e.target.value})}
                  />
                </FormControl>

                <div>
                  <TextField
                    id="datetime-local"
                    label="Start"
                    variant="outlined"
                    type="datetime-local"
                    style={{marginRight: '1em', marginTop: '1em'}}
                    defaultValue={this.state.startTime}
                    className={classes.textField}
                    onChange={this.updateStart}
                    disabled={this.props.fetching}
                    error={this.state.error == "" ? false : true }
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />

                  <TextField
                    id="datetime-local"
                    label="End"
                    type="datetime-local"
                    variant="outlined"
                    style={{marginTop: '1em'}}
                    defaultValue={this.state.endTime}
                    error={this.state.error == "" ? false : true }
                    className={classes.textField}
                    onChange={this.updateEnd}
                    disabled={this.props.fetching}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </div>
              </div>
              <br/>
              <div style={{ textAlign: 'center', paddingTop: '1rem'}}>
                {this.props.fetching ? <CircularProgress className={classes.progress} /> :
                <div>
                  <Button type='submit' variant="contained" color="primary">
                    Submit
                  </Button>
                  <Button style={{marginLeft: '3em'}} onClick={this.cancel}>
                    Cancel
                  </Button>
                </div>
                }
              </div>
            </Grid>
          </Grid>
        </form>
      </div>
    )
  }
}

const ConnectedContactTracing = connect(mapStateToProps, mapDispatchToProps)(ContactTracing);

export default withStyles(styles)(ConnectedContactTracing);
