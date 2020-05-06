import React, { Component } from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import { withStyles } from '@material-ui/core/styles';
import { connect } from "react-redux";
import { addAsset, confirmType, fetchMaps, updateAsset, updateAssetCount, fetchAssetCount, removeAsset, assignBeacon, editPatient, signOutUser } from "./actions/index";
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
import Select from 'react-select';
import axios from 'axios';
import NoSsr from '@material-ui/core/NoSsr';
import Paper from '@material-ui/core/Paper';
import Chip from '@material-ui/core/Chip';
import LinearProgress from '@material-ui/core/LinearProgress';
import CancelIcon from '@material-ui/icons/Cancel';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

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
  input: {
    display: 'flex',
    padding: 0,
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
    overflow: 'hidden',
    padding: '18.5px 14px',
  },
  noOptionsMessage: {
   padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
 },
 singleValue: {
    fontSize: 16,
  },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
    padding: '18.5px 14px',
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
});

const mapStateToProps = state => {
  return {
    beacon: state.beacon,
    maps: state.maps,
    edit: state.edit,
    isAuthenticating: state.isAuthenticating,
    authenticated: state.authenticated,
    assetCounter: state.assetCounter
  };
};

const mapDispatchToProps = dispatch => {
  return {
    confirmType: type => dispatch(confirmType(type)),
    addAsset: asset => dispatch(addAsset(asset)),
    removeAsset: asset => dispatch(removeAsset(asset)),
    fetchMaps: maps => dispatch(fetchMaps(maps)),
    assignBeacon: beacon => dispatch(assignBeacon(beacon)),
    editPatient: patient => dispatch(editPatient(patient)),
    signOutUser: credentials => dispatch(signOutUser(credentials)),
    fetchAssetCount: count => dispatch(fetchAssetCount(count)),
    updateAssetCount: count => dispatch(updateAssetCount(count)),
    updateAsset: asset => dispatch(updateAsset(asset)),
  };
};

function NoOptionsMessage(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.noOptionsMessage}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function inputComponent({ inputRef, ...props }) {
  return <div ref={inputRef} {...props} />;
}

function Control(props) {
  return (
    <TextField
      fullWidth
      variant="outlined"
      required={true}
      error={props.selectProps.error}
      helperText={ props.selectProps.error ? "This field is required" : null}
      InputProps={{
        inputComponent,
        inputProps: {
          className: props.selectProps.classes.input,
          inputRef: props.innerRef,
          children: props.children,
          ...props.innerProps,
        },
      }}
      {...props.selectProps.textFieldProps}
    />
  );
}

function Option(props) {
  return (
    <MenuItem
      buttonRef={props.innerRef}
      selected={props.isFocused}
      component="div"
      style={{
        fontWeight: props.isSelected ? 500 : 400,
      }}
      {...props.innerProps}
    >
      {props.children}
    </MenuItem>
  );
}

function Placeholder(props) {
  return (
    <Typography
      color="textSecondary"
      className={props.selectProps.classes.placeholder}
      {...props.innerProps}
    >
      {props.children}
    </Typography>
  );
}

function SingleValue(props) {
  return (
    <Typography className={props.selectProps.classes.singleValue} {...props.innerProps}>
      {props.children}
    </Typography>
  );
}

function ValueContainer(props) {
  return <div className={props.selectProps.classes.valueContainer}>{props.children}</div>;
}

function MultiValue(props) {
  return (
    <Chip
      tabIndex={-1}
      label={props.children}
      className={classNames(props.selectProps.classes.chip, {
        [props.selectProps.classes.chipFocused]: props.isFocused,
      })}
      onDelete={props.removeProps.onClick}
      deleteIcon={<CancelIcon {...props.removeProps} />}
    />
  );
}

function SubMenu(props) {
  return (
    <Paper square className={props.selectProps.classes.paper} {...props.innerProps}>
      {props.children}
    </Paper>
  );
}

const components = {
  Control,
  SubMenu,
  MultiValue,
  NoOptionsMessage,
  Option,
  Placeholder,
  SingleValue,
  ValueContainer,
};

class AddAsset extends Component {
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
      type: "Asset",
      beacon: this.props.beacon,
      nameError: false,
      wardError: false,
      editSuccess: false,
    };
  }

  componentWillUnmount() {
    if(this.state.editSuccess == false) {
      this.props.editPatient('')
    }
  }

  componentDidMount() {
    this.fetch();
    this.props.fetchAssetCount()
    if(this.props.edit != "" && this.props.edit != null) {
      let edit = this.props.edit;
      this.setState({
        name: edit.name,
        owner: edit.owner,
        image: edit.image,
        imageName: edit.imageName,
        ward: {value: edit.ward, label: edit.ward},
        edit: true,
      })
    } else {
      this.flushData()
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.edit == true && this.props.edit == "") {
      this.flushData()
    }

    if(this.props.isAuthenticating == false && this.props.authenticated == false) {
      this.props.history.push('/');
    }
  }

  flushData = () => {
    this.setState({
      name: "",
      owner: "",
      image: "",
      imageName: "",
      ward: "",
      edit: false,
    })
    let chosen = ""
    this.props.assignBeacon( chosen );
  }
  createOptions = (maps) => {
    let options = maps.map((map) => ({
      value: map.id,
      label: map.id,
    }))

    this.setState({options})
  }

  fetch = (dispatch) => {
    let query = `
      query {
        maps {
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
    .then (data => {
      this.props.fetchMaps(data.data.data.maps);
      this.createOptions(data.data.data.maps);
    })
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
    this.setState({ drawer: false });
    this.setState({ anchorEl: null });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { type } = this.state;
    this.handleClose()
    let errorCheck = false

    if(this.state.name == "") {
      this.setState({nameError: true})
      errorCheck = true
    }

    if(this.state.ward.value == null) {
      this.setState({wardError: true})
      errorCheck = true
    }

    if(errorCheck)
      return
    let asset = {
      name: this.state.name,
      image: this.state.image,
      imageName: this.state.imageName,
      owner: this.state.owner,
      ward: this.state.ward.value,
      beacon: this.props.beacon,
      highlight: false,
     }
    let confirm = {
      name: this.state.name,
      image: this.state.image,
      imageName: this.state.imageName,
      owner: this.state.owner,
      ward: this.state.ward.value,
      beacon: this.props.beacon,
      type: type}
    if(this.state.edit) {
      asset.id = this.props.edit.id
      this.props.updateAsset(asset)
      this.setState({editSuccess: true})
    } else {
      this.props.updateAssetCount(this.props.assetCounter.count)
      this.props.addAsset(asset);
    }
    this.props.confirmType({ confirm })

    let chosenBeacon = "None"
    this.props.assignBeacon( chosenBeacon );
    this.props.history.push('/addConfirmation');

  }

  removeAsset = () => {
    this.props.removeAsset(this.props.edit)
    this.props.history.push('/locationTracking')
  }

  handleLoading = () => {
    this.setState(state => ({
      loading: !state.loading,
    }))
  }

  handleChange = prop => event => {
    if(prop == "ward")
      this.setState({ [prop]: event });
    else
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

  handleLogOut = () => {
    this.handleClose()
    this.props.signOutUser()
  }

  cancel = () => {
    if(this.state.edit) {
      this.props.history.push('/locationTracking')
    } else
      this.props.history.push('/home');
  }
  render() {

    const { classes, theme } = this.props;
    const { anchorEl, auth } = this.state;
    const open = Boolean(anchorEl)
    const races = ['Chinese', 'Malay', 'Indian', 'Others'];
    let imagePreview = this.state.imagePreview;
    let imageName = this.state.imageName;

    const selectStyles = {
      input: base => ({
        ...base,
        color: theme.palette.text.primary,
        '& input': {
          font: 'inherit',
        },
      }),
    };
    // <CardMedia style={{height:'40vh'}} image={imagePreview} />
    // <CardContent>
    // <Typography component="p">{imageName}</Typography>
    // </CardContent>
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
              {this.state.edit ? 'Edit' : 'Add'} Asset
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
          <form className={classes.align}>
          <Grid container
            direction="column"
            spacing={0}
            alignItems="center"
            style={{ minHeight: '75vh'}}>
            <Grid item xs={12}>
              <div className={classes.layout}>
                <Grid container>
                  <Grid item xs={6}>
                    <Typography variant="h4" gutterBottom>Asset</Typography>
                  </Grid>
                  <Grid item xs={6} style={{margin: 'auto'}}>
                    {this.state.edit ? <Button variant="outlined" onClick={this.removeAsset} style={{float: 'right'}}> Delete </Button> : null}
                  </Grid>
                </Grid>
                <FormControl margin="normal" required fullWidth>
                  <TextField
                    label="Name"
                    placeholder="Name"
                    autoComplete="name"
                    variant="outlined"
                    fullWidth
                    value={this.state.name}
                    className={classes.textField}
                    required = {true}
                    error={this.state.nameError}
                    helperText={this.state.nameError ? "This field is required" : null}
                    onChange = {(e) => this.setState({name:e.target.value})}
                  />
                </FormControl>
                <Typography variant="h6" gutterBottom>Photo</Typography>
                { this.state.image == "" ?
                <Card style={{width: '100%'}}>
                  <label htmlFor="raised-button-file">
                    <Button raised="true" component="span" style={{height:'35vh', width: '100%'}}className={classes.button}>
                      <Typography variant="h5" gutterBottom className={classes.label}>  Take A Photo </Typography>
                      <CameraIcon className={classes.cameraIcon}/>
                    </Button>
                  </label>
                </Card> :
                <Card>
                  <CardMedia style={{height:'35vh', backgroundSize:'contain'}} image={imagePreview} />
                  <CardContent className={classes.cardContent}>
                    <Grid container
                      direction="row"
                      alignItems="center"
                    >
                      <Grid item xs={9}>
                        <Typography variant="subtitle2">{imageName}</Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <label htmlFor="raised-button-file">
                          <IconButton color="primary" className={classes.button} component="span">
                            <CameraIcon />
                          </IconButton>
                        </label>

                        <IconButton className={classes.button} aria-label="Delete" onClick={this.removeImage}>
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions style={{display: 'none'}}/>
                </Card>
                }

                <input
                  accept="image/*"
                  className={classes.input}
                  style={{display: 'none'}}
                  id="raised-button-file"
                  type="file"
                  onChange={this.imageUpload}
                  onClick={(event)=> {
                    event.target.value = null
                  }}
                />
              </div>
            <Grid container
              direction="row"
              spacing={0}
              alignItems="center"
            >
              <Grid item xs={12}>
                <FormControl margin="normal" required fullWidth>
                  <TextField
                    label="Owner"
                    placeholder="Owner"
                    variant="outlined"
                    fullWidth
                    value={this.state.owner}
                    className={classes.textField}
                    onChange = {this.handleChange('owner')}
                  />
                </FormControl>
                <FormControl margin="normal" required fullWidth>
                  <NoSsr>
                    <Select
                      classes={classes}
                      styles={selectStyles}
                      options={this.state.options}
                      components={components}
                      value={this.state.ward}
                      onChange={this.handleChange('ward')}
                      error={this.state.wardError}
                      placeholder="Ward*"
                      isClearable
                    />
                  </NoSsr>
                </FormControl>
                <BeaconTable />
              </Grid>
            </Grid>
            <br/>
            <div style={{ textAlign: 'center', paddingTop: '1rem'}}>
              <Button variant="contained" color="primary" onClick={(event) => this.handleSubmit(event)}>
                Submit
              </Button>
              <Button style={{marginLeft: '3em'}} onClick={this.cancel}>
                Cancel
              </Button>
            </div>
            </Grid>
          </Grid>
          </form>
        </div>
    )
  }
}

const ConnectedAddAsset = connect(mapStateToProps, mapDispatchToProps)(AddAsset);

export default withStyles(styles, {withTheme: true})(ConnectedAddAsset);
