import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { addUsername, signOutUser } from "./actions/index";
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
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import ConnectedPotentialInfectedTable from './PotentialInfectedTable';
import ConnectedContactTraceMap from './ContactTraceMap';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

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
  },
  demo: {
    padding: '16px 24px 24px',
    [theme.breakpoints.up("sm")]: {
      width: '560px'
    },
    [theme.breakpoints.up("md")]: {
      width: '700px'
    },
    [theme.breakpoints.up("lg")]: {
      width: '800px'
    }
  }
});

const mapStateToProps = state => {
  return {
    beacon: state.beacon,
    contactTrace: state.contactTrace,
    filterTrace: state.filterTrace,
    traceDetails: state.traceDetails,
    isAuthenticating: state.isAuthenticating,
    authenticated: state.authenticated
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addUsername: username => dispatch(addUsername(username)),
    signOutUser: credentials => dispatch(signOutUser(credentials)),
  };
};

let id = 0;
function createData(name, calories, fat, carbs, protein) {
  id += 1;
  return { id, name, calories, fat, carbs, protein };
}

const rows = [
  createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
  createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
  createData('Eclair', 262, 16.0, 24, 6.0),
  createData('Cupcake', 305, 3.7, 67, 4.3),
  createData('Gingerbread', 356, 16.0, 49, 3.9),
];

class ContactTracingResults extends Component {
  constructor(props) {
    super(props);

    this.state = {
      anchorEl: null,
      auth: true,
      name: "Santa Claus",
      owner: "",
      image: "",
      imagePreview: "",
      imageName: "",
      ward: "",
      potential: [],
      contactDistance: "",
      beacon: this.props.beacon,

    };
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.props.isAuthenticating == false && this.props.authenticated == false) {
      this.props.history.push('/');
    }
  }

  componentDidMount() {
    if(this.props.filterTrace != null) {
      this.findPotential()
    } else {
      this.props.history.push('/contactTracing')
    }
  }
  toggleDrawer = () => {
    this.setState({ drawer: true});
  }

  toggleCloseDrawer = () => {
    this.setState({drawer: false})
  }

  findPotential = () => {
    let contactTrace = this.props.filterTrace;

    let potential = [];
    let id = 1;
    let primaryContacts = contactTrace
    let secondaryContacts = contactTrace.secondary_contacts

    for (const key of Object.keys(primaryContacts)) {
      let time = this.formatUnix(primaryContacts[key]);
      let patient = {
        contact: key,
        timestamp: time,
        location: "Ward 52",
        id: id,
      }
      id += 1
      potential.push(patient)

    }
    this.setState({potential: potential})
  }

  formatDate = () => {
    let contactTrace = this.props.contactTrace
    let startDate = contactTrace[0].timestamp;
    let endDate = contactTrace[contactTrace.length-1].timestamp
    startDate = this.formatUnix(startDate)
    endDate = this.formatUnix(endDate)

    let timeRange = `${startDate} to ${endDate}`
    return timeRange
  }

  handleLogOut = () => {
    this.handleClose()
    this.props.signOutUser()
  }

  formatUnix = (unixDate) => {
    let unix = unixDate
    let months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let date = new Date(unix*1000);
    let year = date.getFullYear();
    let month = months_arr[date.getMonth()];
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();
    let convdataTime = day+'-'+month+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return convdataTime
  }

  handleMenu = event => {
    this.setState({ drawer: false });
    this.setState({ anchorEl: event.currentTarget });
  };

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    this.props.history.push('/home');

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

  removeImage = () => {
    this.setState({image : ""});
    this.setState({imagePreview : ""});
    this.setState({imageName: ""});
  }

  cancel = () => {
    this.props.history.push('/home');
  }

  updateTime = (timestamp) =>{
  }
  render() {

    const { classes } = this.props;
    const { anchorEl, auth } = this.state;
    const open = Boolean(anchorEl)
    const races = ['Chinese', 'Malay', 'Indian', 'Others'];
    let imagePreview = this.state.imagePreview;
    let imageName = this.state.imageName;

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
        <Grid container justify="center">
          <Grid container
            className={classes.demo}
            justify="center"
            spacing={0}
            alignItems="center"
            >
            <Grid item xs={12}>
              <Typography variant="h4" gutterBottom>Contact Tracing</Typography>
              <Typography variant="h5" gutterBottom>Results</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="h6" paragraph>Infected</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle1" paragraph>{this.props.traceDetails != null ? this.props.traceDetails.name : 'Santa Claus'}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="h6" paragraph>Contact Distance</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle1" paragraph>{this.props.traceDetails != null ? this.props.traceDetails.contactDistance : null}</Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="h6" paragraph>Length Of Stay</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle1" paragraph> {this.props.traceDetails != null ? this.formatDate() : null}</Typography>
            </Grid>
          </Grid>
        </Grid>
        <div className={classes.layout} style={{width: 'auto'}}>
          <ConnectedContactTraceMap />
        </div>
        <Grid container justify="center">
          <Grid container
            className={classes.demo}
            justify="center"
            spacing={0}
            alignItems="center"
          >
            <Grid item xs={12}>
              <ConnectedPotentialInfectedTable potential={this.state.potential} updateTime={this.updateTime}/>
            </Grid>
          </Grid>
        </Grid>
      </div>
    )
  }
}

const ConnectedContactTracingResults = connect(mapStateToProps, mapDispatchToProps)(ContactTracingResults);

export default withStyles(styles)(ConnectedContactTracingResults);
