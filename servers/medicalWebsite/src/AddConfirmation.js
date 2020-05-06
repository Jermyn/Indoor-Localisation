import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { addUsername, loadMap, editPatient, signOutUser } from "./actions/index";
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
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import HealthChart from "./HealthChart";
import axios from 'axios';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import WorkIcon from '@material-ui/icons/Work';
import BeachAccessIcon from '@material-ui/icons/BeachAccess';
import PersonIcon from '@material-ui/icons/Person';
import ListSubheader from '@material-ui/core/ListSubheader';

const graphqlUrlHTTPS = 'http://137.132.165.139:3000/graphql';


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
    padding: '1.5rem',
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
    padding: '16px 32px 24px',
    width: 'auto',
    // [theme.breakpoints.up("sm")]: {
    //   width: '560px'
    // }
  },
  demoOne: {
    padding: '16px 32px 5px',
    // [theme.breakpoints.up("sm")]: {
    //   width: '560px'
    // }
  }

});

const mapStateToProps = state => {
  return {
    confirmType: state.confirmType ,
    edit: state.edit,
    isAuthenticating: state.isAuthenticating,
    authenticated: state.authenticated,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    addUsername: username => dispatch(addUsername(username)),
    editPatient: patient => dispatch(editPatient(patient)),
    loadMap: map => dispatch(loadMap(map)),
    signOutUser: credentials => dispatch(signOutUser(credentials))
  };
};

class AddConfirmation extends Component {
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
      ward: "Ward 52",
      tab: 0,
      type: "",
      beacon: "b30",
      edit: false,
      age: ""
    };

  }

  componentDidMount() {

    if(this.props.confirmType == null) {
      this.props.history.push('/home')
    } else {
    if(this.props.confirmType.confirm == null) {

    } else {
      this.setState({name: this.props.confirmType.confirm.name})
      this.setState({ward: this.props.confirmType.confirm.ward})
      this.setState({type: this.props.confirmType.confirm.type})
      this.setState({beacon: this.props.confirmType.confirm.beacon})

      if(this.props.confirmType.confirm.type == "Patient" | this.props.confirmType.confirm.type == "Staff") {
        this.setState({age: this.props.confirmType.confirm.age})
        this.setState({race: this.props.confirmType.confirm.race})
        this.setState({gender: this.props.confirmType.confirm.gender})
      }

      if(this.props.confirmType.confirm.type == "Asset") {
        this.setState({owner: this.props.confirmType.confirm.owner})
      }

      if(this.props.confirmType.confirm.type == "Patient") {
        this.setState({devices: this.props.confirmType.confirm.devices})
      }

    }
  }
    if(this.props.edit != "") {
      this.setState({edit: true})
    }
  }

  componentDidUpdate() {
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

  backToMap = (e) => {
    e.preventDefault();
    this.props.history.push('/locationTracking');
  }

  handleAddAnother = (e) => {
    e.preventDefault();
    if(this.state.type == "Patient") {
      this.props.history.push('/addPatient');
    } else if (this.state.type == "Staff") {
      this.props.history.push('/addStaff');
    } else {
      this.props.history.push('/addAsset');
    }

  }

  handleToMap = (e) => {
    e.preventDefault();
    this.load(this.state.ward);
    if(this.state.edit)
      this.props.editPatient("");
    this.props.history.push('/locationTracking');


  }

  request = ({query, variables}) => {
    let promise = axios({
      method:   'post',
      url:      `${graphqlUrlHTTPS}`,
      headers:  {'Content-Type': 'application/json'},
      data:     JSON.stringify({query, variables})
    })
    return promise;
  }

  load = (id) => {
    let query = `
      query {
        map (id: "${id}") {
          id
          scale
          coordinates
          imageURL
          navMesh
          navPath
          pois
        }
      }
    `
    this.request({query})
    .then ((data) => {
      this.props.loadMap(data.data.data.map);
    })
  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }

  handleChange = prop => event => {
    this.setState({ [prop]: event.target.value });
  };

  handleTabChange = (event, value) => {
   this.setState({ tab: value });
 };

 handleLogOut = () => {
   this.handleClose()
   this.props.signOutUser()
 }

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

  renderInformation = () => {
    let listitems = []
    if(this.state.type == "Patient" | this.state.type == "Staff") {
      if(this.state.age != "") {
        listitems.push(
          <div>
          <ListItem>
            <Grid item xs={4} style={{textAlign: 'center'}}>
              <Typography variant="body1">Age:</Typography>
            </Grid>
            <Grid item xs={8} style={{textAlign: 'center'}} >
              <Typography variant="body1">{this.state.age}</Typography>
            </Grid>
          </ListItem>
          <Divider variant="middle"/>
          </div>
        )
      }



      if(this.state.gender != "") {
        let gender = ''
        if(this.state.gender == 'male') {
          gender = 'Male'
        } else {
          gender = 'Female'
        }
        listitems.push(
          <div>
          <ListItem>
            <Grid item xs={4} style={{textAlign: 'center'}}>
              <Typography variant="body1">Gender:</Typography>
            </Grid>
            <Grid item xs={8} style={{textAlign: 'center'}} >
              <Typography variant="body1">{gender}</Typography>
            </Grid>
          </ListItem>
          <Divider variant="middle"/>
          </div>
        )
      }

      if(this.state.race != "") {
        listitems.push(
          <div>
          <ListItem>
            <Grid item xs={4} style={{textAlign: 'center'}}>
              <Typography variant="body1">Race:</Typography>
            </Grid>
            <Grid item xs={8} style={{textAlign: 'center'}} >
              <Typography variant="body1">{this.state.race}</Typography>
            </Grid>
          </ListItem>
          <Divider variant="middle"/>
          </div>
        )
      }
    } else if(this.state.type == 'Asset') {
      if(this.state.owner != "") {
        listitems.push(
          <div>
          <ListItem>
            <Grid item xs={4} style={{textAlign: 'center'}}>
              <Typography variant="body1">Owner:</Typography>
            </Grid>
            <Grid item xs={8} style={{textAlign: 'center'}} >
              <Typography variant="body1">{this.state.owner}</Typography>
            </Grid>
          </ListItem>
          <Divider variant="middle"/>
          </div>
        )
      }
    }

    if(this.state.type == "Patient") {
      let devices = ''
      if(this.state.devices != null && this.state.devices[0] != "None") {
        this.state.devices.map((device) => {
         devices += `${device.id} `
        })

        listitems.push(
          <div>
          <ListItem>
            <Grid item xs={4} style={{textAlign: 'center'}}>
              <Typography variant="body1">Devices:</Typography>
            </Grid>
            <Grid item xs={8} style={{textAlign: 'center'}} >
              <Typography variant="body1">{devices}</Typography>
            </Grid>
          </ListItem>
          <Divider variant="middle"/>
          </div>
        )
      }
    }
    if(listitems.length == 0) {
      listitems.push(
        <div>
        <ListItem>
          <Grid item xs={12} style={{textAlign: 'center'}}>
            <Typography variant="body1">-None-</Typography>
          </Grid>

        </ListItem>

        </div>
      )
    }
    return listitems
  }
  render() {

    const { classes } = this.props;
    const { anchorEl, auth } = this.state;
    const open = Boolean(anchorEl)

    return (
      <div className={classes.root}>
        <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}>
          <Toolbar>
            <IconButton className={classes.menuButton} color="inherit" aria-label="Menu" onClick={this.toggleDrawer}>
              <MenuIcon />
            </IconButton>
            <Typography variant="title" className={classes.grow} style={{color: "black"}}>
              {this.state.edit ? 'Edit' : 'Add'} {this.state.type}
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
            style={{ minHeight: '75vh'}}
          >
            <Grid item xs={12}>
              <Typography variant="h5" style={{marginBottom: '2em'}} gutterBottom>{this.state.type} Successfully {this.state.edit ? 'Edited' : 'Added'}!</Typography>
              <Card style={{marginTop: '2em', width:'min-content', margin: 'auto'}}>
                <CardContent style={{paddingBottom: '5px', paddingTop: '5px', textAlign: 'center'}}>
                  <Grid container style={{alignItems: 'center'}}>
                    <Grid item xs={12} style={{minWidth: '300px'}}>
                      <Avatar style={{margin:'auto', marginTop: '1em', backgroundColor: 'orange'}}>
                      {this.state.type == "Patient" ? <i className="fas fa-user-injured"></i> : null}
                      {this.state.type == "Asset" ? <i className="fas fa-laptop-medical"></i> : null}
                      {this.state.type == "Staff" ? <i className="fas fa-user-md"></i> : null}
                      </Avatar>
                      <Typography variant="h5" style={{marginTop: '0.5em'}}>{this.state.name}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography className={classes.pos} color="textSecondary">
                        {this.state.ward}
                      </Typography>
                      <Chip
                        icon={<LocationOnIcon />}
                        label={this.state.beacon != "" ? this.state.beacon[0] : 'Unassigned'}
                        className={classes.chip}
                        variant="outlined"
                        style={{marginTop: '1em'}}
                      />
                      <Divider variant="middle" style={{marginTop: '1em'}} />
                    </Grid>
                    <Grid item xs={12} style={{textAlign: 'left', marginTop: '1em', marginLeft: '1em'}}>
                      <Typography color="textSecondary">Information</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <List>
                        {this.renderInformation()}
                      </List>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          <Grid item xs={6} style={{ textAlign: 'center', paddingTop: '2em'}}>
            {this.state.edit ? "" :
            <Button variant="outlined" onClick={(event) => this.handleAddAnother(event)}>
              Add Another {this.state.type}
            </Button>
            }
          </Grid>
          <Grid item xs={6} style={{ textAlign: 'center', paddingTop: '2em'}}>
            <Button variant="outlined" onClick={this.handleToMap}>
              Map: {this.state.ward}
            </Button>
          </Grid>
          </Grid>
        </Grid>
      </div>
    )
  }
}

const ConnectedAddConfirmation = connect(mapStateToProps, mapDispatchToProps)(AddConfirmation);

export default withStyles(styles)(ConnectedAddConfirmation);
